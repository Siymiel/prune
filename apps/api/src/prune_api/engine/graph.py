"""Canvas → Engine graph conversion.

The builder stores the workflow graph in "canvas format" (nodes + edges as
rendered in the UI).  Before handing the graph to the engine runner we convert
it to the engine's flat node list with explicit `next` pointers.

Canvas node kind → engine node type mapping:

  text-input / trigger / output / action / template-out  → input.text / passthrough
  ai-agent / ai-routing / prune-ai                       → ai.respond
  if-else                                                → logic.if_else
  code                                                   → logic.code
  mpesa                                                  → payment.mpesa_stk
  knowledge-base                                         → knowledge.retrieve
  subflow-tool                                           → passthrough  (metadata only)
  workflow                                               → workflow.call
  (everything else)                                      → passthrough
"""

from __future__ import annotations

from typing import Any

_KIND_TO_TYPE: dict[str, str] = {
    "text-input":    "input.text",
    "files":         "passthrough",
    "trigger":       "passthrough",
    "url":           "passthrough",
    "audio-input":   "passthrough",
    "output":        "workflow.output",
    "action":        "passthrough",
    "audio-output":  "passthrough",
    "template-out":  "passthrough",
    "ai-agent":      "ai.respond",
    "ai-routing":    "logic.if_else",
    "prune-ai":      "ai.respond",
    "openai-app":    "ai.respond",
    "if-else":       "logic.if_else",
    "loop-subflow":  "passthrough",
    "code":          "logic.code",
    "mpesa":         "payment.mpesa_stk",
    "knowledge-base": "knowledge.retrieve",
    "subflow-tool":  "passthrough",          # tool definition only; agent invokes it
    "workflow":      "workflow.call",        # inline call to another saved workflow
    "sticky-note":   "passthrough",
    "default-message": "passthrough",
    "delay":         "passthrough",
    "shared-memory": "passthrough",
    "vector-store":  "passthrough",
    "text-to-sql":   "passthrough",
    "search-tables": "passthrough",
    "search-data":   "passthrough",
    # app integrations → passthrough until implemented
    "whatsapp":            "passthrough",
    "google-calendar-app": "passthrough",
    "google-drive-app":    "passthrough",
    "gmail-app":           "passthrough",
    "slack-app":           "passthrough",
    "google-maps-app":     "passthrough",
}


def canvas_to_engine(graph: dict[str, Any]) -> dict[str, Any]:
    """Convert builder canvas format to the engine's run format."""
    canvas_nodes: list[dict[str, Any]] = graph.get("nodes", [])
    canvas_edges: list[dict[str, Any]] = graph.get("edges", [])

    if not canvas_nodes:
        return {"entry": None, "nodes": []}

    # Build sourceId → first targetId map (single successor per node for now)
    next_map: dict[str, str | None] = {n["id"]: None for n in canvas_nodes}
    for edge in canvas_edges:
        src = edge.get("sourceId") or edge.get("source")
        tgt = edge.get("targetId") or edge.get("target")
        if src and tgt and next_map.get(src) is None:
            next_map[src] = tgt

    # Entry node = node with no incoming edges
    has_incoming: set[str] = {
        edge.get("targetId") or edge.get("target", "")
        for edge in canvas_edges
    }
    entry_id: str = next(
        (n["id"] for n in canvas_nodes if n["id"] not in has_incoming),
        canvas_nodes[0]["id"],
    )

    # For ai-agent nodes with knowledgeBases attached, auto-inject synthetic
    # knowledge.retrieve nodes that run before the agent and populate state["context"].
    synthetic_nodes: list[dict[str, Any]] = []
    kb_chain_first: dict[str, str] = {}

    for n in canvas_nodes:
        if n.get("kind") not in ("ai-agent", "prune-ai", "openai-app"):
            continue
        kb_ids: list[str] = n.get("knowledgeBases") or []
        if not kb_ids:
            continue

        agent_id = n["id"]
        chain_ids = [f"__kb_{agent_id}_{i}" for i in range(len(kb_ids))]

        for i, kb_id in enumerate(kb_ids):
            next_id = chain_ids[i + 1] if i + 1 < len(kb_ids) else agent_id
            synthetic_nodes.append({
                "id": chain_ids[i],
                "type": "knowledge.retrieve",
                "config": {
                    "knowledge_base_id": kb_id,
                    "top_k": int(n.get("topK", 5)),
                    "query_key": "message",
                    "next": next_id,
                },
            })

        kb_chain_first[agent_id] = chain_ids[0]

    for nid in next_map:
        if next_map[nid] in kb_chain_first:
            next_map[nid] = kb_chain_first[next_map[nid]]

    if entry_id in kb_chain_first:
        entry_id = kb_chain_first[entry_id]

    engine_nodes: list[dict[str, Any]] = []
    for n in canvas_nodes:
        kind: str = n.get("kind", "")
        node_type: str = _KIND_TO_TYPE.get(kind, "passthrough")

        config: dict[str, Any] = {"next": next_map.get(n["id"])}

        if node_type == "input.text":
            config["output_key"] = n.get("outputKey") or "message"
            config["value"] = n.get("inputValue", "")
            config["required"] = bool(n.get("required", False))

        elif node_type == "ai.respond":
            config["system_prompt"] = n.get("systemPrompt", "You are a helpful AI assistant.")
            config["prompt"] = n.get("inputValue", "")       # user-prompt field
            config["model"] = n.get("model", "claude-haiku-4-5-20251001")
            config["max_tokens"] = int(n.get("maxTokens", 1024))
            config["temperature"] = float(n.get("temperature", 0.7))
            config["response_format"] = n.get("responseFormat", "text")
            config["json_schema"] = n.get("jsonSchema", "")

        elif node_type == "logic.if_else":
            config["condition"] = n.get("condition", "")
            config["then_next"] = n.get("thenNext") or next_map.get(n["id"])
            config["else_next"] = n.get("elseNext")

        elif node_type == "logic.code":
            config["code"] = n.get("code", "")

        elif node_type == "knowledge.retrieve":
            config["knowledge_base_id"] = n.get("inputValue", "")
            config["top_k"] = int(n.get("topK", 5))
            config["query_key"] = n.get("queryKey", "message")

        elif node_type == "payment.mpesa_stk":
            config["phone"] = n.get("phone", "{{state.message}}")
            config["amount"] = n.get("amount", 0)
            config["reference"] = n.get("reference", "Prune")

        elif node_type == "workflow.call":
            import json as _json
            try:
                wf_cfg = _json.loads(n.get("inputValue") or "{}")
            except Exception:
                wf_cfg = {}
            config["workflow_id"] = wf_cfg.get("workflowId", "")
            config["workflow_name"] = wf_cfg.get("workflowName", "")

        engine_nodes.append({"id": n["id"], "type": node_type, "config": config})

    engine_nodes.extend(synthetic_nodes)

    return {"entry": entry_id, "nodes": engine_nodes}
