"""Workflows CRUD router — list, create, fetch, update, delete."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete as sql_delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from prune_api.core.auth import CurrentUser, get_current_user
from prune_api.db.base import get_session
from prune_api.db.models import Workflow

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class WorkflowCreate(BaseModel):
    name: str
    description: str | None = None
    graph: dict[str, Any] = {}


class WorkflowUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    graph: dict[str, Any] | None = None
    is_published: bool | None = None


class WorkflowOut(BaseModel):
    id: str
    name: str
    description: str | None
    graph: dict[str, Any]
    is_published: bool
    created_at: str
    updated_at: str


def _to_out(w: Workflow) -> WorkflowOut:
    return WorkflowOut(
        id=str(w.id),
        name=w.name,
        description=w.description,
        graph=w.graph,
        is_published=w.is_published,
        created_at=w.created_at.isoformat(),
        updated_at=w.updated_at.isoformat(),
    )


def _parse_wid(workflow_id: str) -> uuid.UUID:
    try:
        return uuid.UUID(workflow_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workflow_id")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/workflows", response_model=list[WorkflowOut])
async def list_workflows(
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[WorkflowOut]:
    rows = await session.execute(
        select(Workflow)
        .where(Workflow.tenant_id == current_user.tenant_id)
        .order_by(Workflow.updated_at.desc())
    )
    return [_to_out(w) for w in rows.scalars().all()]


@router.post("/workflows", response_model=WorkflowOut, status_code=201)
async def create_workflow(
    body: WorkflowCreate,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> WorkflowOut:
    w = Workflow(
        tenant_id=current_user.tenant_id,
        created_by=current_user.user_id,
        name=body.name,
        description=body.description,
        graph=body.graph,
    )
    session.add(w)
    await session.flush()
    await session.refresh(w)
    return _to_out(w)


@router.get("/workflows/{workflow_id}", response_model=WorkflowOut)
async def get_workflow(
    workflow_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> WorkflowOut:
    wid = _parse_wid(workflow_id)
    row = await session.execute(
        select(Workflow).where(
            Workflow.id == wid,
            Workflow.tenant_id == current_user.tenant_id,
        )
    )
    w = row.scalar_one_or_none()
    if w is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return _to_out(w)


@router.patch("/workflows/{workflow_id}", response_model=WorkflowOut)
async def update_workflow(
    workflow_id: str,
    body: WorkflowUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> WorkflowOut:
    wid = _parse_wid(workflow_id)
    row = await session.execute(
        select(Workflow).where(
            Workflow.id == wid,
            Workflow.tenant_id == current_user.tenant_id,
        )
    )
    w = row.scalar_one_or_none()
    if w is None:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if body.name is not None:
        w.name = body.name
    if body.description is not None:
        w.description = body.description
    if body.graph is not None:
        w.graph = body.graph
    if body.is_published is not None:
        w.is_published = body.is_published
        if body.is_published and w.published_at is None:
            w.published_at = datetime.utcnow()

    await session.flush()
    await session.refresh(w)
    return _to_out(w)


@router.delete("/workflows/{workflow_id}", status_code=204)
async def delete_workflow(
    workflow_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    wid = _parse_wid(workflow_id)
    result = await session.execute(
        sql_delete(Workflow).where(
            Workflow.id == wid,
            Workflow.tenant_id == current_user.tenant_id,
        )
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Workflow not found")
