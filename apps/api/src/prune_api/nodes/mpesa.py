"""M-Pesa STK Push node.

Issues a Daraja STK Push and pauses the workflow until the callback
fires. The wait_token is the CheckoutRequestID returned by Safaricom.
"""

from __future__ import annotations

import base64
from datetime import UTC, datetime
from typing import Any

import httpx

from prune_api.core.settings import settings
from prune_api.nodes.base import Node, NodeContext, NodeResult

_DARAJA_BASE = {
    "sandbox": "https://sandbox.safaricom.co.ke",
    "production": "https://api.safaricom.co.ke",
}


async def _daraja_token() -> str:
    """Fetch a short-lived OAuth2 token from the Daraja API."""
    base_url = _DARAJA_BASE.get(settings.daraja_env, _DARAJA_BASE["sandbox"])
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{base_url}/oauth/v1/generate",
            params={"grant_type": "client_credentials"},
            auth=(settings.daraja_consumer_key, settings.daraja_consumer_secret),
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()["access_token"]


class MpesaSTKPushNode(Node):
    type = "payment.mpesa_stk"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        amount: int = self._resolve(self.config.get("amount", 0), ctx)
        phone: str = self._resolve(self.config["phone"], ctx)
        reference: str = self._resolve(self.config.get("reference", "Prune"), ctx)

        # Normalize to 254XXXXXXXXX format
        phone_norm = phone.lstrip("+").lstrip("0")
        if not phone_norm.startswith("254"):
            phone_norm = "254" + phone_norm

        timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
        password = base64.b64encode(
            f"{settings.daraja_shortcode}{settings.daraja_passkey}{timestamp}".encode()
        ).decode()

        try:
            token = await _daraja_token()
        except httpx.HTTPError as exc:
            return {"status": "error", "error": f"Daraja auth failed: {exc}"}

        base_url = _DARAJA_BASE.get(settings.daraja_env, _DARAJA_BASE["sandbox"])
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{base_url}/mpesa/stkpush/v1/processrequest",
                    headers={"Authorization": f"Bearer {token}"},
                    json={
                        "BusinessShortCode": settings.daraja_shortcode,
                        "Password": password,
                        "Timestamp": timestamp,
                        "TransactionType": "CustomerPayBillOnline",
                        "Amount": int(amount),
                        "PartyA": phone_norm,
                        "PartyB": settings.daraja_shortcode,
                        "PhoneNumber": phone_norm,
                        "CallBackURL": settings.daraja_callback_url,
                        "AccountReference": reference,
                        "TransactionDesc": reference,
                    },
                    timeout=30,
                )
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPError as exc:
            return {"status": "error", "error": f"Daraja STK push failed: {exc}"}

        if data.get("ResponseCode") != "0":
            return {
                "status": "error",
                "error": f"Daraja error: {data.get('ResponseDescription', data)}",
            }

        checkout_request_id: str = data["CheckoutRequestID"]

        return {
            "status": "wait",
            "wait_token": checkout_request_id,
            "ttl_seconds": 60,
            "output": {
                "payment.amount_kes": amount,
                "payment.phone": phone_norm,
                "payment.reference": reference,
                "payment.checkout_request_id": checkout_request_id,
            },
        }

    @staticmethod
    def _resolve(value: Any, ctx: NodeContext) -> Any:
        """Resolve {{state.x}}-style templates against the run state."""
        if isinstance(value, str) and value.startswith("{{") and value.endswith("}}"):
            path = value[2:-2].strip()
            ref = ctx["state"]
            for part in path.split("."):
                ref = ref.get(part) if isinstance(ref, dict) else None
                if ref is None:
                    break
            return ref
        return value
