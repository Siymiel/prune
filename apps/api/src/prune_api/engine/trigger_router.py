"""Trigger Routing Engine — matches normalized integration events to published
workflows and dispatches execution runs.

How it works:
  1. An incoming event arrives via the integrations webhook router.
  2. normalize_event() produces a NormalizedEvent.
  3. route_trigger_event() queries all published workflows.
  4. For each workflow, find the trigger node and check:
       triggerType == "integration"
       triggerIntegrationId == provider
       triggerIntegrationEvent == event_type  (or empty → match all events)
       triggerFilters conditions all pass
  5. Create a Run and fire _execute_run in the background for each match.
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select

from prune_api.db.base import AsyncSessionLocal
from prune_api.db.models import Run, Workflow
from prune_api.engine.runner import RunStatus
from prune_api.integrations.normalizer import NormalizedEvent
from prune_api.routers.runs import _canvas_to_engine, _execute_run


def _extract_trigger_node(graph: dict[str, Any]) -> dict[str, Any] | None:
    """Return the first trigger-kind node from a workflow graph, or None."""
    for node in graph.get("nodes", []):
        if node.get("kind") == "trigger":
            return node
    return None


def _filters_match(
    trigger_node: dict[str, Any],
    event: NormalizedEvent,
) -> bool:
    """Return True if all configured triggerFilters match the event payload."""
    filters: dict[str, str] = trigger_node.get("triggerFilters") or {}
    for key, expected in filters.items():
        if not expected:
            continue
        actual = str(event.payload.get(key, "")).lower()
        if expected.lower() not in actual:
            return False
    return True


async def route_trigger_event(
    provider: str,
    event_type: str,
    event: NormalizedEvent,
) -> int:
    """Find all matching published workflows and execute them.

    Returns the number of workflow runs dispatched.
    """
    dispatched = 0

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Workflow).where(Workflow.is_published.is_(True))
        )
        workflows: list[Workflow] = list(result.scalars().all())

    for workflow in workflows:
        graph: dict[str, Any] = workflow.graph or {}
        trigger_node = _extract_trigger_node(graph)
        if trigger_node is None:
            continue

        # Must be an integration trigger
        if trigger_node.get("triggerType") != "integration":
            continue

        # Provider must match
        if trigger_node.get("triggerIntegrationId") != provider:
            continue

        # Event must match (empty string means "any event from this provider")
        configured_event = trigger_node.get("triggerIntegrationEvent", "")
        if configured_event and configured_event != event_type:
            continue

        # All filters must pass
        if not _filters_match(trigger_node, event):
            continue

        # Build inputs for the run
        run_inputs = {"event": event.to_dict()}

        try:
            engine_graph = _canvas_to_engine(graph)
            run_id = uuid.uuid4()
            async with AsyncSessionLocal() as session:
                session.add(Run(
                    id=run_id,
                    tenant_id=workflow.tenant_id,
                    workflow_id=workflow.id,
                    status=RunStatus.PENDING,
                    state=run_inputs,
                    started_at=datetime.now(UTC),
                ))
                await session.commit()

            asyncio.create_task(
                _execute_run(run_id, engine_graph, run_inputs, str(workflow.tenant_id))
            )
            dispatched += 1
        except Exception:
            pass

    return dispatched
