"""Workflow schedule CRUD and background scheduler loop.

Schedules are cron expressions attached to a workflow.  The scheduler loop
wakes every 60 seconds, queries for active schedules whose next_run_at is in
the past, fires a background run for each one, then advances next_run_at.

Cron expressions use standard 5-field syntax: minute hour dom month dow.
Example: "0 9 * * 1"  →  every Monday at 09:00 UTC
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from prune_api.core.auth import CurrentUser, get_current_user
from prune_api.db.base import AsyncSessionLocal, get_session
from prune_api.db.models import Run, Workflow, WorkflowSchedule
from prune_api.engine.runner import RunStatus
from prune_api.nodes.registry import NODE_REGISTRY
from prune_api.routers.runs import _canvas_to_engine, _execute_run

router = APIRouter()


# ---------------------------------------------------------------------------
# Cron helpers
# ---------------------------------------------------------------------------

def _next_run(cron: str, after: datetime | None = None) -> datetime:
    from croniter import croniter
    base = after or datetime.now(UTC)
    return croniter(cron, base).get_next(datetime)


def _cron_is_valid(cron: str) -> bool:
    try:
        from croniter import croniter
        return croniter.is_valid(cron)
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ScheduleCreate(BaseModel):
    cron: str
    is_active: bool = True
    inputs: dict[str, Any] = {}

    @field_validator("cron")
    @classmethod
    def validate_cron(cls, v: str) -> str:
        if not _cron_is_valid(v):
            raise ValueError(f"Invalid cron expression: '{v}'")
        return v


class ScheduleUpdate(BaseModel):
    cron: str | None = None
    is_active: bool | None = None
    inputs: dict[str, Any] | None = None


class ScheduleOut(BaseModel):
    id: str
    workflow_id: str
    cron: str
    is_active: bool
    inputs: dict[str, Any]
    last_run_at: str | None
    next_run_at: str | None
    created_at: str


def _to_out(s: WorkflowSchedule) -> ScheduleOut:
    return ScheduleOut(
        id=str(s.id),
        workflow_id=str(s.workflow_id),
        cron=s.cron,
        is_active=s.is_active,
        inputs=s.inputs,
        last_run_at=s.last_run_at.isoformat() if s.last_run_at else None,
        next_run_at=s.next_run_at.isoformat() if s.next_run_at else None,
        created_at=s.created_at.isoformat(),
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/workflows/{workflow_id}/schedules", response_model=list[ScheduleOut])
async def list_schedules(
    workflow_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ScheduleOut]:
    try:
        wid = uuid.UUID(workflow_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workflow_id")

    wf = (await session.execute(
        select(Workflow).where(Workflow.id == wid, Workflow.tenant_id == current_user.tenant_id)
    )).scalar_one_or_none()
    if wf is None:
        raise HTTPException(status_code=404, detail="Workflow not found")

    rows = (await session.execute(
        select(WorkflowSchedule)
        .where(WorkflowSchedule.workflow_id == wid)
        .order_by(WorkflowSchedule.created_at)
    )).scalars().all()
    return [_to_out(s) for s in rows]


@router.post("/workflows/{workflow_id}/schedules", response_model=ScheduleOut, status_code=201)
async def create_schedule(
    workflow_id: str,
    body: ScheduleCreate,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ScheduleOut:
    try:
        wid = uuid.UUID(workflow_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workflow_id")

    wf = (await session.execute(
        select(Workflow).where(Workflow.id == wid, Workflow.tenant_id == current_user.tenant_id)
    )).scalar_one_or_none()
    if wf is None:
        raise HTTPException(status_code=404, detail="Workflow not found")

    try:
        next_run = _next_run(body.cron) if body.is_active else None
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Invalid cron expression: {exc}")

    sched = WorkflowSchedule(
        tenant_id=current_user.tenant_id,
        workflow_id=wid,
        cron=body.cron,
        is_active=body.is_active,
        inputs=body.inputs,
        next_run_at=next_run,
    )
    session.add(sched)
    await session.commit()
    await session.refresh(sched)
    return _to_out(sched)


@router.patch("/workflows/{workflow_id}/schedules/{schedule_id}", response_model=ScheduleOut)
async def update_schedule(
    workflow_id: str,
    schedule_id: str,
    body: ScheduleUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ScheduleOut:
    try:
        wid = uuid.UUID(workflow_id)
        sid = uuid.UUID(schedule_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")

    sched = (await session.execute(
        select(WorkflowSchedule).where(
            WorkflowSchedule.id == sid,
            WorkflowSchedule.workflow_id == wid,
            WorkflowSchedule.tenant_id == current_user.tenant_id,
        )
    )).scalar_one_or_none()
    if sched is None:
        raise HTTPException(status_code=404, detail="Schedule not found")

    if body.cron is not None:
        if not _cron_is_valid(body.cron):
            raise HTTPException(status_code=422, detail=f"Invalid cron expression: '{body.cron}'")
        sched.cron = body.cron
    if body.is_active is not None:
        sched.is_active = body.is_active
    if body.inputs is not None:
        sched.inputs = body.inputs

    if body.cron is not None or body.is_active is not None:
        sched.next_run_at = _next_run(sched.cron) if sched.is_active else None

    await session.commit()
    await session.refresh(sched)
    return _to_out(sched)


@router.delete("/workflows/{workflow_id}/schedules/{schedule_id}", status_code=204)
async def delete_schedule(
    workflow_id: str,
    schedule_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    try:
        wid = uuid.UUID(workflow_id)
        sid = uuid.UUID(schedule_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")

    sched = (await session.execute(
        select(WorkflowSchedule).where(
            WorkflowSchedule.id == sid,
            WorkflowSchedule.workflow_id == wid,
            WorkflowSchedule.tenant_id == current_user.tenant_id,
        )
    )).scalar_one_or_none()
    if sched is None:
        raise HTTPException(status_code=404, detail="Schedule not found")

    await session.delete(sched)
    await session.commit()


# ---------------------------------------------------------------------------
# Background scheduler loop — started once at app lifespan
# ---------------------------------------------------------------------------

async def scheduler_loop() -> None:
    """Poll every 60 s; fire runs for any schedule whose next_run_at has passed."""
    while True:
        await asyncio.sleep(60)
        try:
            now = datetime.now(UTC)
            async with AsyncSessionLocal() as session:
                due = (await session.execute(
                    select(WorkflowSchedule).where(
                        WorkflowSchedule.is_active.is_(True),
                        WorkflowSchedule.next_run_at <= now,
                    )
                )).scalars().all()

                for sched in due:
                    wf = await session.get(Workflow, sched.workflow_id)
                    if wf is None:
                        continue

                    engine_graph = _canvas_to_engine(wf.graph)
                    run_id = uuid.uuid4()
                    run = Run(
                        id=run_id,
                        tenant_id=sched.tenant_id,
                        workflow_id=wf.id,
                        status=RunStatus.PENDING,
                        state={},
                        started_at=now,
                    )
                    session.add(run)

                    sched.last_run_at = now
                    sched.next_run_at = _next_run(sched.cron, after=now)

                    await session.commit()

                    asyncio.create_task(
                        _execute_run(run_id, engine_graph, sched.inputs, str(sched.tenant_id))
                    )
        except Exception:
            pass  # transient DB/network error — try again next tick
