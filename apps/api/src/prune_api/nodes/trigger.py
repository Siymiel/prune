"""TriggerNode — workflow entry-point that resolves the trigger payload into state."""

from __future__ import annotations

from prune_api.nodes.base import Node, NodeContext, NodeResult


class TriggerNode(Node):
    """Resolves the triggering event into workflow state.

    config.trigger_type: "manual" | "scheduled" | "webhook" | "integration"

    Outputs by type:
      manual:      message           → state["message"]
      scheduled:   triggered_at      → state["triggered_at"], state["message"]
      webhook:     payload dict      → state["payload"]
      integration: normalized event  → state["event"]
                   Fields from state["event"] are also hoisted to the top-level
                   state so templates like {{state.event.from}} work alongside
                   direct {{state.event}} access.
    """

    type = "input.trigger"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        trigger_type: str = self.config.get("trigger_type", "manual")
        next_node: str | None = self.config.get("next")
        inputs = ctx["inputs"]

        if trigger_type == "scheduled":
            return {
                "status": "ok",
                "output": {
                    "triggered_at": inputs.get("triggered_at", ""),
                    "message": inputs.get("message", ""),
                },
                "next": next_node,
            }

        if trigger_type == "webhook":
            payload = inputs.get("payload") or dict(inputs)
            return {
                "status": "ok",
                "output": {"payload": payload},
                "next": next_node,
            }

        if trigger_type == "integration":
            # Accept a pre-normalized event dict (from the router) or raw inputs
            event: dict = inputs.get("event") or dict(inputs)
            return {
                "status": "ok",
                "output": {
                    "event": event,
                    # Hoist all event fields to top-level for convenient template access
                    **{k: v for k, v in event.items() if k not in ("event",)},
                },
                "next": next_node,
            }

        # manual / chat (default)
        return {
            "status": "ok",
            "output": {"message": inputs.get("message", "")},
            "next": next_node,
        }
