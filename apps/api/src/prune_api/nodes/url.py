"""UrlNode — fetch and extract content from a web URL."""

from __future__ import annotations

from prune_api.nodes.base import Node, NodeContext, NodeResult


class UrlNode(Node):
    """Fetches a URL and extracts HTML content or metadata.

    Config keys:
      url                  — static URL (overridden by runtime inputs["url"])
      extraction_mode      — "html" | "metadata" (default: "html")
      enable_subpage_crawl — crawl linked pages on same domain (default: False)
      enable_as_input      — accept URL from upstream via inputs["url"] (default: False)
      chunk_size           — chars per chunk (default: 500, 0 = no chunking)
      chunk_overlap_pct    — overlap % between chunks (default: 20)
      chunking_method      — "sentence" | "naive" (default: "sentence")
      enable_ocr           — OCR text from images (default: False, not yet implemented)

    Outputs:
      html mode:     state["html_content"] — chunked HTML/text string
      metadata mode: state["metadata"]     — dict of meta tags + title + url
    """

    type = "web.scrape"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        cfg = self.config
        next_node = cfg.get("next")
        extraction_mode: str = cfg.get("extraction_mode", "html")
        chunk_size: int = int(cfg.get("chunk_size", 500))
        chunk_overlap_pct: int = int(cfg.get("chunk_overlap_pct", 20))
        chunking_method: str = cfg.get("chunking_method", "sentence")

        url: str = ctx["inputs"].get("url") or cfg.get("url", "")

        if not url:
            return {
                "status": "ok",
                "output": {"html_content": "", "metadata": {}},
                "next": next_node,
            }

        try:
            import httpx

            async with httpx.AsyncClient(
                timeout=15.0,
                follow_redirects=True,
            ) as client:
                resp = await client.get(
                    url,
                    headers={"User-Agent": "Mozilla/5.0 (compatible; PruneAI/1.0)"},
                )
                resp.raise_for_status()
                html = resp.text
        except Exception as exc:
            return {"status": "error", "output": {"error": str(exc)}, "next": next_node}

        if extraction_mode == "metadata":
            return {
                "status": "ok",
                "output": {"metadata": _extract_metadata(html, url)},
                "next": next_node,
            }

        # html mode — optionally chunk
        if chunk_size > 0:
            from prune_api.routers.knowledge import _chunk_text

            chunks = _chunk_text(html, chunk_size, chunk_overlap_pct, chunking_method)
            content = "\n\n".join(chunks)
        else:
            content = html

        return {
            "status": "ok",
            "output": {"html_content": content},
            "next": next_node,
        }


def _extract_metadata(html: str, url: str) -> dict:
    """Parse <meta> tags and <title> from raw HTML."""
    from html.parser import HTMLParser

    class _Parser(HTMLParser):
        def __init__(self) -> None:
            super().__init__()
            self.meta: dict[str, str] = {}
            self.title = ""
            self._in_title = False

        def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
            if tag == "meta":
                a = dict(attrs)
                key = a.get("name") or a.get("property") or a.get("http-equiv", "")
                val = a.get("content", "")
                if key and val:
                    self.meta[key.lower()] = val
            elif tag == "title":
                self._in_title = True

        def handle_data(self, data: str) -> None:
            if self._in_title:
                self.title += data

        def handle_endtag(self, tag: str) -> None:
            if tag == "title":
                self._in_title = False

    p = _Parser()
    p.feed(html)
    return {"url": url, "title": p.title.strip(), **p.meta}
