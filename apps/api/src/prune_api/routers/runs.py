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

Async execution
---------------
POST /runs   — creates the Run record, fires _execute_run as a background
               asyncio task, and returns 202 immediately with {id, status}.
GET /runs/{id}/stream — SSE endpoint; polls the DB every 200 ms and streams
               trace-step events as nodes complete, then a final "done" event.
GET /runs/{id}        — fetch the full run result (use after stream closes).
"""

from __future__ import annotations

import asyncio
import json
import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from prune_api.core.auth import CurrentUser, get_current_user
from prune_api.db.base import AsyncSessionLocal, get_session
from prune_api.db.models import Run, TraceStep, Workflow
from prune_api.engine.graph import canvas_to_engine
from prune_api.engine.runner import RunStatus, run_workflow_iter
from prune_api.nodes.registry import NODE_REGISTRY

router = APIRouter()

# ---------------------------------------------------------------------------
# Canvas → Engine graph conversion  (logic lives in engine/graph.py)
# ---------------------------------------------------------------------------

def _canvas_to_engine(graph: dict[str, Any]) -> dict[str, Any]:
    return canvas_to_engine(graph)


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
    parent_run_id: str | None = None


# ---------------------------------------------------------------------------
# Background execution
# ---------------------------------------------------------------------------

async def _execute_run(
    run_id: uuid.UUID,
    engine_graph: dict[str, Any],
    inputs: dict[str, Any],
    tenant_id: str,
) -> None:
    """Background coroutine: runs the workflow and writes each trace step to DB immediately."""
    async with AsyncSessionLocal() as session:
        run = await session.get(Run, run_id)
        if run is None:
            return
        run.status = RunStatus.RUNNING
        await session.commit()

        try:
            async for event in run_workflow_iter(
                engine_graph,
                inputs,
                tenant_id=tenant_id,
                conversation_id="",
                run_id=str(run_id),
                node_registry=NODE_REGISTRY,
            ):
                if event["event"] == "step":
                    session.add(TraceStep(
                        run_id=run_id,
                        node_id=event["node"],
                        node_type=event["node_type"],
                        status=event["status"],
                        input=event.get("input"),
                        output=event.get("output"),
                        error=event.get("error"),
                        duration_ms=event.get("ms"),
                    ))
                    # Commit immediately so the SSE poller sees each step as it lands
                    await session.commit()

                elif event["event"] == "done":
                    run = await session.get(Run, run_id)
                    if run:
                        run.status = event["status"]
                        run.state = event.get("state", {})
                        run.completed_at = datetime.now(UTC)
                        if event["status"] == RunStatus.ERROR:
                            run.error = event.get("error")
                        elif event["status"] == RunStatus.WAITING:
                            run.wait_token = event.get("wait_token")
                            run.resume_node = event.get("next_node")
                    await session.commit()

        except Exception as exc:
            try:
                run = await session.get(Run, run_id)
                if run and run.status == RunStatus.RUNNING:
                    run.status = RunStatus.ERROR
                    run.error = f"Internal error: {exc}"
                    run.completed_at = datetime.now(UTC)
                    await session.commit()
            except Exception:
                pass


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/runs", response_model=list[RunOut])
async def list_runs(
    workflow_id: str | None = None,
    status: str | None = None,
    parent_run_id: str | None = None,
    page: int = 0,
    page_size: int = 20,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[RunOut]:
    """List runs for the tenant, newest first.

    Pass parent_run_id to list child runs spawned by a WorkflowCallNode.
    Pass parent_run_id=none to list only top-level runs (no parent).
    """
    q = (
        select(Run)
        .where(Run.tenant_id == current_user.tenant_id)
        .order_by(Run.started_at.desc())
    )
    if workflow_id:
        try:
            q = q.where(Run.workflow_id == uuid.UUID(workflow_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid workflow_id")
    if status:
        q = q.where(Run.status == status)
    if parent_run_id == "none":
        q = q.where(Run.parent_run_id.is_(None))
    elif parent_run_id:
        try:
            q = q.where(Run.parent_run_id == uuid.UUID(parent_run_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid parent_run_id")

    q = q.offset(page * page_size).limit(page_size)
    rows = (await session.execute(q)).scalars().all()

    return [
        RunOut(
            id=str(r.id),
            workflow_id=str(r.workflow_id) if r.workflow_id else None,
            status=r.status,
            state=r.state or {},
            error=r.error,
            trace=[],
            started_at=r.started_at.isoformat() if r.started_at else None,
            completed_at=r.completed_at.isoformat() if r.completed_at else None,
            parent_run_id=str(r.parent_run_id) if r.parent_run_id else None,
        )
        for r in rows
    ]


@router.post("/runs", response_model=RunOut, status_code=202)
async def trigger_run(
    body: TriggerRunRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> RunOut:
    """Create a run record, fire execution in the background, return 202 immediately."""
    try:
        wid = uuid.UUID(body.workflow_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workflow_id")

    async with AsyncSessionLocal() as session:
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
            status=RunStatus.PENDING,
            state={},
            started_at=datetime.now(UTC),
        )
        session.add(run)
        # Commit before firing the task so _execute_run can read the row
        await session.commit()

    asyncio.create_task(
        _execute_run(run_id, engine_graph, body.inputs, str(current_user.tenant_id))
    )

    return RunOut(
        id=str(run_id),
        workflow_id=str(wid),
        status=RunStatus.PENDING,
        state={},
        error=None,
        trace=[],
        started_at=run.started_at.isoformat() if run.started_at else None,
        completed_at=None,
        parent_run_id=None,
    )


class ResumeRunRequest(BaseModel):
    wait_token: str
    inputs: dict[str, Any] = {}


@router.post("/runs/{run_id}/resume", response_model=RunOut, status_code=202)
async def resume_run(
    run_id: str,
    body: ResumeRunRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> RunOut:
    """Resume a waiting run.

    Verifies the wait_token, patches the engine graph entry to resume_node,
    merges saved state with any new inputs, and re-fires _execute_run.
    """
    try:
        rid = uuid.UUID(run_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid run_id")

    async with AsyncSessionLocal() as session:
        run_row = await session.execute(
            select(Run).where(Run.id == rid, Run.tenant_id == current_user.tenant_id)
        )
        run = run_row.scalar_one_or_none()
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")
        if run.status != RunStatus.WAITING:
            raise HTTPException(
                status_code=409,
                detail=f"Run cannot be resumed (status: {run.status})",
            )
        if run.wait_token != body.wait_token:
            raise HTTPException(status_code=403, detail="Invalid wait_token")
        if run.wait_expires_at and run.wait_expires_at < datetime.now(UTC):
            raise HTTPException(status_code=410, detail="Wait token has expired")
        if not run.resume_node:
            raise HTTPException(status_code=409, detail="Run has no resume_node recorded")

        wf_row = await session.execute(
            select(Workflow).where(Workflow.id == run.workflow_id)
        )
        workflow_obj = wf_row.scalar_one_or_none()
        if workflow_obj is None:
            raise HTTPException(status_code=404, detail="Workflow not found")

        engine_graph = _canvas_to_engine(workflow_obj.graph)
        resume_graph = {**engine_graph, "entry": run.resume_node}
        merged_inputs = {**(run.state or {}), **body.inputs}

        # Capture scalars before session closes
        saved_workflow_id = run.workflow_id
        saved_state = run.state or {}
        saved_started_at = run.started_at

        run.status = RunStatus.PENDING
        run.wait_token = None
        run.resume_node = None
        run.wait_expires_at = None
        await session.commit()

    asyncio.create_task(
        _execute_run(rid, resume_graph, merged_inputs, str(current_user.tenant_id))
    )

    return RunOut(
        id=str(rid),
        workflow_id=str(saved_workflow_id) if saved_workflow_id else None,
        status=RunStatus.PENDING,
        state=saved_state,
        error=None,
        trace=[],
        started_at=saved_started_at.isoformat() if saved_started_at else None,
        completed_at=None,
        parent_run_id=None,
    )


@router.get("/runs/{run_id}/stream")
async def stream_run(
    run_id: str,
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    """SSE stream: yields trace-step events as nodes complete, then a final done event.

    The client connects immediately after POST /runs and stays connected until
    the run finishes. Each event is a JSON-encoded dict with an "event" field.
    """
    try:
        rid = uuid.UUID(run_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid run_id")

    row = await session.execute(
        select(Run).where(Run.id == rid, Run.tenant_id == current_user.tenant_id)
    )
    if row.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Run not found")

    async def event_generator() -> AsyncGenerator[str, None]:
        seen_step_ids: set[str] = set()
        # Safety cap: 10 minutes × 5 polls/sec = 3000 iterations
        for _ in range(3000):
            if await request.is_disconnected():
                break

            async with AsyncSessionLocal() as s:
                steps = (
                    await s.scalars(
                        select(TraceStep)
                        .where(TraceStep.run_id == rid)
                        .order_by(TraceStep.created_at)
                    )
                ).all()

                for step in steps:
                    sid = str(step.id)
                    if sid in seen_step_ids:
                        continue
                    seen_step_ids.add(sid)
                    yield (
                        "data: "
                        + json.dumps({
                            "event":     "step",
                            "node":      step.node_id,
                            "node_type": step.node_type,
                            "status":    step.status,
                            "ms":        step.duration_ms or 0,
                            "output":    step.output,
                            "error":     step.error,
                        })
                        + "\n\n"
                    )

                run_row = (
                    await s.scalars(select(Run).where(Run.id == rid))
                ).first()

                if run_row and run_row.status in (
                    RunStatus.DONE, RunStatus.ERROR, RunStatus.WAITING
                ):
                    yield (
                        "data: "
                        + json.dumps({
                            "event":  "done",
                            "status": run_row.status,
                            "error":  run_row.error,
                            "state":  run_row.state,
                        })
                        + "\n\n"
                    )
                    return

            await asyncio.sleep(0.2)

        # Timeout
        yield (
            "data: "
            + json.dumps({
                "event":  "done",
                "status": RunStatus.ERROR,
                "error":  "Stream timeout after 10 minutes",
                "state":  {},
            })
            + "\n\n"
        )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/runs/{run_id}", response_model=RunOut)
async def get_run(
    run_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> RunOut:
    """Fetch a completed run's status, final state, and full trace."""
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
                input=ts.input,
                output=ts.output,
                error=ts.error,
            )
            for ts in trace_steps
        ],
        started_at=run.started_at.isoformat() if run.started_at else None,
        completed_at=run.completed_at.isoformat() if run.completed_at else None,
        parent_run_id=str(run.parent_run_id) if run.parent_run_id else None,
    )
