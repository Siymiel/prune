"""Explainable Workflows — audit trail of a run as a human-readable story."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from prune_api.core.auth import CurrentUser, get_current_user
from prune_api.db.base import get_session
from prune_api.db.models import Run, TraceStep, Workflow

router = APIRouter()

# ---------------------------------------------------------------------------
# Node kind → icon type (determines colour in the UI)
# ---------------------------------------------------------------------------

_INPUT_KINDS = {"text-input", "trigger", "form-input", "file-upload", "audio-input", "http-input"}
_AI_KINDS = {"ai-agent", "prune-ai", "openai-app", "ai-routing", "anthropic-app"}
_LOGIC_KINDS = {"if-else", "code", "loop", "merge", "switch", "wait", "delay"}
_OUTPUT_KINDS = {"output", "template-out", "email-out", "audio-output", "pdf-out", "json-out"}
_ACTION_KINDS = {"http", "mpesa", "whatsapp", "slack-app", "gmail-app", "sheets-app", "webhook-out"}
_KNOWLEDGE_KINDS = {"knowledge-base", "knowledge-retrieve"}
_FLOW_KINDS = {"workflow-call", "subflow"}


def _icon_type(kind: str) -> str:
    if kind in _INPUT_KINDS:
        return "input"
    if kind in _AI_KINDS:
        return "ai"
    if kind in _LOGIC_KINDS:
        return "logic"
    if kind in _OUTPUT_KINDS:
        return "output"
    if kind in _ACTION_KINDS:
        return "action"
    if kind in _KNOWLEDGE_KINDS:
        return "knowledge"
    if kind in _FLOW_KINDS:
        return "flow"
    return "unknown"


# ---------------------------------------------------------------------------
# Output extraction helpers
# ---------------------------------------------------------------------------

_PRIORITY_KEYS = [
    "reply", "message", "result", "text", "classification",
    "score", "risk_score", "route", "decision", "_branch",
    "status_code", "status", "subject", "confidence",
]


def _extract_key_outputs(output: dict[str, Any] | None, max_pairs: int = 5) -> dict[str, str]:
    if not output:
        return {}
    result: dict[str, str] = {}

    for k in _PRIORITY_KEYS:
        if k in output:
            v = output[k]
            if not isinstance(v, dict):
                result[k] = str(v)[:200]
            if len(result) >= max_pairs:
                return result

    for k, v in output.items():
        if k in result or isinstance(v, (dict, list)):
            continue
        result[k] = str(v)[:200]
        if len(result) >= max_pairs:
            break

    return result


def _extract_ai_reply(kind: str, output: dict[str, Any] | None) -> str | None:
    if kind not in _AI_KINDS:
        return None
    if not output:
        return None
    return (
        output.get("reply")
        or output.get("message")
        or output.get("response")
        or output.get("text")
    )


def _summarize(
    kind: str,
    label: str,
    output: dict[str, Any] | None,
    duration_ms: int | None,
) -> str:
    out = output or {}
    ms_tag = f" ({duration_ms}ms)" if duration_ms else ""

    if kind in _INPUT_KINDS:
        vals = [str(v) for v in out.values() if isinstance(v, str)]
        snippet = vals[0][:60] if vals else ""
        return f'Input received: "{snippet}"' if snippet else "Input received"

    if kind in ("ai-agent", "prune-ai", "openai-app", "anthropic-app"):
        reply = out.get("reply") or out.get("message") or ""
        snippet = str(reply)[:80].rstrip() if reply else ""
        ellipsis = "…" if len(str(reply)) > 80 else ""
        return f'AI responded: "{snippet}{ellipsis}"' if snippet else f"AI node executed{ms_tag}"

    if kind == "ai-routing":
        route = out.get("route") or out.get("decision") or out.get("_branch") or ""
        return f"Routed → {route}" if route else f"Routing decision made{ms_tag}"

    if kind == "if-else":
        branch = out.get("_branch") or out.get("branch") or ""
        return f"Condition evaluated → {branch} branch" if branch else f"Condition evaluated{ms_tag}"

    if kind == "code":
        return f"Code executed{ms_tag}"

    if kind in ("output", "template-out"):
        return f"Output produced{ms_tag}"

    if kind in ("email-out", "gmail-app"):
        subject = out.get("subject") or ""
        return f"Email sent: {subject}" if subject else f"Email sent{ms_tag}"

    if kind in _KNOWLEDGE_KINDS:
        chunks = out.get("chunks", [])
        n = len(chunks) if isinstance(chunks, list) else 0
        return f"Retrieved {n} knowledge chunk{'s' if n != 1 else ''}" if n else f"Knowledge base queried{ms_tag}"

    if kind == "http":
        status_code = out.get("status_code", "")
        return f"HTTP request → {status_code}" if status_code else f"HTTP request sent{ms_tag}"

    if kind == "mpesa":
        return f"M-Pesa payment initiated{ms_tag}"

    if kind in _FLOW_KINDS:
        return f"Sub-workflow called{ms_tag}"

    if kind == "trigger":
        return "Workflow triggered"

    return f"{label} executed{ms_tag}"


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class StoryBeat(BaseModel):
    step: int
    node_id: str
    node_label: str
    node_kind: str
    icon_type: str
    status: str
    duration_ms: int
    summary: str
    key_outputs: dict[str, str]
    ai_reply: str | None = None
    error: str | None = None


class ExplainResponse(BaseModel):
    run_id: str
    workflow_name: str
    status: str
    started_at: str | None
    completed_at: str | None
    beats: list[StoryBeat]


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.get("/runs/{run_id}/explain", response_model=ExplainResponse)
async def explain_run(
    run_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ExplainResponse:
    try:
        rid = uuid.UUID(run_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid run_id")

    run_row = await session.execute(
        select(Run).where(Run.id == rid, Run.tenant_id == current_user.tenant_id)
    )
    run = run_row.scalar_one_or_none()
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")

    steps_row = await session.execute(
        select(TraceStep).where(TraceStep.run_id == rid).order_by(TraceStep.created_at)
    )
    steps = steps_row.scalars().all()

    canvas_nodes: dict[str, dict[str, Any]] = {}
    workflow_name = "Workflow"
    if run.workflow_id:
        wf_row = await session.execute(
            select(Workflow).where(
                Workflow.id == run.workflow_id,
                Workflow.tenant_id == current_user.tenant_id,
            )
        )
        wf = wf_row.scalar_one_or_none()
        if wf:
            workflow_name = wf.name
            for n in wf.graph.get("nodes", []):
                canvas_nodes[n["id"]] = n
                # Synthetic KB node IDs injected by canvas_to_engine
                if n.get("kind") == "ai-agent":
                    for i in range(20):
                        canvas_nodes[f"__kb_{n['id']}_{i}"] = {
                            **n,
                            "kind": "knowledge-retrieve",
                            "label": f"KB retrieval ({n.get('label', '')})",
                        }

    beats: list[StoryBeat] = []
    for i, step in enumerate(steps, start=1):
        canvas = canvas_nodes.get(step.node_id, {})
        kind = canvas.get("kind") or step.node_type or "unknown"
        label = canvas.get("label") or step.node_id.replace("_", " ").replace("-", " ").title()

        beats.append(
            StoryBeat(
                step=i,
                node_id=step.node_id,
                node_label=label,
                node_kind=kind,
                icon_type=_icon_type(kind),
                status=step.status,
                duration_ms=step.duration_ms or 0,
                summary=_summarize(kind, label, step.output, step.duration_ms),
                key_outputs=_extract_key_outputs(step.output),
                ai_reply=_extract_ai_reply(kind, step.output),
                error=step.error,
            )
        )

    return ExplainResponse(
        run_id=str(run.id),
        workflow_name=workflow_name,
        status=run.status,
        started_at=run.started_at.isoformat() if run.started_at else None,
        completed_at=run.completed_at.isoformat() if run.completed_at else None,
        beats=beats,
    )
