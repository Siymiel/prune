"""AI respond node — calls Anthropic Claude to generate a reply."""

from __future__ import annotations

import anthropic

from prune_api.core.settings import settings
from prune_api.nodes.base import Node, NodeContext, NodeResult


class AIRespondNode(Node):
    """Calls Claude with the conversation history and returns a text reply.

    Expected state keys coming in:
      state["message"]  — the current user message (str)
      state["history"]  — prior turns [{"role": "user"|"assistant", "content": str}]

    Injects into state on ok:
      state["reply"]    — the assistant's response text
    """

    type = "ai.respond"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        state = ctx["state"]
        cfg = self.config

        model: str = cfg.get("model", "claude-haiku-4-5-20251001")
        system_prompt: str = cfg.get("system_prompt", "You are a helpful AI assistant.")
        max_tokens: int = int(cfg.get("max_tokens", 1024))
        temperature: float = float(cfg.get("temperature", 0.7))

        history: list[dict] = state.get("history", [])
        user_message: str = state.get("message", "")

        messages = [*history, {"role": "user", "content": user_message}]

        if not settings.anthropic_api_key:
            return {"status": "error", "error": "ANTHROPIC_API_KEY is not configured"}

        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        response = await client.messages.create(
            model=model,
            system=system_prompt,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )

        reply: str = response.content[0].text  # type: ignore[union-attr]

        return {
            "status": "ok",
            "output": {"reply": reply},
            "next": cfg.get("next"),  # None → workflow ends here
        }
