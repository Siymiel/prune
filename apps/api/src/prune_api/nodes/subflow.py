"""Subflow-related nodes: SubflowToolNode and WorkflowCallNode."""

from __future__ import annotations

import re
import uuid
from datetime import UTC, datetime
from typing import Any

from prune_api.nodes.base import Node, NodeContext, NodeResult


# ---------------------------------------------------------------------------
# SubflowToolNode
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Expression resolution helper
# ---------------------------------------------------------------------------

def _resolve_expression(expr: str, state: dict[str, Any], inputs: dict[str, Any]) -> Any:
    """Resolve {{state.key}} and {{input.key}} template expressions.

    If the entire string is a single expression (e.g. "{{state.reply}}"), the
    raw value is returned (preserving non-string types like lists and dicts).
    For mixed strings the matched portion is stringified inline.
    """
    if not isinstance(expr, str):
        return expr

    stripped = expr.strip()

    # Full-match: return the raw value (preserves non-string types)
    full = re.fullmatch(r"\{\{(state|input)\.(\w+)\}\}", stripped)
    if full:
        source, key = full.group(1), full.group(2)
        return state.get(key, "") if source == "state" else inputs.get(key, "")

    # Inline substitution: stringify each placeholder
    def _replace(m: re.Match) -> str:
        source, key = m.group(1), m.group(2)
        val = state.get(key, "") if source == "state" else inputs.get(key, "")
        return str(val)

    return re.sub(r"\{\{(state|input)\.(\w+)\}\}", _replace, expr)


# ---------------------------------------------------------------------------
# WorkflowCallNode
# ---------------------------------------------------------------------------

class WorkflowCallNode(Node):
    """Invoke another PruneAI workflow as a sub-workflow and expose its outputs.

    Config keys:
      workflow_id       — UUID of the workflow to call (required)
      workflow_name     — human label (informational only)
      input_mappings    — list of {key, value} dicts mapping child inputs;
                          value may contain {{state.xxx}} / {{input.xxx}} expressions
      output_mappings   — list of {key, outputKey} dicts mapping child state keys
                          to parent state keys; if empty, exposes reply + sub_workflow_state
      timeout_seconds   — abort if child exceeds this many seconds (default 30)
      on_error          — "fail" (propagate error) | "continue" (return empty output)
    """

    type = "workflow.call"

    async def execute(self, ctx: NodeContext) -> NodeResult:  # noqa: C901
        cfg = self.config
        state = ctx["state"]
        workflow_ctx = ctx["workflow"]

        workflow_id: str = cfg.get("workflow_id", "")
        if not workflow_id:
            return {"status": "error", "error": "WorkflowCallNode: no workflow_id configured"}

        # ── Circular dependency detection ──────────────────────────────────
        call_stack: list[str] = list(workflow_ctx.get("_call_stack", []))
        if workflow_id in call_stack:
            cycle = " → ".join(call_stack + [workflow_id])
            return {
                "status": "error",
                "error": f"WorkflowCallNode: circular dependency detected — {cycle}",
            }
        call_stack.append(workflow_id)

        # ── Validate workflow_id ───────────────────────────────────────────
        try:
            wid = uuid.UUID(workflow_id)
        except ValueError:
            return {"status": "error", "error": f"WorkflowCallNode: invalid workflow_id '{workflow_id}'"}

        # ── Lazy imports (avoid circular at module load) ───────────────────
        import asyncio

        from sqlalchemy import select

        from prune_api.db.base import AsyncSessionLocal
        from prune_api.db.models import Run, TraceStep, Workflow
        from prune_api.engine.graph import canvas_to_engine
        from prune_api.engine.runner import RunStatus, run_workflow_iter
        from prune_api.nodes.registry import NODE_REGISTRY

        # ── Load target workflow ───────────────────────────────────────────
        async with AsyncSessionLocal() as session:
            row = await session.execute(select(Workflow).where(Workflow.id == wid))
            workflow_obj = row.scalar_one_or_none()

        if workflow_obj is None:
            return {"status": "error", "error": f"WorkflowCallNode: workflow '{workflow_id}' not found"}

        # ── Resolve input mappings ─────────────────────────────────────────
        input_mappings: list[dict[str, str]] = cfg.get("input_mappings") or []
        sub_inputs: dict[str, Any] = {}

        if input_mappings:
            for mapping in input_mappings:
                key = (mapping.get("key") or "").strip()
                expr = mapping.get("value") or ""
                if key:
                    sub_inputs[key] = _resolve_expression(expr, state, ctx["inputs"])
        else:
            # Default: forward message and conversation history
            sub_inputs = {
                "message": str(state.get("message", "")),
                "history": state.get("history", []),
            }

        # ── Build child engine graph with call-stack propagation ───────────
        engine_graph = canvas_to_engine(workflow_obj.graph)
        engine_graph["_call_stack"] = call_stack

        # ── Execution settings ─────────────────────────────────────────────
        timeout_seconds: int = int(cfg.get("timeout_seconds") or 30)
        on_error: str = cfg.get("on_error") or "fail"

        # ── Create child Run record ────────────────────────────────────────
        sub_run_id = uuid.uuid4()
        parent_run_id_str = ctx.get("run_id") or ""
        parent_run_uuid: uuid.UUID | None = None
        try:
            parent_run_uuid = uuid.UUID(parent_run_id_str) if parent_run_id_str else None
        except ValueError:
            pass

        tenant_id_str = ctx.get("tenant_id") or ""
        try:
            tenant_uuid = uuid.UUID(tenant_id_str)
        except (ValueError, TypeError):
            return {"status": "error", "error": "WorkflowCallNode: invalid tenant_id in context"}

        async with AsyncSessionLocal() as session:
            child_run = Run(
                id=sub_run_id,
                workflow_id=wid,
                tenant_id=tenant_uuid,
                parent_run_id=parent_run_uuid,
                status=RunStatus.RUNNING,
                state={},
                started_at=datetime.now(UTC),
            )
            session.add(child_run)
            await session.commit()

        # ── Execute child workflow ─────────────────────────────────────────
        trace_events: list[dict[str, Any]] = []
        final_status = RunStatus.ERROR
        final_state: dict[str, Any] = {}
        error_msg = ""

        try:
            async with asyncio.timeout(timeout_seconds):
                async for event in run_workflow_iter(
                    engine_graph,
                    sub_inputs,
                    tenant_id=tenant_id_str,
                    conversation_id=ctx.get("conversation_id") or "",
                    run_id=str(sub_run_id),
                    node_registry=NODE_REGISTRY,
                ):
                    if event["event"] == "step":
                        trace_events.append(event)
                    elif event["event"] == "done":
                        final_status = event.get("status", RunStatus.ERROR)
                        final_state = event.get("state") or {}
                        error_msg = event.get("error") or ""
        except asyncio.TimeoutError:
            final_status = RunStatus.ERROR
            error_msg = f"WorkflowCallNode: child workflow timed out after {timeout_seconds}s"
        except Exception as exc:  # noqa: BLE001
            final_status = RunStatus.ERROR
            error_msg = f"WorkflowCallNode: unexpected error — {exc}"

        # ── Persist child run result + trace steps ─────────────────────────
        async with AsyncSessionLocal() as session:
            run_row = await session.get(Run, sub_run_id)
            if run_row is not None:
                run_row.status = final_status
                run_row.state = final_state
                run_row.error = error_msg or None
                run_row.completed_at = datetime.now(UTC)
                for step_evt in trace_events:
                    session.add(TraceStep(
                        run_id=sub_run_id,
                        node_id=step_evt["node"],
                        node_type=step_evt["node_type"],
                        status=step_evt["status"],
                        input=step_evt.get("input"),
                        output=step_evt.get("output"),
                        error=step_evt.get("error"),
                        duration_ms=step_evt.get("ms"),
                    ))
                await session.commit()

        # ── Handle error ───────────────────────────────────────────────────
        if final_status == RunStatus.ERROR:
            if on_error == "continue":
                return {
                    "status": "ok",
                    "output": {
                        "sub_workflow_error": error_msg,
                        "sub_workflow_state": {},
                        "sub_run_id": str(sub_run_id),
                    },
                    "next": cfg.get("next"),
                }
            return {"status": "error", "error": error_msg}

        # ── Apply output mappings ──────────────────────────────────────────
        output_mappings: list[dict[str, str]] = cfg.get("output_mappings") or []
        output: dict[str, Any] = {}

        if output_mappings:
            for mapping in output_mappings:
                child_key = (mapping.get("key") or "").strip()
                parent_key = (mapping.get("outputKey") or child_key).strip() or child_key
                if child_key and parent_key:
                    output[parent_key] = final_state.get(child_key)
        else:
            # Default: expose the child's reply and full state
            output["reply"] = final_state.get("reply", "")
            output["sub_workflow_state"] = final_state

        output["sub_run_id"] = str(sub_run_id)

        return {
            "status": "ok",
            "output": output,
            "next": cfg.get("next"),
        }
