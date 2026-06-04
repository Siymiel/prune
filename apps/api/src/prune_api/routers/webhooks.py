"""Inbound webhooks: WhatsApp Cloud API and M-Pesa Daraja STK callbacks.

These are entry points into the workflow engine. Each webhook validates
the payload, idempotently creates a run, and dispatches it to the engine.
"""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import select

from prune_api.core.settings import settings
from prune_api.db.base import AsyncSessionLocal
from prune_api.db.models import Conversation, Message, Run, Workflow, WorkflowChannel
from prune_api.engine.runner import RunStatus
from prune_api.routers.runs import _canvas_to_engine, _execute_run

router = APIRouter()


# ---------------------------------------------------------------------------
# WhatsApp Cloud API
# ---------------------------------------------------------------------------

@router.get("/whatsapp")
async def whatsapp_verify(
    hub_mode: str | None = None,
    hub_challenge: str | None = None,
    hub_verify_token: str | None = None,
) -> Any:
    """Meta webhook verification handshake."""
    if (
        hub_mode == "subscribe"
        and hub_verify_token == settings.whatsapp_verify_token
        and hub_challenge
    ):
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/whatsapp")
async def whatsapp_inbound(request: Request) -> dict[str, str]:
    """Inbound WhatsApp message. Validates signature, then dispatches a workflow run."""
    raw_body = await request.body()

    # 1. Validate X-Hub-Signature-256 when app secret is configured
    if settings.whatsapp_app_secret:
        sig_header = request.headers.get("X-Hub-Signature-256", "")
        expected = "sha256=" + hmac.new(
            settings.whatsapp_app_secret.encode(),
            raw_body,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(sig_header, expected):
            raise HTTPException(status_code=401, detail="Invalid signature")

    payload: dict[str, Any] = json.loads(raw_body)

    # 2. Extract message fields — skip delivery/read receipts and non-text messages
    try:
        change = payload["entry"][0]["changes"][0]["value"]
        messages_list = change.get("messages")
        if not messages_list:
            return {"status": "ok"}
        msg = messages_list[0]
        if msg.get("type") != "text":
            return {"status": "ok"}
        phone_number_id: str = change["metadata"]["phone_number_id"]
        from_phone: str = msg["from"]
        text: str = msg["text"]["body"]
        wamid: str = msg["id"]
    except (KeyError, IndexError):
        return {"status": "ok"}

    # 3. Tenant + workflow lookup via WorkflowChannel
    async with AsyncSessionLocal() as session:
        channel_row = await session.execute(
            select(WorkflowChannel).where(
                WorkflowChannel.channel_type == "whatsapp",
                WorkflowChannel.config["phone_number_id"].astext == phone_number_id,
                WorkflowChannel.is_active.is_(True),
            )
        )
        channel = channel_row.scalar_one_or_none()
        if channel is None:
            return {"status": "ok"}

        wf_row = await session.execute(
            select(Workflow).where(Workflow.id == channel.workflow_id)
        )
        workflow = wf_row.scalar_one_or_none()
        if workflow is None:
            return {"status": "ok"}

        tenant_id = workflow.tenant_id

        # 4. Upsert conversation keyed on (workflow, channel, contact phone)
        conv_row = await session.execute(
            select(Conversation).where(
                Conversation.workflow_id == workflow.id,
                Conversation.channel == "whatsapp",
                Conversation.contact_phone == from_phone,
            )
        )
        conversation = conv_row.scalar_one_or_none()
        if conversation is None:
            conversation = Conversation(
                tenant_id=tenant_id,
                workflow_id=workflow.id,
                channel="whatsapp",
                contact_phone=from_phone,
            )
            session.add(conversation)
            await session.flush()

        session.add(Message(
            conversation_id=conversation.id,
            role="user",
            content=text,
            meta={"wamid": wamid},
        ))

        # 5. Create run and fire engine in background
        engine_graph = _canvas_to_engine(workflow.graph)
        run_inputs = {"message": text, "phone": from_phone}
        run_id = uuid.uuid4()
        session.add(Run(
            id=run_id,
            tenant_id=tenant_id,
            workflow_id=workflow.id,
            conversation_id=conversation.id,
            status=RunStatus.PENDING,
            state=run_inputs,
            started_at=datetime.now(UTC),
        ))
        await session.commit()

    asyncio.create_task(
        _execute_run(run_id, engine_graph, run_inputs, str(tenant_id))
    )

    return {"status": "queued"}


# ---------------------------------------------------------------------------
# M-Pesa Daraja STK callback
# ---------------------------------------------------------------------------

@router.post("/mpesa/stk-callback")
async def mpesa_stk_callback(request: Request) -> dict[str, Any]:
    """M-Pesa Daraja STK push callback.

    Resumes any workflow run that's waiting on the originating CheckoutRequestID.
    """
    payload = await request.json()

    # Parse Safaricom callback envelope
    try:
        stk = payload["Body"]["stkCallback"]
        checkout_request_id: str = stk["CheckoutRequestID"]
        result_code: int = stk["ResultCode"]
        result_desc: str = stk.get("ResultDesc", "")
    except (KeyError, TypeError):
        return {"ResultCode": 0, "ResultDesc": "Accepted"}

    # CallbackMetadata is only present on success (ResultCode == 0)
    meta_items: list[dict[str, Any]] = stk.get("CallbackMetadata", {}).get("Item", [])
    metadata: dict[str, Any] = {item["Name"]: item.get("Value") for item in meta_items}

    payment_result = {
        "payment.result_code": result_code,
        "payment.result_desc": result_desc,
        "payment.success": result_code == 0,
        "payment.receipt": metadata.get("MpesaReceiptNumber"),
        "payment.amount_paid": metadata.get("Amount"),
        "payment.transaction_date": str(metadata.get("TransactionDate", "")),
        "payment.phone_paid": str(metadata.get("PhoneNumber", "")),
    }

    async with AsyncSessionLocal() as session:
        run_row = await session.execute(
            select(Run).where(
                Run.wait_token == checkout_request_id,
                Run.status == RunStatus.WAITING,
            )
        )
        run = run_row.scalar_one_or_none()
        if run is None or not run.resume_node:
            return {"ResultCode": 0, "ResultDesc": "Accepted"}

        wf_row = await session.execute(
            select(Workflow).where(Workflow.id == run.workflow_id)
        )
        workflow = wf_row.scalar_one_or_none()
        if workflow is None:
            return {"ResultCode": 0, "ResultDesc": "Accepted"}

        engine_graph = _canvas_to_engine(workflow.graph)
        resume_graph = {**engine_graph, "entry": run.resume_node}
        merged_inputs = {**(run.state or {}), **payment_result}

        run_id = run.id
        tenant_id = str(run.tenant_id)

        run.status = RunStatus.PENDING
        run.wait_token = None
        run.resume_node = None
        run.wait_expires_at = None
        await session.commit()

    asyncio.create_task(
        _execute_run(run_id, resume_graph, merged_inputs, tenant_id)
    )

    return {"ResultCode": 0, "ResultDesc": "Accepted"}
