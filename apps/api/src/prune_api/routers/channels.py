"""WorkflowChannel CRUD — deploy and manage channels for a workflow."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from prune_api.core.auth import CurrentUser, get_current_user
from prune_api.db.base import get_session
from prune_api.db.models import Workflow, WorkflowChannel

router = APIRouter()


class ChannelCreate(BaseModel):
    workflow_id: str
    channel_type: str  # whatsapp | web | api
    config: dict[str, Any] = {}


class ChannelOut(BaseModel):
    id: str
    workflow_id: str
    channel_type: str
    config: dict[str, Any]
    is_active: bool
    created_at: str


@router.post("/channels", response_model=ChannelOut)
async def create_channel(
    body: ChannelCreate,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ChannelOut:
    try:
        wf_id = uuid.UUID(body.workflow_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workflow_id")

    wf = (await session.execute(
        select(Workflow).where(
            Workflow.id == wf_id,
            Workflow.tenant_id == current_user.tenant_id,
        )
    )).scalar_one_or_none()
    if wf is None:
        raise HTTPException(status_code=404, detail="Workflow not found")

    channel = WorkflowChannel(
        workflow_id=wf_id,
        channel_type=body.channel_type,
        config=body.config,
        is_active=True,
    )
    session.add(channel)
    await session.commit()
    await session.refresh(channel)

    return _out(channel)


@router.get("/channels", response_model=list[ChannelOut])
async def list_channels(
    workflow_id: str | None = None,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ChannelOut]:
    q = (
        select(WorkflowChannel)
        .join(Workflow)
        .where(
            Workflow.tenant_id == current_user.tenant_id,
            WorkflowChannel.is_active.is_(True),
        )
    )
    if workflow_id:
        try:
            q = q.where(WorkflowChannel.workflow_id == uuid.UUID(workflow_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid workflow_id")

    rows = (await session.execute(q)).scalars().all()
    return [_out(ch) for ch in rows]


@router.delete("/channels/{channel_id}", status_code=204)
async def delete_channel(
    channel_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    try:
        cid = uuid.UUID(channel_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid channel_id")

    row = await session.execute(
        select(WorkflowChannel)
        .join(Workflow)
        .where(
            WorkflowChannel.id == cid,
            Workflow.tenant_id == current_user.tenant_id,
        )
    )
    channel = row.scalar_one_or_none()
    if channel is None:
        raise HTTPException(status_code=404, detail="Channel not found")

    channel.is_active = False
    await session.commit()


def _out(ch: WorkflowChannel) -> ChannelOut:
    return ChannelOut(
        id=str(ch.id),
        workflow_id=str(ch.workflow_id),
        channel_type=ch.channel_type,
        config=ch.config or {},
        is_active=ch.is_active,
        created_at=ch.created_at.isoformat(),
    )
