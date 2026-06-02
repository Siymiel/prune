"""Workflow engine run loop.

Loads a workflow definition, executes nodes in order, handles `wait` states
by persisting wait_tokens to Redis, and resumes runs when wait_tokens are
fired by webhooks (e.g. M-Pesa STK callback).
"""

from __future__ import annotations

from typing import Any

from prune_api.nodes.base import Node, NodeContext, NodeResult


class RunStatus:
    PENDING = "pending"
    RUNNING = "running"
    WAITING = "waiting"   # paused on external callback (M-Pesa, human handoff)
    DONE    = "done"
    ERROR   = "error"


async def run_workflow(
    workflow: dict[str, Any],
    inputs: dict[str, Any],
    *,
    tenant_id: str,
    conversation_id: str,
    run_id: str,
    node_registry: dict[str, type[Node]],
) -> dict[str, Any]:
    """Run a workflow to completion or to its first wait state.

    Returns the run's final state. If status is "waiting", the run will
    be resumed when the corresponding wait_token is fired.
    """
    state: dict[str, Any] = {**inputs}
    current = workflow.get("entry", workflow["nodes"][0]["id"])
    node_map = {n["id"]: n for n in workflow["nodes"]}
    trace: list[dict[str, Any]] = []

    while current:
        node_def = node_map.get(current)
        if node_def is None:
            return {
                "status": RunStatus.ERROR,
                "error": f"Node '{current}' not found in workflow",
                "state": state,
                "trace": trace,
            }

        node_type = node_def["type"]
        node_cls = node_registry.get(node_type)
        if node_cls is None:
            return {
                "status": RunStatus.ERROR,
                "error": f"Unknown node type '{node_type}' — add it to NODE_REGISTRY",
                "state": state,
                "trace": trace,
            }

        node = node_cls(node_def["id"], node_def.get("config", {}))

        ctx: NodeContext = {
            "run_id": run_id,
            "tenant_id": tenant_id,
            "conversation_id": conversation_id,
            "inputs": inputs,
            "state": state,
            "workflow": workflow,
        }

        result: NodeResult = await node.execute(ctx)
        trace.append({
            "node": current,
            "node_type": node_type,
            "status": result.get("status"),
        })

        match result.get("status"):
            case "ok":
                if output := result.get("output"):
                    state.update(output)
                current = result.get("next")  # type: ignore[assignment]
            case "wait":
                return {
                    "status": RunStatus.WAITING,
                    "wait_token": result["wait_token"],
                    "ttl_seconds": result.get("ttl_seconds", 300),
                    "state": state,
                    "trace": trace,
                    "next_node": current,
                }
            case "error":
                return {
                    "status": RunStatus.ERROR,
                    "error": result.get("error"),
                    "state": state,
                    "trace": trace,
                }
            case _:
                return {
                    "status": RunStatus.ERROR,
                    "error": f"Node '{current}' returned invalid status",
                    "state": state,
                    "trace": trace,
                }

    return {"status": RunStatus.DONE, "state": state, "trace": trace}
