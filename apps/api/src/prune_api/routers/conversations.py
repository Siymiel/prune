"""Conversations router — list conversations and fetch message threads."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from prune_api.core.auth import CurrentUser, get_current_user
from prune_api.db.base import get_session
from prune_api.db.models import Conversation, Message

router = APIRouter()


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: str


class ConversationOut(BaseModel):
    id: str
    workflow_id: str | None
    channel: str
    contact_phone: str | None
    last_message: MessageOut | None
    message_count: int
    created_at: str
    updated_at: str


@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations(
    workflow_id: str | None = None,
    channel: str | None = None,
    page: int = 0,
    page_size: int = 20,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ConversationOut]:
    q = (
        select(Conversation)
        .where(Conversation.tenant_id == current_user.tenant_id)
        .order_by(Conversation.updated_at.desc())
    )
    if workflow_id:
        try:
            q = q.where(Conversation.workflow_id == uuid.UUID(workflow_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid workflow_id")
    if channel:
        q = q.where(Conversation.channel == channel)

    q = q.offset(page * page_size).limit(page_size)
    convs = (await session.execute(q)).scalars().all()

    result = []
    for conv in convs:
        last_msg = (await session.execute(
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )).scalar_one_or_none()

        count = (await session.execute(
            select(func.count()).select_from(Message).where(
                Message.conversation_id == conv.id
            )
        )).scalar_one()

        result.append(_conv_out(conv, last_msg, count))

    return result


@router.get("/conversations/{conv_id}", response_model=ConversationOut)
async def get_conversation(
    conv_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ConversationOut:
    cid = _parse_uuid(conv_id)

    conv = (await session.execute(
        select(Conversation).where(
            Conversation.id == cid,
            Conversation.tenant_id == current_user.tenant_id,
        )
    )).scalar_one_or_none()
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    last_msg = (await session.execute(
        select(Message)
        .where(Message.conversation_id == cid)
        .order_by(Message.created_at.desc())
        .limit(1)
    )).scalar_one_or_none()

    count = (await session.execute(
        select(func.count()).select_from(Message).where(
            Message.conversation_id == cid
        )
    )).scalar_one()

    return _conv_out(conv, last_msg, count)


@router.get("/conversations/{conv_id}/messages", response_model=list[MessageOut])
async def get_messages(
    conv_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[MessageOut]:
    cid = _parse_uuid(conv_id)

    if (await session.execute(
        select(Conversation).where(
            Conversation.id == cid,
            Conversation.tenant_id == current_user.tenant_id,
        )
    )).scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msgs = (await session.execute(
        select(Message)
        .where(Message.conversation_id == cid)
        .order_by(Message.created_at)
    )).scalars().all()

    return [_msg_out(m) for m in msgs]


def _parse_uuid(value: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID")


def _msg_out(m: Message) -> MessageOut:
    return MessageOut(
        id=str(m.id),
        role=m.role,
        content=m.content,
        created_at=m.created_at.isoformat(),
    )


def _conv_out(conv: Conversation, last_msg: Message | None, count: int) -> ConversationOut:
    return ConversationOut(
        id=str(conv.id),
        workflow_id=str(conv.workflow_id) if conv.workflow_id else None,
        channel=conv.channel,
        contact_phone=conv.contact_phone,
        last_message=_msg_out(last_msg) if last_msg else None,
        message_count=count,
        created_at=conv.created_at.isoformat(),
        updated_at=conv.updated_at.isoformat(),
    )
