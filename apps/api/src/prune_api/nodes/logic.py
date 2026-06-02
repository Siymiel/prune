"""Logic and utility nodes: passthrough, text-input, if-else, and code execution."""

from __future__ import annotations

from typing import Any

from prune_api.nodes.base import Node, NodeContext, NodeResult


class PassthroughNode(Node):
    """Passes state through unchanged. Used for structural nodes like trigger and output."""

    type = "passthrough"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        return {"status": "ok", "output": {}, "next": self.config.get("next")}


class TextInputNode(Node):
    """Reads a value from config or inputs and writes it to state.

    config.output_key  — state key to write (default: "message")
    config.value       — static value; falls back to inputs[output_key]
    """

    type = "input.text"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        key: str = self.config.get("output_key", "message")
        value: str = (
            self.config.get("value")
            or ctx["inputs"].get(key)
            or ctx["inputs"].get("message", "")
        )
        return {
            "status": "ok",
            "output": {key: value},
            "next": self.config.get("next"),
        }


class IfElseNode(Node):
    """Routes execution to then_next or else_next based on a condition.

    config.condition  — expression string, e.g. "reply contains help"
    config.then_next  — node id to go to when condition is true
    config.else_next  — node id to go to when condition is false (None = end)

    Supported operators: ==, !=, contains, >, <
    Keys are resolved from run state (e.g. "reply", "payment.status").
    """

    type = "logic.if_else"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        condition: str = self.config.get("condition", "")
        then_next: str | None = self.config.get("then_next")
        else_next: str | None = self.config.get("else_next")

        result = self._evaluate(condition, ctx["state"])
        return {
            "status": "ok",
            "output": {"condition_result": result},
            "next": then_next if result else else_next,
        }

    def _evaluate(self, condition: str, state: dict[str, Any]) -> bool:
        if not condition.strip():
            return True

        operators = [
            (" == ",       lambda a, b: str(a) == b),
            (" != ",       lambda a, b: str(a) != b),
            (" contains ", lambda a, b: b.lower() in str(a).lower()),
            (" > ",        lambda a, b: float(str(a)) > float(b)),
            (" < ",        lambda a, b: float(str(a)) < float(b)),
        ]

        for op_str, check in operators:
            if op_str in condition:
                raw_key, val = condition.split(op_str, 1)
                key = raw_key.strip().removeprefix("state.").strip("{}")
                resolved = self._resolve_key(key, state)
                try:
                    return check(resolved, val.strip())
                except (TypeError, ValueError):
                    return False

        # Bare key — truthy check
        key = condition.strip().removeprefix("state.").strip("{}")
        return bool(self._resolve_key(key, state))

    @staticmethod
    def _resolve_key(key: str, state: dict[str, Any]) -> Any:
        ref: Any = state
        for part in key.split("."):
            ref = ref.get(part) if isinstance(ref, dict) else None
            if ref is None:
                break
        return ref


class CodeNode(Node):
    """Executes Python code in a restricted sandbox.

    The code has access to:
      state   — current run state (read-only dict copy)
      inputs  — original run inputs
      output  — dict to populate; its contents are merged into state on success

    Example:
        output["greeting"] = f"Hello, {state.get('name', 'World')}!"
    """

    type = "logic.code"

    _SAFE_BUILTINS: dict[str, Any] = {
        "len": len, "str": str, "int": int, "float": float, "bool": bool,
        "list": list, "dict": dict, "set": set, "tuple": tuple,
        "range": range, "enumerate": enumerate, "zip": zip,
        "min": min, "max": max, "sum": sum, "abs": abs, "round": round,
        "sorted": sorted, "reversed": reversed,
        "isinstance": isinstance, "hasattr": hasattr, "getattr": getattr,
        "True": True, "False": False, "None": None,
        "print": print,  # useful for debugging; captured nowhere in prod
    }

    async def execute(self, ctx: NodeContext) -> NodeResult:
        code: str = self.config.get("code", "").strip()
        next_node: str | None = self.config.get("next")

        if not code:
            return {"status": "ok", "output": {}, "next": next_node}

        local_vars: dict[str, Any] = {
            "state": dict(ctx["state"]),
            "inputs": dict(ctx["inputs"]),
            "output": {},
        }

        try:
            exec(  # noqa: S102
                compile(code, "<workflow_code_node>", "exec"),
                {"__builtins__": self._SAFE_BUILTINS},
                local_vars,
            )
        except Exception as exc:
            return {"status": "error", "error": f"Code node raised: {exc}"}

        return {
            "status": "ok",
            "output": local_vars.get("output", {}),
            "next": next_node,
        }
