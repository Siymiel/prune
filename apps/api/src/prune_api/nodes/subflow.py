"""Subflow-related nodes: SubflowToolNode and WorkflowCallNode."""

from __future__ import annotations

import uuid
from typing import Any

from prune_api.nodes.base import Node, NodeContext, NodeResult


class SubflowToolNode(Node):
    """Entry/marker node for a sub-workflow that an AI Agent can call as a tool.

    When an AI Agent invokes a subflow tool, it passes its input via
    state["subflow_tool_input"].  This node copies that into state["message"]
    so every downstream node can consume it the same way a normal text-input
    node would have.

    Config keys (optional):
      output_key  — state key to write the subflow input into (default: "message")
    """

    type = "subflow.tool"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        state = ctx["state"]
        key: str = self.config.get("output_key", "message")
        value: str = str(state.get("subflow_tool_input", state.get(key, "")))
        return {
            "status": "ok",
            "output": {key: value},
            "next": self.config.get("next"),
        }


class WorkflowCallNode(Node):
    """Calls another saved PruneAI workflow inline and writes its output into state.

    Config keys:
      workflow_id    — UUID of the workflow to call (required)
      workflow_name  — human label (informational only)
      input_key      — state key whose value is passed as the sub-workflow's
                       "message" input (default: "message")
      output_key     — state key where the sub-workflow reply is written
                       (default: "reply")

    The sub-workflow runs synchronously inside the current run so its output
    is available to subsequent nodes.
    """

    type = "workflow.call"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        cfg = self.config
        state = ctx["state"]

        workflow_id: str = cfg.get("workflow_id", "")
        if not workflow_id:
            return {"status": "error", "error": "WorkflowCallNode: no workflow_id configured"}

        input_key: str = cfg.get("input_key", "message")
        output_key: str = cfg.get("output_key", "reply")
        sub_message: str = str(state.get(input_key, ""))

        # Lazy imports to avoid circular dependency at module load time
        from sqlalchemy import select

        from prune_api.db.base import AsyncSessionLocal
        from prune_api.db.models import Workflow
        from prune_api.engine.graph import canvas_to_engine
        from prune_api.engine.runner import RunStatus, run_workflow
        from prune_api.nodes.registry import NODE_REGISTRY

        try:
            wid = uuid.UUID(workflow_id)
        except ValueError:
            return {"status": "error", "error": f"WorkflowCallNode: invalid workflow_id '{workflow_id}'"}

        async with AsyncSessionLocal() as session:
            row = await session.execute(select(Workflow).where(Workflow.id == wid))
            workflow_obj = row.scalar_one_or_none()

        if workflow_obj is None:
            return {"status": "error", "error": f"WorkflowCallNode: workflow '{workflow_id}' not found"}

        engine_graph = canvas_to_engine(workflow_obj.graph)

        sub_run_id = str(uuid.uuid4())
        result: dict[str, Any] = await run_workflow(
            engine_graph,
            inputs={"message": sub_message, "history": state.get("history", [])},
            tenant_id=ctx["tenant_id"],
            conversation_id=ctx["conversation_id"],
            run_id=sub_run_id,
            node_registry=NODE_REGISTRY,
        )

        if result["status"] == RunStatus.ERROR:
            return {
                "status": "error",
                "error": f"WorkflowCallNode: sub-workflow failed — {result.get('error')}",
            }

        sub_reply: str = result["state"].get("reply", result["state"].get(output_key, ""))
        return {
            "status": "ok",
            "output": {output_key: sub_reply, "sub_workflow_state": result["state"]},
            "next": cfg.get("next"),
        }
