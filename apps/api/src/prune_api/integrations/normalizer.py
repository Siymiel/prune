"""Event Normalizer — transforms provider-specific webhook payloads into
the standard NormalizedEvent consumed by the trigger routing engine.

Every provider-specific payload shape is handled here; the workflow engine
never sees raw provider data.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any


class NormalizedEvent:
    """Standard internal event object injected into state["event"]."""

    def __init__(
        self,
        provider: str,
        trigger: str,
        timestamp: str,
        payload: dict[str, Any],
        raw: dict[str, Any] | None = None,
    ) -> None:
        self.provider  = provider
        self.trigger   = trigger
        self.timestamp = timestamp
        self.payload   = payload
        self.raw       = raw or {}

    def to_dict(self) -> dict[str, Any]:
        return {
            "provider":  self.provider,
            "trigger":   self.trigger,
            "timestamp": self.timestamp,
            **self.payload,
        }


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


# ---------------------------------------------------------------------------
# Provider-specific normalizers
# ---------------------------------------------------------------------------

def _normalize_slack(event_type: str, raw: dict[str, Any]) -> dict[str, Any]:
    event = raw.get("event", raw)
    base  = {"channel": event.get("channel", ""), "user": event.get("user", ""), "timestamp": event.get("ts", _now_iso())}
    if event_type == "message_received":
        return {**base, "text": event.get("text", ""), "thread_ts": event.get("thread_ts", "")}
    if event_type == "member_joined_channel":
        return {**base, "inviter": event.get("inviter", "")}
    if event_type == "file_shared":
        f = event.get("file", {})
        return {**base, "file_id": f.get("id", ""), "filename": f.get("name", ""), "filetype": f.get("filetype", ""), "permalink": f.get("permalink", "")}
    if event_type == "reaction_added":
        return {**base, "reaction": event.get("reaction", ""), "message_ts": event.get("item", {}).get("ts", "")}
    return base


def _normalize_github(event_type: str, raw: dict[str, Any]) -> dict[str, Any]:
    repo = raw.get("repository", {}).get("full_name", "")
    if event_type == "push":
        commits = raw.get("commits", [])
        head    = commits[-1] if commits else {}
        return {
            "repository": repo, "branch": raw.get("ref", "").replace("refs/heads/", ""),
            "pusher": raw.get("pusher", {}).get("name", ""),
            "commit_sha": raw.get("after", ""), "commit_message": head.get("message", ""),
            "commits_count": len(commits), "compare_url": raw.get("compare", ""),
        }
    if event_type in ("pull_request_opened", "pull_request_merged"):
        pr = raw.get("pull_request", {})
        base: dict[str, Any] = {
            "repository": repo, "pr_number": pr.get("number"), "title": pr.get("title", ""),
            "author": pr.get("user", {}).get("login", ""),
            "base_branch": pr.get("base", {}).get("ref", ""),
            "head_branch": pr.get("head", {}).get("ref", ""),
            "pr_url": pr.get("html_url", ""),
        }
        if event_type == "pull_request_merged":
            base["merged_by"] = (raw.get("pull_request", {}).get("merged_by") or {}).get("login", "")
            base["merged_at"] = pr.get("merged_at", "")
        return base
    if event_type in ("issue_created", "issue_closed"):
        issue = raw.get("issue", {})
        return {
            "repository": repo, "issue_number": issue.get("number"),
            "title": issue.get("title", ""), "body": issue.get("body", ""),
            "author": issue.get("user", {}).get("login", ""),
            "labels": [l["name"] for l in issue.get("labels", [])],
            "issue_url": issue.get("html_url", ""),
            "closed_by": (issue.get("closed_by") or {}).get("login", ""),
            "closed_at": issue.get("closed_at", ""),
        }
    if event_type == "release_published":
        release = raw.get("release", {})
        return {
            "repository": repo, "tag_name": release.get("tag_name", ""),
            "release_name": release.get("name", ""), "body": release.get("body", ""),
            "author": release.get("author", {}).get("login", ""),
            "published_at": release.get("published_at", ""), "release_url": release.get("html_url", ""),
        }
    return {"repository": repo}


def _normalize_stripe(event_type: str, raw: dict[str, Any]) -> dict[str, Any]:
    obj = raw.get("data", {}).get("object", {})
    customer = obj.get("customer_email") or obj.get("receipt_email") or ""
    if event_type == "payment_succeeded":
        return {
            "payment_intent_id": obj.get("id", ""), "amount": obj.get("amount", 0),
            "currency": obj.get("currency", ""), "customer_email": customer,
            "customer_id": obj.get("customer", ""), "description": obj.get("description", ""),
            "receipt_url": obj.get("receipt_url", ""),
        }
    if event_type == "payment_failed":
        err = obj.get("last_payment_error", {}) or {}
        return {
            "payment_intent_id": obj.get("id", ""), "amount": obj.get("amount", 0),
            "currency": obj.get("currency", ""), "customer_email": customer,
            "error_code": err.get("code", ""), "error_message": err.get("message", ""),
        }
    if event_type in ("subscription_created", "subscription_cancelled"):
        plan = (obj.get("items", {}).get("data") or [{}])[0].get("price", {})
        return {
            "subscription_id": obj.get("id", ""), "customer_email": customer,
            "plan_id": plan.get("id", ""), "plan_name": plan.get("nickname", ""),
            "amount": plan.get("unit_amount", 0), "currency": plan.get("currency", ""),
            "interval": plan.get("recurring", {}).get("interval", ""),
            "started_at": obj.get("start_date", ""), "cancelled_at": obj.get("canceled_at", ""),
            "cancel_reason": obj.get("cancellation_details", {}).get("reason", ""),
        }
    if event_type == "refund_created":
        return {
            "refund_id": obj.get("id", ""), "charge_id": obj.get("charge", ""),
            "amount": obj.get("amount", 0), "currency": obj.get("currency", ""),
            "reason": obj.get("reason", ""), "customer_email": customer,
        }
    return {}


def _normalize_typeform(event_type: str, raw: dict[str, Any]) -> dict[str, Any]:
    form_response = raw.get("form_response", raw)
    answers = {
        a.get("field", {}).get("ref", str(i)): a.get(a.get("type", "text"), "")
        for i, a in enumerate(form_response.get("answers", []))
    }
    return {
        "form_id": raw.get("form_id", ""),
        "form_name": form_response.get("form_id", ""),
        "response_id": form_response.get("token", ""),
        "answers": answers,
        "submitted_at": form_response.get("submitted_at", _now_iso()),
        "respondent_email": answers.get("email", ""),
    }


def _normalize_generic(raw: dict[str, Any]) -> dict[str, Any]:
    """Passthrough for providers without a specific normalizer."""
    return dict(raw)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

_NORMALIZERS: dict[str, Any] = {
    "slack":   _normalize_slack,
    "github":  _normalize_github,
    "stripe":  _normalize_stripe,
    "typeform": _normalize_typeform,
}


def normalize_event(
    provider: str,
    event_type: str,
    raw_payload: dict[str, Any],
) -> NormalizedEvent:
    """Transform a raw provider webhook payload into a NormalizedEvent.

    Args:
        provider:    Provider id, e.g. "slack", "github".
        event_type:  Event id from the registry, e.g. "message_received".
        raw_payload: The raw HTTP body parsed as JSON.

    Returns:
        NormalizedEvent ready to inject into state["event"].
    """
    normalizer = _NORMALIZERS.get(provider)
    if normalizer is not None:
        payload = normalizer(event_type, raw_payload)
    else:
        payload = _normalize_generic(raw_payload)

    return NormalizedEvent(
        provider=provider,
        trigger=event_type,
        timestamp=_now_iso(),
        payload=payload,
        raw=raw_payload,
    )
