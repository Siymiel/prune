"""M-Pesa STK Push node.

Issues a Daraja STK Push and pauses the workflow until the callback
fires. The wait_token is the CheckoutRequestID returned by Safaricom.
"""

from __future__ import annotations

import uuid
from typing import Any

from prune_api.nodes.base import Node, NodeContext, NodeResult


class MpesaSTKPushNode(Node):
    type = "payment.mpesa_stk"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        amount: int = self._resolve(self.config.get("amount", 0), ctx)
        phone: str = self._resolve(self.config["phone"], ctx)
        reference: str = self._resolve(
            self.config.get("reference", "Prune"), ctx
        )

        # TODO: call Daraja STK push API
        # response = await mpesa_client.stk_push(phone=phone, amount=amount, ...)
        # checkout_request_id = response["CheckoutRequestID"]
        checkout_request_id = f"stub-{uuid.uuid4()}"  # placeholder

        return {
            "status": "wait",
            "wait_token": checkout_request_id,
            "ttl_seconds": 60,
            "output": {
                "payment.amount_kes": amount,
                "payment.phone": phone,
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
