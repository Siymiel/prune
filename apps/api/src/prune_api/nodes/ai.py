"""AI respond node — calls Claude (or OpenAI) to generate a reply."""

from __future__ import annotations

import json

import anthropic

from prune_api.core.settings import settings
from prune_api.nodes.base import Node, NodeContext, NodeResult


class AIRespondNode(Node):
    """Calls an LLM with the conversation history and returns a text reply.

    Expected state keys coming in:
      state["message"]  — the current user message (str)
      state["history"]  — prior turns [{"role": "user"|"assistant", "content": str}]
      state["context"]  — optional RAG context injected by KnowledgeBaseNode

    Config keys:
      system_prompt    — instructions / persona (system message)
      prompt           — user-prompt template; prepended to state["message"] when set
      model            — model ID (default: claude-haiku-4-5-20251001)
      max_tokens       — (default: 1024)
      temperature      — (default: 0.7)
      response_format  — "text" | "json"  (default: "text")
      json_schema      — optional JSON Schema string; only used when response_format="json"

    Injects into state on ok:
      state["reply"]   — the assistant's response text
    """

    type = "ai.respond"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        state = ctx["state"]
        cfg = self.config

        model: str = cfg.get("model", "claude-haiku-4-5-20251001")
        system_prompt: str = cfg.get("system_prompt", "You are a helpful AI assistant.")
        prompt_template: str = cfg.get("prompt", "")
        max_tokens: int = int(cfg.get("max_tokens", 1024))
        temperature: float = float(cfg.get("temperature", 0.7))
        response_format: str = cfg.get("response_format", "text")
        json_schema_str: str = cfg.get("json_schema", "") or ""

        history: list[dict] = state.get("history", [])
        user_message: str = state.get("message", "")

        # Prepend user-prompt template when set (adds task-specific instructions before the message)
        if prompt_template.strip():
            user_message = f"{prompt_template.strip()}\n\n{user_message}" if user_message else prompt_template.strip()

        # Inject retrieved KB context into the system prompt when present
        context: str = state.get("context", "")
        if context:
            system_prompt = (
                f"{system_prompt}\n\n"
                "---\n\n"
                "Use the following retrieved knowledge base context to answer the user's question:\n\n"
                f"{context}"
            )

        # JSON mode: append schema instruction to system prompt
        if response_format == "json":
            if json_schema_str.strip():
                system_prompt = (
                    f"{system_prompt}\n\n"
                    "---\n\n"
                    "IMPORTANT: You MUST respond with valid JSON only — no prose, no markdown fences.\n"
                    f"Your response must conform to this JSON Schema:\n{json_schema_str}"
                )
            else:
                system_prompt = (
                    f"{system_prompt}\n\n"
                    "---\n\n"
                    "IMPORTANT: You MUST respond with valid JSON only — no prose, no markdown fences."
                )

        messages = [*history, {"role": "user", "content": user_message}]

        # Route to the correct provider based on model prefix
        model_lower = model.lower()
        if model_lower.startswith("gpt-") or model_lower.startswith("o1") or model_lower.startswith("o3"):
            return await self._call_openai(model, system_prompt, messages, max_tokens, temperature, response_format, json_schema_str, cfg)
        else:
            return await self._call_anthropic(model, system_prompt, messages, max_tokens, temperature, cfg)

    async def _call_anthropic(
        self,
        model: str,
        system_prompt: str,
        messages: list[dict],
        max_tokens: int,
        temperature: float,
        cfg: dict,
    ) -> NodeResult:
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
            "next": cfg.get("next"),
        }

    async def _call_openai(
        self,
        model: str,
        system_prompt: str,
        messages: list[dict],
        max_tokens: int,
        temperature: float,
        response_format: str,
        json_schema_str: str,
        cfg: dict,
    ) -> NodeResult:
        try:
            from openai import AsyncOpenAI
        except ImportError:
            return {"status": "error", "error": "openai package is not installed"}

        if not settings.openai_api_key:
            return {"status": "error", "error": "OPENAI_API_KEY is not configured"}

        client = AsyncOpenAI(api_key=settings.openai_api_key)

        openai_messages = [{"role": "system", "content": system_prompt}, *messages]

        kwargs: dict = {
            "model": model,
            "messages": openai_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        if response_format == "json":
            if json_schema_str.strip():
                try:
                    schema = json.loads(json_schema_str)
                    kwargs["response_format"] = {
                        "type": "json_schema",
                        "json_schema": {"name": "response", "schema": schema},
                    }
                except Exception:
                    kwargs["response_format"] = {"type": "json_object"}
            else:
                kwargs["response_format"] = {"type": "json_object"}

        response = await client.chat.completions.create(**kwargs)
        reply: str = response.choices[0].message.content or ""

        return {
            "status": "ok",
            "output": {"reply": reply},
            "next": cfg.get("next"),
        }
