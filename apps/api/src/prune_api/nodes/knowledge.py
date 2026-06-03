"""Knowledge base retrieval node — embeds the query and fetches relevant chunks from Pinecone."""

from __future__ import annotations

import asyncio

from prune_api.core.settings import settings
from prune_api.nodes.base import Node, NodeContext, NodeResult


class KnowledgeBaseNode(Node):
    """Retrieves context from a Pinecone knowledge base.

    Reads state[query_key] (default "message") as the search query,
    embeds it with OpenAI text-embedding-3-small, queries Pinecone in the
    namespace matching the knowledge_base_id, and writes the top-k chunks
    joined by separators into state["context"].

    Downstream AI nodes should reference {{state.context}} in their system
    prompt to ground responses in retrieved content.
    """

    type = "knowledge.retrieve"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        state = ctx["state"]
        cfg = self.config

        kb_id: str = cfg.get("knowledge_base_id", "")
        top_k: int = int(cfg.get("top_k", 5))
        query_key: str = cfg.get("query_key", "message")
        query: str = str(state.get(query_key, ""))

        if not query or not kb_id:
            return {"status": "ok", "output": {"context": ""}, "next": cfg.get("next")}

        if not settings.voyage_api_key:
            return {"status": "error", "error": "VOYAGE_API_KEY is not configured"}
        if not settings.pinecone_api_key:
            return {"status": "error", "error": "PINECONE_API_KEY is not configured"}

        import voyageai
        from pinecone import Pinecone

        vo = voyageai.AsyncClient(api_key=settings.voyage_api_key)
        embed_resp = await vo.embed([query], model="voyage-3", input_type="query")
        query_vector: list[float] = embed_resp.embeddings[0]

        pc = Pinecone(api_key=settings.pinecone_api_key)
        index = pc.Index(settings.pinecone_index)

        results = await asyncio.to_thread(
            index.query,
            namespace=kb_id,
            vector=query_vector,
            top_k=top_k,
            include_metadata=True,
        )

        matches = results.matches if hasattr(results, "matches") else results.get("matches", [])
        context_chunks: list[str] = []
        sources: list[dict] = []
        for m in matches:
            meta = m.metadata if hasattr(m, "metadata") else m.get("metadata") or {}
            meta = meta or {}
            # Use pre-computed summary for context injection; fall back to raw text
            context_text = meta.get("summary") or meta.get("text", "")
            raw_text = meta.get("text", "")
            score = m.score if hasattr(m, "score") else (m.get("score", 0) if isinstance(m, dict) else 0)
            if context_text:
                context_chunks.append(context_text)
                sources.append({
                    "filename": meta.get("filename", "Unknown"),
                    "text": raw_text[:600],  # raw excerpt for "show source"
                    "score": round(float(score), 3) if score else 0.0,
                    "chunk_index": int(meta.get("chunk_index", 0)),
                    "kb_id": meta.get("kb_id", kb_id),
                })

        new_context = "\n\n---\n\n".join(context_chunks)

        # Accumulate context and sources from multiple KB nodes rather than overwriting
        existing: str = state.get("context", "")
        combined = f"{existing}\n\n---\n\n{new_context}" if existing else new_context
        existing_sources: list = state.get("sources", [])

        return {
            "status": "ok",
            "output": {"context": combined, "sources": existing_sources + sources},
            "next": cfg.get("next"),
        }
