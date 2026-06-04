"""AudioInputNode — transcribe audio to text via Deepgram or OpenAI Whisper."""

from __future__ import annotations

from prune_api.nodes.base import Node, NodeContext, NodeResult


class AudioInputNode(Node):
    """Receives an audio file and returns its transcription as state["message"].

    Config keys:
      provider   — "deepgram" | "whisper-1" (default: "deepgram")
      model      — Deepgram model: "nova-2" | "nova" | "enhanced" | "base"
                   (ignored for whisper-1)
      submodel   — Deepgram submodel, e.g. "general" (default: "general")
      api_key    — provider API key; falls back to env vars if empty

    Runtime inputs:
      inputs["audio"] — base64-encoded audio string or raw bytes
      inputs["file"]  — alternative key for audio data

    Output:
      state["message"] — transcribed text string
    """

    type = "audio.transcribe"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        cfg = self.config
        next_node = cfg.get("next")
        provider: str = cfg.get("provider", "deepgram")
        model: str = cfg.get("model", "nova-2")
        submodel: str = cfg.get("submodel", "general")
        api_key: str = cfg.get("api_key", "")
        source: str = cfg.get("source", "recording")
        source_url: str = cfg.get("source_url", "")

        if source == "url":
            if not source_url:
                return {"status": "ok", "output": {"message": ""}, "next": next_node}
            try:
                import httpx
                async with httpx.AsyncClient(timeout=60.0) as client:
                    resp = await client.get(source_url, follow_redirects=True)
                    resp.raise_for_status()
                    audio_bytes: bytes = resp.content
            except Exception as exc:
                return {"status": "error", "output": {"error": f"Failed to fetch audio: {exc}"}, "next": next_node}
        else:
            audio_data = ctx["inputs"].get("audio") or ctx["inputs"].get("file")
            if not audio_data:
                return {"status": "ok", "output": {"message": ""}, "next": next_node}
            if isinstance(audio_data, str):
                import base64
                try:
                    audio_bytes = base64.b64decode(audio_data)
                except Exception:
                    audio_bytes = audio_data.encode()
            else:
                audio_bytes = bytes(audio_data)

        try:
            if provider == "whisper-1":
                transcript = await _transcribe_whisper(audio_bytes, api_key)
            else:
                transcript = await _transcribe_deepgram(audio_bytes, api_key, model, submodel)
        except Exception as exc:
            return {"status": "error", "output": {"error": str(exc)}, "next": next_node}

        return {"status": "ok", "output": {"message": transcript}, "next": next_node}


async def _transcribe_deepgram(
    audio_bytes: bytes,
    api_key: str,
    model: str,
    submodel: str,
) -> str:
    import os
    import httpx

    key = api_key or os.getenv("DEEPGRAM_API_KEY", "")
    params = {"model": model, "tier": submodel, "smart_format": "true"}

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.deepgram.com/v1/listen",
            params=params,
            content=audio_bytes,
            headers={
                "Authorization": f"Token {key}",
                "Content-Type": "audio/*",
            },
        )
        resp.raise_for_status()
        data = resp.json()

    channels = data.get("results", {}).get("channels", [])
    if channels:
        alts = channels[0].get("alternatives", [])
        if alts:
            return alts[0].get("transcript", "")
    return ""


async def _transcribe_whisper(audio_bytes: bytes, api_key: str) -> str:
    import os
    import httpx

    key = api_key or os.getenv("OPENAI_API_KEY", "")

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {key}"},
            files={"file": ("audio.mp3", audio_bytes, "audio/mpeg")},
            data={"model": "whisper-1"},
        )
        resp.raise_for_status()
        return resp.json().get("text", "")
