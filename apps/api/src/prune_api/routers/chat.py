"""Chat router — dispatches a user message through the workflow engine.

Two modes:
  Demo  (template_slug)  — runs an in-memory workflow against Claude; no DB writes.
                           Used by the frontend template preview.
  Real  (workflow_id)    — loads the workflow from the DB, persists conversation,
                           messages, run record, and trace steps.
"""

from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime
from typing import Any, AsyncGenerator

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from prune_api.core.settings import settings
from prune_api.db.base import get_session
from prune_api.db.models import Conversation
from prune_api.db.models import Message as MessageModel
from prune_api.db.models import Run
from prune_api.db.models import TraceStep as TraceStepModel
from prune_api.db.models import Workflow
from prune_api.engine.runner import RunStatus, run_workflow
from prune_api.nodes.registry import NODE_REGISTRY

router = APIRouter()

# ---------------------------------------------------------------------------
# Per-template system prompts (demo mode).
# In the real flow these come from the workflow's ai.respond node config in DB.
# ---------------------------------------------------------------------------
_TEMPLATE_SYSTEM_PROMPTS: dict[str, str] = {
    "salon-booking": (
        "You are a friendly AI booking assistant for a salon. "
        "Help customers book appointments, answer questions about services and pricing, "
        "and process M-Pesa deposits when needed. Be warm, concise, and professional. "
        "Keep replies under 3 sentences."
    ),
    "sacco-support": (
        "You are a helpful SACCO customer support agent. "
        "Assist members with loan inquiries, balance checks, and FAQs. "
        "Always verify identity before sharing account details. "
        "Keep replies under 3 sentences."
    ),
    "church-followup": (
        "You are a caring church follow-up assistant. "
        "Welcome new visitors, answer questions about services and events, "
        "take prayer requests, and help with event registration. "
        "Keep replies warm and under 3 sentences."
    ),
    "real-estate": (
        "You are a professional real estate inquiry assistant. "
        "Qualify leads, answer questions about properties, and schedule viewings. "
        "Be helpful and persuasive without being pushy. Keep replies under 3 sentences."
    ),
    "clinic-booking": (
        "You are a healthcare booking assistant for a clinic. "
        "Help patients book appointments, handle prescription refill requests, "
        "and escalate emergencies appropriately. Keep replies under 3 sentences."
    ),
    "restaurant-ordering": (
        "You are a friendly restaurant ordering assistant. "
        "Help customers browse the menu, place orders, process M-Pesa payments, "
        "and coordinate delivery. Keep replies concise and under 3 sentences."
    ),
}
_DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant. Keep replies under 3 sentences."


def _demo_workflow(system_prompt: str) -> dict[str, Any]:
    """Minimal single-node workflow for demo/template-preview mode."""
    return {
        "entry": "respond",
        "nodes": [
            {
                "id": "respond",
                "type": "ai.respond",
                "config": {
                    "model": "claude-haiku-4-5-20251001",
                    "system_prompt": system_prompt,
                    "max_tokens": 512,
                    "temperature": 0.7,
                    "next": None,
                },
            }
        ],
    }


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class MessageItem(BaseModel):
    role: str   # user | assistant
    content: str


class ChatRequest(BaseModel):
    # Demo mode: pass template_slug (no DB required)
    template_slug: str | None = None
    # Real mode: pass workflow_id (full DB persistence)
    workflow_id: str | None = None
    # Continue an existing conversation (real mode only)
    conversation_id: str | None = None
    message: str
    # Client-side history for demo mode (real mode loads from DB)
    history: list[MessageItem] = []


class TraceStepOut(BaseModel):
    node: str
    node_type: str
    status: str
    ms: int = 0


class ChatResponse(BaseModel):
    reply: str
    conversation_id: str | None = None
    trace: list[TraceStepOut]


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    session: AsyncSession = Depends(get_session),
) -> ChatResponse:
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Empty message")

    if req.workflow_id:
        return await _real_dispatch(req, session)
    elif req.template_slug:
        return await _demo_dispatch(req)
    else:
        raise HTTPException(
            status_code=400,
            detail="Provide either workflow_id or template_slug",
        )


# ---------------------------------------------------------------------------
# Demo dispatch — no DB writes, in-memory workflow
# ---------------------------------------------------------------------------

async def _demo_dispatch(req: ChatRequest) -> ChatResponse:
    system_prompt = _TEMPLATE_SYSTEM_PROMPTS.get(
        req.template_slug or "", _DEFAULT_SYSTEM_PROMPT
    )
    workflow = _demo_workflow(system_prompt)

    run_id = str(uuid.uuid4())
    result = await run_workflow(
        workflow,
        inputs={
            "message": req.message,
            "history": [m.model_dump() for m in req.history],
        },
        tenant_id="demo",
        conversation_id="demo",
        run_id=run_id,
        node_registry=NODE_REGISTRY,
    )

    if result["status"] == RunStatus.ERROR:
        raise HTTPException(status_code=502, detail=result.get("error", "Engine error"))

    reply: str = result["state"].get("reply", "")
    trace = [
        TraceStepOut(
            node=step["node"],
            node_type=step.get("node_type", ""),
            status=step["status"],
        )
        for step in result.get("trace", [])
    ]
    return ChatResponse(reply=reply, trace=trace)


# ---------------------------------------------------------------------------
# Real dispatch — full DB persistence
# ---------------------------------------------------------------------------

async def _real_dispatch(req: ChatRequest, session: AsyncSession) -> ChatResponse:
    # 1. Load workflow
    try:
        workflow_uuid = uuid.UUID(req.workflow_id)  # type: ignore[arg-type]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workflow_id")

    row = await session.execute(select(Workflow).where(Workflow.id == workflow_uuid))
    workflow_obj = row.scalar_one_or_none()
    if workflow_obj is None:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # 2. Load or create conversation
    conversation: Conversation
    if req.conversation_id:
        try:
            conv_uuid = uuid.UUID(req.conversation_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid conversation_id")
        conv_row = await session.execute(
            select(Conversation).where(Conversation.id == conv_uuid)
        )
        conversation = conv_row.scalar_one_or_none()  # type: ignore[assignment]
        if conversation is None:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(
            tenant_id=workflow_obj.tenant_id,
            workflow_id=workflow_obj.id,
            channel="web",
            meta={},
        )
        session.add(conversation)
        await session.flush()

    # 3. Load conversation history from DB
    msg_rows = await session.execute(
        select(MessageModel)
        .where(MessageModel.conversation_id == conversation.id)
        .order_by(MessageModel.created_at)
    )
    history = [
        {"role": m.role, "content": m.content}
        for m in msg_rows.scalars().all()
    ]

    # 4. Persist incoming user message
    user_msg = MessageModel(
        conversation_id=conversation.id,
        role="user",
        content=req.message,
        meta={},
    )
    session.add(user_msg)

    # 5. Create a run record
    run_id = uuid.uuid4()
    run = Run(
        id=run_id,
        tenant_id=workflow_obj.tenant_id,
        workflow_id=workflow_obj.id,
        conversation_id=conversation.id,
        status=RunStatus.RUNNING,
        state={},
        started_at=datetime.now(UTC),
    )
    session.add(run)
    await session.flush()

    # 6. Execute the workflow engine
    engine_result = await run_workflow(
        workflow_obj.graph,
        inputs={
            "message": req.message,
            "history": history,
        },
        tenant_id=str(workflow_obj.tenant_id),
        conversation_id=str(conversation.id),
        run_id=str(run_id),
        node_registry=NODE_REGISTRY,
    )

    # 7. Persist run outcome + trace steps
    run.status = engine_result["status"]
    run.state = engine_result.get("state", {})
    run.wait_token = engine_result.get("wait_token")
    run.resume_node = engine_result.get("next_node")

    if engine_result["status"] in (RunStatus.DONE, RunStatus.ERROR):
        run.completed_at = datetime.now(UTC)
    if engine_result["status"] == RunStatus.ERROR:
        run.error = engine_result.get("error")

    for step in engine_result.get("trace", []):
        session.add(TraceStepModel(
            run_id=run_id,
            node_id=step["node"],
            node_type=step.get("node_type", ""),
            status=step["status"],
        ))

    # 8. Persist assistant reply (if the run completed)
    reply = ""
    if engine_result["status"] == RunStatus.DONE:
        reply = engine_result["state"].get("reply", "")
        if reply:
            session.add(MessageModel(
                conversation_id=conversation.id,
                role="assistant",
                content=reply,
                meta={},
            ))

    if engine_result["status"] == RunStatus.ERROR:
        raise HTTPException(
            status_code=502,
            detail=engine_result.get("error", "Workflow engine error"),
        )

    trace = [
        TraceStepOut(
            node=step["node"],
            node_type=step.get("node_type", ""),
            status=step["status"],
        )
        for step in engine_result.get("trace", [])
    ]

    return ChatResponse(
        reply=reply,
        conversation_id=str(conversation.id),
        trace=trace,
    )


# ---------------------------------------------------------------------------
# Streaming endpoint — SSE token-by-token response from Claude
# ---------------------------------------------------------------------------

class StreamRequest(BaseModel):
    template_slug: str | None = None
    message: str
    system_prompt: str | None = None
    model: str = "claude-haiku-4-5-20251001"
    history: list[MessageItem] = []


async def _stream_claude(req: StreamRequest) -> AsyncGenerator[str, None]:
    """Yield SSE-formatted chunks from an Anthropic streaming call."""
    if not settings.anthropic_api_key:
        yield _sse({"error": "ANTHROPIC_API_KEY not configured"})
        return

    system = req.system_prompt or _TEMPLATE_SYSTEM_PROMPTS.get(
        req.template_slug or "", _DEFAULT_SYSTEM_PROMPT
    )
    messages = [*[m.model_dump() for m in req.history], {"role": "user", "content": req.message}]

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    try:
        async with client.messages.stream(
            model=req.model,
            system=system,
            messages=messages,
            max_tokens=512,
        ) as stream:
            async for text in stream.text_stream:
                yield _sse({"token": text})
        yield _sse({"done": True})
    except Exception as exc:
        yield _sse({"error": str(exc)})


def _sse(data: dict[str, Any]) -> str:
    return f"data: {json.dumps(data)}\n\n"


@router.post("/chat/stream")
async def chat_stream(req: StreamRequest) -> StreamingResponse:
    """Stream Claude tokens back as Server-Sent Events.

    Response format: `data: {"token": "..."}\\n\\n`
    Final event:     `data: {"done": true}\\n\\n`
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Empty message")

    return StreamingResponse(
        _stream_claude(req),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
