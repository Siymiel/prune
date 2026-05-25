"""Inbound webhooks: WhatsApp Cloud API and M-Pesa Daraja STK callbacks.

These are entry points into the workflow engine. Each webhook validates
the payload, idempotently creates a run, and dispatches it to the engine.
"""

from typing import Any

from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/whatsapp")
async def whatsapp_verify(
    hub_mode: str | None = None,
    hub_challenge: str | None = None,
    hub_verify_token: str | None = None,
) -> Any:
    """Meta webhook verification handshake."""
    # TODO: compare hub_verify_token against the tenant's configured token
    if hub_mode == "subscribe" and hub_challenge:
        return int(hub_challenge)
    return {"ok": False}


@router.post("/whatsapp")
async def whatsapp_inbound(request: Request) -> dict[str, str]:
    """Inbound WhatsApp message. Dispatches a workflow run."""
    payload = await request.json()
    # TODO:
    # 1. Validate signature (X-Hub-Signature-256)
    # 2. Extract tenant_id from phone_number_id
    # 3. Upsert contact
    # 4. Create run and dispatch to engine via Redis Streams
    _ = payload
    return {"status": "queued"}


@router.post("/mpesa/stk-callback")
async def mpesa_stk_callback(request: Request) -> dict[str, str]:
    """M-Pesa Daraja STK push callback.

    Resumes any workflow run that's waiting on the originating CheckoutRequestID.
    """
    payload = await request.json()
    # TODO: lookup wait_token by CheckoutRequestID, resume run, persist receipt
    _ = payload
    return {"ResultCode": 0, "ResultDesc": "Accepted"}
