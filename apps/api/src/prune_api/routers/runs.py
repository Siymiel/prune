"""Runs router — trigger a workflow run and inspect its results.

Canvas → Engine conversion
--------------------------
The builder stores the workflow graph in "canvas format" (nodes + edges as
rendered in the UI).  Before handing the graph to the engine runner we convert
it to the engine's flat node list with explicit `next` pointers.

Canvas node kind → engine node type mapping:

  text-input / trigger / output / action / template-out  → input.text / passthrough
  ai-agent / ai-routing / prune-ai                       → ai.respond
  if-else                                                → logic.if_else
  code                                                   → logic.code
  mpesa                                                  → payment.mpesa_stk
  (everything else)                                      → passthrough
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from prune_api.core.auth import CurrentUser, get_current_user
from prune_api.db.base import get_session
from prune_api.db.models import Run, TraceStep, Workflow
from prune_api.engine.runner import RunStatus, run_workflow
from prune_api.nodes.registry import NODE_REGISTRY

router = APIRouter()

# ---------------------------------------------------------------------------
# Canvas → Engine graph conversion
# ---------------------------------------------------------------------------

_KIND_TO_TYPE: dict[str, str] = {
    "text-input":    "input.text",
    "files":         "passthrough",
    "trigger":       "passthrough",
    "url":           "passthrough",
    "audio-input":   "passthrough",
    "output":        "passthrough",
    "action":        "passthrough",
    "audio-output":  "passthrough",
    "template-out":  "passthrough",
    "ai-agent":      "ai.respond",
    "ai-routing":    "logic.if_else",
    "prune-ai":      "ai.respond",
    "if-else":       "logic.if_else",
    "loop-subflow":  "passthrough",
    "code":          "logic.code",
    "mpesa":         "payment.mpesa_stk",
    "knowledge-base": "passthrough",
    "sticky-note":   "passthrough",
    "default-message": "passthrough",
    "delay":         "passthrough",
    "shared-memory": "passthrough",
    "vector-store":  "passthrough",
    "text-to-sql":   "passthrough",
    "search-tables": "passthrough",
    "search-data":   "passthrough",
    # app integrations → passthrough until implemented
    "whatsapp":           "passthrough",
    "openai-app":         "passthrough",
    "google-calendar-app": "passthrough",
    "google-drive-app":   "passthrough",
    "gmail-app":          "passthrough",
    "slack-app":          "passthrough",
    "google-maps-app":    "passthrough",
}


def _canvas_to_engine(graph: dict[str, Any]) -> dict[str, Any]:
    """Convert builder canvas format to the engine's run format."""
    canvas_nodes: list[dict[str, Any]] = graph.get("nodes", [])
    canvas_edges: list[dict[str, Any]] = graph.get("edges", [])

    if not canvas_nodes:
        return {"entry": None, "nodes": []}

    # Build sourceId → first targetId map (single successor per node for now)
    next_map: dict[str, str | None] = {n["id"]: None for n in canvas_nodes}
    for edge in canvas_edges:
        src = edge.get("sourceId") or edge.get("source")
        tgt = edge.get("targetId") or edge.get("target")
        if src and tgt and next_map.get(src) is None:
            next_map[src] = tgt

    # Entry node = node with no incoming edges
    has_incoming: set[str] = {
        edge.get("targetId") or edge.get("target", "")
        for edge in canvas_edges
    }
    entry_id: str = next(
        (n["id"] for n in canvas_nodes if n["id"] not in has_incoming),
        canvas_nodes[0]["id"],
    )

    engine_nodes: list[dict[str, Any]] = []
    for n in canvas_nodes:
        kind: str = n.get("kind", "")
        node_type: str = _KIND_TO_TYPE.get(kind, "passthrough")

        config: dict[str, Any] = {"next": next_map.get(n["id"])}

        if node_type == "input.text":
            config["output_key"] = "message"
            config["value"] = n.get("inputValue", "")

        elif node_type == "ai.respond":
            config["system_prompt"] = n.get(
                "systemPrompt", "You are a helpful AI assistant."
            )
            config["model"] = n.get("model", "claude-haiku-4-5-20251001")
            config["max_tokens"] = n.get("maxTokens", 1024)
            config["temperature"] = n.get("temperature", 0.7)

        elif node_type == "logic.if_else":
            config["condition"] = n.get("condition", "")
            config["then_next"] = n.get("thenNext") or next_map.get(n["id"])
            config["else_next"] = n.get("elseNext")

        elif node_type == "logic.code":
            config["code"] = n.get("code", "")

        elif node_type == "payment.mpesa_stk":
            config["phone"] = n.get("phone", "{{state.message}}")
            config["amount"] = n.get("amount", 0)
            config["reference"] = n.get("reference", "Prune")

        engine_nodes.append({"id": n["id"], "type": node_type, "config": config})

    return {"entry": entry_id, "nodes": engine_nodes}


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TriggerRunRequest(BaseModel):
    workflow_id: str
    inputs: dict[str, Any] = {}


class TraceStepOut(BaseModel):
    node: str
    node_type: str
    status: str
    ms: int = 0
    input: dict[str, Any] | None = None
    output: dict[str, Any] | None = None
    error: str | None = None


class RunOut(BaseModel):
    id: str
    workflow_id: str | None
    status: str
    state: dict[str, Any]
    error: str | None
    trace: list[TraceStepOut]
    started_at: str | None
    completed_at: str | None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/runs", response_model=RunOut, status_code=201)
async def trigger_run(
    body: TriggerRunRequest,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> RunOut:
    """Convert the saved canvas graph to engine format and execute it synchronously."""
    try:
        wid = uuid.UUID(body.workflow_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workflow_id")

    row = await session.execute(
        select(Workflow).where(
            Workflow.id == wid,
            Workflow.tenant_id == current_user.tenant_id,
        )
    )
    workflow_obj = row.scalar_one_or_none()
    if workflow_obj is None:
        raise HTTPException(status_code=404, detail="Workflow not found")

    engine_graph = _canvas_to_engine(workflow_obj.graph)

    run_id = uuid.uuid4()
    run = Run(
        id=run_id,
        tenant_id=current_user.tenant_id,
        workflow_id=workflow_obj.id,
        status=RunStatus.RUNNING,
        state={},
        started_at=datetime.now(UTC),
    )
    session.add(run)
    await session.flush()

    engine_result = await run_workflow(
        engine_graph,
        inputs=body.inputs,
        tenant_id=str(current_user.tenant_id),
        conversation_id="",
        run_id=str(run_id),
        node_registry=NODE_REGISTRY,
    )

    run.status = engine_result["status"]
    run.state = engine_result.get("state", {})
    run.wait_token = engine_result.get("wait_token")
    run.resume_node = engine_result.get("next_node")

    if engine_result["status"] in (RunStatus.DONE, RunStatus.ERROR):
        run.completed_at = datetime.now(UTC)
    if engine_result["status"] == RunStatus.ERROR:
        run.error = engine_result.get("error")

    for step in engine_result.get("trace", []):
        session.add(
            TraceStep(
                run_id=run_id,
                node_id=step["node"],
                node_type=step.get("node_type", ""),
                status=step["status"],
                input=step.get("input"),
                output=step.get("output"),
                duration_ms=step.get("ms"),
            )
        )

    return RunOut(
        id=str(run_id),
        workflow_id=str(workflow_obj.id),
        status=engine_result["status"],
        state=engine_result.get("state", {}),
        error=engine_result.get("error"),
        trace=[
            TraceStepOut(
                node=s["node"],
                node_type=s.get("node_type", ""),
                status=s["status"],
                ms=s.get("ms", 0),
                input=s.get("input"),
                output=s.get("output"),
                error=s.get("error"),
            )
            for s in engine_result.get("trace", [])
        ],
        started_at=run.started_at.isoformat() if run.started_at else None,
        completed_at=run.completed_at.isoformat() if run.completed_at else None,
    )


@router.get("/runs/{run_id}", response_model=RunOut)
async def get_run(
    run_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> RunOut:
    """Fetch a run's status and trace steps."""
    try:
        rid = uuid.UUID(run_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid run_id")

    row = await session.execute(
        select(Run).where(
            Run.id == rid,
            Run.tenant_id == current_user.tenant_id,
        )
    )
    run = row.scalar_one_or_none()
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")

    trace_rows = await session.execute(
        select(TraceStep)
        .where(TraceStep.run_id == rid)
        .order_by(TraceStep.created_at)
    )
    trace_steps = trace_rows.scalars().all()

    return RunOut(
        id=str(run.id),
        workflow_id=str(run.workflow_id) if run.workflow_id else None,
        status=run.status,
        state=run.state or {},
        error=run.error,
        trace=[
            TraceStepOut(
                node=ts.node_id,
                node_type=ts.node_type,
                status=ts.status,
                ms=ts.duration_ms or 0,
            )
            for ts in trace_steps
        ],
        started_at=run.started_at.isoformat() if run.started_at else None,
        completed_at=run.completed_at.isoformat() if run.completed_at else None,
    )
