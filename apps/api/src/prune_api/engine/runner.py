"""Workflow engine run loop.

Loads a workflow definition, executes nodes in order, handles `wait` states
by persisting wait_tokens to Redis, and resumes runs when wait_tokens are
fired by webhooks (e.g. M-Pesa STK callback).
"""

from __future__ import annotations

import time
from collections.abc import AsyncGenerator
from typing import Any

from prune_api.nodes.base import Node, NodeContext, NodeResult


class RunStatus:
    PENDING = "pending"
    RUNNING = "running"
    WAITING = "waiting"   # paused on external callback (M-Pesa, human handoff)
    DONE    = "done"
    ERROR   = "error"


async def run_workflow_iter(
    workflow: dict[str, Any],
    inputs: dict[str, Any],
    *,
    tenant_id: str,
    conversation_id: str,
    run_id: str,
    node_registry: dict[str, type[Node]],
) -> AsyncGenerator[dict[str, Any], None]:
    """Async generator that yields one event dict per node execution.

    Each yielded dict has an "event" key:
      "step" — a node finished; fields: node, node_type, status, ms, input, output, error
      "done" — workflow terminal; fields: status, state, and optionally error / wait fields
    """
    state: dict[str, Any] = {**inputs}
    node_outputs: dict[str, Any] = {}
    current: str | None = workflow.get("entry")
    if not current and workflow.get("nodes"):
        current = workflow["nodes"][0]["id"]
    node_map = {n["id"]: n for n in workflow.get("nodes", [])}

    while current:
        node_def = node_map.get(current)
        if node_def is None:
            yield {
                "event": "step", "node": current, "node_type": "unknown",
                "status": "error", "ms": 0, "input": dict(state),
                "error": f"Node '{current}' not found",
            }
            yield {"event": "done", "status": RunStatus.ERROR,
                   "error": f"Node '{current}' not found in workflow", "state": state}
            return

        node_type = node_def["type"]
        node_cls = node_registry.get(node_type)
        if node_cls is None:
            yield {
                "event": "step", "node": current, "node_type": node_type,
                "status": "error", "ms": 0, "input": dict(state),
                "error": f"Unknown node type '{node_type}'",
            }
            yield {"event": "done", "status": RunStatus.ERROR,
                   "error": f"Unknown node type '{node_type}'", "state": state}
            return

        node = node_cls(node_def["id"], node_def.get("config", {}))
        ctx: NodeContext = {
            "run_id": run_id,
            "tenant_id": tenant_id,
            "conversation_id": conversation_id,
            "inputs": inputs,
            "state": state,
            "node_outputs": node_outputs,
            "workflow": workflow,
        }
        input_snapshot = dict(state)
        t0 = time.monotonic()
        try:
            result: NodeResult = await node.execute(ctx)
        except Exception as exc:
            elapsed_ms = round((time.monotonic() - t0) * 1000)
            yield {
                "event": "step", "node": current, "node_type": node_type,
                "status": "error", "ms": elapsed_ms, "input": input_snapshot,
                "error": str(exc),
            }
            yield {"event": "done", "status": RunStatus.ERROR,
                   "error": f"Node '{current}' raised: {exc}", "state": state}
            return

        elapsed_ms = round((time.monotonic() - t0) * 1000)
        result_status: str = result.get("status", "error")

        yield {
            "event": "step",
            "node": current,
            "node_type": node_type,
            "status": result_status,
            "ms": elapsed_ms,
            "input": input_snapshot,
            "output": result.get("output"),
            "error": result.get("error") if result_status == "error" else None,
        }

        match result_status:
            case "ok":
                if output := result.get("output"):
                    state.update(output)
                    node_outputs[current] = output
                current = result.get("next")  # type: ignore[assignment]
            case "wait":
                yield {
                    "event": "done",
                    "status": RunStatus.WAITING,
                    "wait_token": result["wait_token"],
                    "ttl_seconds": result.get("ttl_seconds", 300),
                    "next_node": current,
                    "state": state,
                }
                return
            case "error":
                yield {"event": "done", "status": RunStatus.ERROR,
                       "error": result.get("error"), "state": state}
                return
            case _:
                yield {"event": "done", "status": RunStatus.ERROR,
                       "error": f"Node '{current}' returned invalid status", "state": state}
                return

    yield {"event": "done", "status": RunStatus.DONE, "state": state}


async def run_workflow(
    workflow: dict[str, Any],
    inputs: dict[str, Any],
    *,
    tenant_id: str,
    conversation_id: str,
    run_id: str,
    node_registry: dict[str, type[Node]],
) -> dict[str, Any]:
    """Consume run_workflow_iter and return a single result dict.

    Preserved for backward compatibility with chat.py and other callers that
    expect a blocking call returning the full trace.
    """
    trace: list[dict[str, Any]] = []
    final: dict[str, Any] = {"status": RunStatus.ERROR, "state": {}, "trace": []}

    async for event in run_workflow_iter(
        workflow, inputs,
        tenant_id=tenant_id,
        conversation_id=conversation_id,
        run_id=run_id,
        node_registry=node_registry,
    ):
        if event["event"] == "step":
            trace.append({
                "node":      event["node"],
                "node_type": event["node_type"],
                "status":    event["status"],
                "ms":        event.get("ms", 0),
                "input":     event.get("input"),
                "output":    event.get("output"),
                "error":     event.get("error"),
            })
        elif event["event"] == "done":
            final = {k: v for k, v in event.items() if k != "event"}
            final["trace"] = trace

    return final
