"""Workflow node base contract.

Every node implements `execute()` returning one of:
  - {"status": "ok",    "output": ..., "next": "node_id"}   — continue
  - {"status": "wait",  "wait_token": "...", "ttl": int}    — async pause
  - {"status": "error", "error": "..."}                     — fail run

The engine handles persistence, retries, and resumption from wait states
(e.g. M-Pesa STK callbacks, human handoff replies).
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Literal, TypedDict


class NodeContext(TypedDict):
    """Context passed to each node during execution."""

    run_id: str
    tenant_id: str
    conversation_id: str
    inputs: dict[str, Any]
    state: dict[str, Any]          # mutable shared state for this run
    workflow: dict[str, Any]       # full workflow definition


class NodeResult(TypedDict, total=False):
    status: Literal["ok", "wait", "error"]
    output: dict[str, Any]
    next: str | None
    wait_token: str
    ttl_seconds: int
    error: str


class Node(ABC):
    """Base class for all workflow nodes."""

    type: str = ""

    def __init__(self, node_id: str, config: dict[str, Any]) -> None:
        self.id = node_id
        self.config = config

    @abstractmethod
    async def execute(self, ctx: NodeContext) -> NodeResult:
        """Execute this node. Must be idempotent — may be retried."""
        ...
