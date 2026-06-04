"""FilesNode — parse uploaded files and inject their text into workflow state."""

from __future__ import annotations

from prune_api.nodes.base import Node, NodeContext, NodeResult


class FilesNode(Node):
    """Reads file content from runtime inputs or pre-loaded config, extracts text,
    chunks it, and writes a single ``file_context`` string into state.

    Config keys:
      enable_parsing    — extract text from binary formats (default: True)
      chunk_size        — target chunk size in characters (default: 500)
      chunk_overlap_pct — overlap between chunks as % of chunk_size (default: 20)
      chunking_method   — "sentence" | "naive" (default: "sentence")
      files             — list of pre-loaded files: [{name, text, type, size}]
                          used when expose_as_input is False

    Runtime inputs:
      inputs["files"]   — list of {name, text, type} supplied by the caller;
                          takes precedence over config files
    """

    type = "files.parse"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        cfg = self.config
        enable_parsing: bool = cfg.get("enable_parsing", True)
        chunk_size: int = int(cfg.get("chunk_size", 500))
        chunk_overlap_pct: int = int(cfg.get("chunk_overlap_pct", 20))
        chunking_method: str = cfg.get("chunking_method", "sentence")

        runtime_files: list[dict] = ctx["inputs"].get("files") or []
        config_files: list[dict] = cfg.get("files") or []
        files = runtime_files if runtime_files else config_files

        if not files:
            return {
                "status": "ok",
                "output": {"file_context": ""},
                "next": cfg.get("next"),
            }

        from prune_api.routers.knowledge import _chunk_text, _extract_text

        parts: list[str] = []
        for f in files:
            name: str = f.get("name", "file")
            raw = f.get("content") or f.get("text", "")
            file_type: str = f.get("type", "txt")

            if enable_parsing:
                if isinstance(raw, bytes):
                    text = _extract_text(name, raw)
                elif isinstance(raw, str):
                    # Already-extracted text (common path from /v1/files/extract)
                    text = raw
                else:
                    text = str(raw)
            else:
                text = raw if isinstance(raw, str) else str(raw)

            if text.strip():
                parts.append(f"[File: {name}]\n{text.strip()}")

        combined = "\n\n---\n\n".join(parts)

        if combined and chunk_size > 0:
            chunks = _chunk_text(combined, chunk_size, chunk_overlap_pct, chunking_method)
            file_context = "\n\n".join(chunks)
        else:
            file_context = combined

        return {
            "status": "ok",
            "output": {"file_context": file_context},
            "next": cfg.get("next"),
        }
