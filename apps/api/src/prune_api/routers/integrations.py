"""Universal Integration Webhook Router.

Endpoints:
  GET  /v1/integrations/registry          — full provider + event catalog
  POST /v1/integrations/{provider}/webhook — inbound events from any provider
  GET  /v1/integrations/{provider}/events  — list events for one provider

Event flow:
  1. POST /v1/integrations/{provider}/webhook
  2. Validate provider exists in registry
  3. Extract event_type from X-Integration-Event header (or body hint)
  4. normalize_event() → NormalizedEvent
  5. route_trigger_event() → find matching workflows → dispatch runs
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request

from prune_api.core.settings import settings
from prune_api.engine.trigger_router import route_trigger_event
from prune_api.integrations.normalizer import normalize_event
from prune_api.integrations.registry import (
    get_event,
    get_provider,
    list_provider_ids,
    registry_json,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Registry endpoints
# ---------------------------------------------------------------------------

@router.get("/registry")
async def get_registry() -> list[dict]:
    """Return the full integration trigger registry used by the builder UI."""
    return registry_json()


@router.get("/{provider}/events")
async def get_provider_events(provider: str) -> dict[str, Any]:
    """Return all trigger events for a single provider."""
    provider_def = get_provider(provider)
    if provider_def is None:
        raise HTTPException(status_code=404, detail=f"Unknown provider: {provider!r}")
    return {
        "provider": provider_def.id,
        "name": provider_def.name,
        "events": [
            {"id": e.id, "label": e.label, "description": e.description, "output_fields": e.output_fields}
            for e in provider_def.events
        ],
    }


# ---------------------------------------------------------------------------
# Universal webhook receiver
# ---------------------------------------------------------------------------

def _detect_event_type(provider: str, headers: dict[str, str], body: dict[str, Any]) -> str | None:
    """Heuristically extract the event type from provider-specific signals.

    Callers may also pass X-Integration-Event directly to override auto-detection.
    """
    override = headers.get("x-integration-event")
    if override:
        return override.lower().replace(" ", "_").replace("-", "_")

    # Slack
    if provider == "slack":
        event = body.get("event", {})
        slack_type = event.get("type", body.get("type", ""))
        mapping = {
            "message":               "message_received",
            "member_joined_channel": "member_joined_channel",
            "file_shared":           "file_shared",
            "reaction_added":        "reaction_added",
        }
        return mapping.get(slack_type)

    # GitHub
    if provider == "github":
        event_header = headers.get("x-github-event", "")
        action = body.get("action", "")
        if event_header == "push":
            return "push"
        if event_header == "pull_request":
            if action == "opened":   return "pull_request_opened"
            if action in ("closed",) and body.get("pull_request", {}).get("merged"):
                return "pull_request_merged"
        if event_header == "issues":
            if action == "opened": return "issue_created"
            if action == "closed": return "issue_closed"
        if event_header == "release" and action == "published":
            return "release_published"
        return None

    # GitLab
    if provider == "gitlab":
        object_kind = body.get("object_kind", "")
        mapping = {
            "push": "push",
            "merge_request": "merge_request_opened",
            "pipeline": None,
        }
        if object_kind == "pipeline":
            status = body.get("object_attributes", {}).get("status", "")
            return "pipeline_succeeded" if status == "success" else "pipeline_failed"
        return mapping.get(object_kind)

    # Stripe
    if provider == "stripe":
        stripe_type = body.get("type", "")
        mapping = {
            "payment_intent.succeeded":         "payment_succeeded",
            "payment_intent.payment_failed":    "payment_failed",
            "customer.subscription.created":    "subscription_created",
            "customer.subscription.deleted":    "subscription_cancelled",
            "charge.refunded":                  "refund_created",
        }
        return mapping.get(stripe_type)

    # Typeform
    if provider == "typeform":
        if "form_response" in body:
            return "form_submitted"

    # Linear
    if provider == "linear":
        action = body.get("action", "")
        resource_type = body.get("type", "")
        if resource_type == "Issue":
            if action == "create": return "issue_created"
            if action in ("update", "remove"): return "issue_updated"

    # Jira
    if provider == "jira":
        jira_event = body.get("webhookEvent", "")
        if jira_event == "jira:issue_created": return "issue_created"
        if jira_event == "jira:issue_updated": return "issue_updated"
        if jira_event == "sprint_started":     return "sprint_started"

    # Zendesk
    if provider == "zendesk":
        ticket = body.get("ticket", {})
        status = ticket.get("status", "")
        if status == "new":    return "ticket_created"
        if status == "solved": return "ticket_resolved"
        return "ticket_updated"

    # Airtable
    if provider == "airtable":
        change_type = body.get("changeType", "")
        if change_type == "create": return "record_created"
        if change_type == "update": return "record_updated"
        if change_type == "destroy": return "record_deleted"

    # HubSpot
    if provider == "hubspot":
        subscription_type = body.get("subscriptionType", "")
        if "contact.creation" in subscription_type: return "contact_created"
        if "deal.propertyChange" in subscription_type: return "deal_won"
        if "form.submission" in subscription_type: return "form_submitted"

    # Salesforce (Outbound Messages)
    if provider == "salesforce":
        return body.get("event_type")

    return None


def _verify_github_signature(secret: str, body_bytes: bytes, signature: str) -> bool:
    expected = "sha256=" + hmac.new(
        secret.encode(), body_bytes, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)


def _verify_stripe_signature(secret: str, body_bytes: bytes, stripe_signature: str) -> bool:
    """Basic Stripe webhook signature check (timestamp + payload)."""
    try:
        parts = {k: v for k, v in (p.split("=", 1) for p in stripe_signature.split(","))}
        ts = parts.get("t", "")
        signed = f"{ts}.{body_bytes.decode()}"
        expected_sig = hmac.new(secret.encode(), signed.encode(), hashlib.sha256).hexdigest()
        return expected_sig in stripe_signature
    except Exception:
        return False


@router.post("/{provider}/webhook")
async def integration_webhook(
    provider: str,
    request: Request,
    x_integration_event: str | None = Header(default=None),
    x_hub_signature_256: str | None = Header(default=None),
    x_stripe_signature: str | None = Header(default=None),
    x_github_event: str | None = Header(default=None),
    x_gitlab_event: str | None = Header(default=None),
) -> dict[str, Any]:
    """Universal inbound webhook endpoint.

    Accepts events from any registered provider. Each provider sends events to:

        POST /v1/integrations/{provider}/webhook

    The event_type is detected automatically from the payload shape and standard
    headers, or may be provided explicitly via X-Integration-Event.
    """
    if get_provider(provider) is None:
        raise HTTPException(status_code=404, detail=f"Unknown provider: {provider!r}. "
                            f"Supported: {list_provider_ids()}")

    raw_body = await request.body()

    # ── Provider-specific signature verification ──────────────────────────────

    if provider == "github" and x_hub_signature_256:
        secret = getattr(settings, "github_webhook_secret", "")
        if secret and not _verify_github_signature(secret, raw_body, x_hub_signature_256):
            raise HTTPException(status_code=401, detail="Invalid GitHub webhook signature")

    if provider == "stripe" and x_stripe_signature:
        secret = getattr(settings, "stripe_webhook_secret", "")
        if secret and not _verify_stripe_signature(secret, raw_body, x_stripe_signature):
            raise HTTPException(status_code=401, detail="Invalid Stripe webhook signature")

    # ── Parse body ────────────────────────────────────────────────────────────

    try:
        body: dict[str, Any] = json.loads(raw_body) if raw_body else {}
    except (ValueError, UnicodeDecodeError):
        body = {}

    # Slack URL verification challenge
    if provider == "slack" and body.get("type") == "url_verification":
        return {"challenge": body.get("challenge", "")}

    # ── Detect event type ─────────────────────────────────────────────────────

    all_headers = dict(request.headers)
    event_type = _detect_event_type(provider, all_headers, body)

    if event_type is None:
        logger.debug("integration_webhook: unrecognized event for provider=%s body_keys=%s", provider, list(body.keys()))
        return {"status": "ignored", "reason": "unrecognized_event_type"}

    # Validate event exists in registry
    if get_event(provider, event_type) is None:
        logger.debug("integration_webhook: unknown event_type=%s for provider=%s", event_type, provider)
        return {"status": "ignored", "reason": "unknown_event_type"}

    # ── Normalize and route ───────────────────────────────────────────────────

    try:
        normalized = normalize_event(provider, event_type, body)
    except Exception as exc:
        logger.exception("integration_webhook: normalization failed provider=%s event=%s", provider, event_type)
        raise HTTPException(status_code=500, detail="Event normalization failed") from exc

    try:
        dispatched = await route_trigger_event(provider, event_type, normalized)
    except Exception as exc:
        logger.exception("integration_webhook: routing failed provider=%s event=%s", provider, event_type)
        raise HTTPException(status_code=500, detail="Trigger routing failed") from exc

    return {
        "status": "ok",
        "provider": provider,
        "event": event_type,
        "workflows_triggered": dispatched,
    }
