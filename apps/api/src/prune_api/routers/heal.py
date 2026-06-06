"""Self-Healing Workflows — analyze a failed run and auto-repair the workflow."""

from __future__ import annotations

import asyncio
import json
import re
import uuid
from datetime import UTC, datetime
from typing import Any, Literal

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from prune_api.core.auth import CurrentUser, get_current_user
from prune_api.core.settings import settings
from prune_api.db.base import AsyncSessionLocal, get_session
from prune_api.db.models import Run, TraceStep, Workflow
from prune_api.engine.graph import canvas_to_engine
from prune_api.engine.runner import RunStatus
from prune_api.nodes.registry import NODE_REGISTRY
from prune_api.routers.runs import _execute_run

router = APIRouter()

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class HealPatch(BaseModel):
    node_id: str
    node_kind: str
    node_label: str
    field: str
    old_value: str
    new_value: str


class HealResponse(BaseModel):
    status: Literal["healed", "no_fix", "error"]
    diagnosis: str
    fix_description: str
    patch: HealPatch | None = None
    applied: bool = False
    test_run_id: str | None = None
    workflow_updated: bool = False


# ---------------------------------------------------------------------------
# Patch field map: Claude's patch_type → canvas node field name
# ---------------------------------------------------------------------------

_PATCH_FIELD: dict[str, str] = {
    "system_prompt":    "systemPrompt",
    "code":             "code",
    "output_template":  "outputTemplate",
    "template_content": "templateContent",
    "condition":        "inputValue",
    "input_value":      "inputValue",
    "model":            "model",
    "prompt":           "inputValue",
}

# ---------------------------------------------------------------------------
# Heal system prompt
# ---------------------------------------------------------------------------

_HEAL_SYSTEM = """\
You are Prune AI's workflow repair specialist. A workflow run has failed at a specific node.

Your task:
1. Diagnose exactly why the node failed
2. Determine if you can fix the failing node's configuration automatically
3. Generate a precise, minimal patch

You will receive:
- The error message from the failing node
- The failing node's canvas configuration (JSON)
- The workflow state available at failure (variables accessible by the node)

Fix types you can generate:
- "system_prompt"    → fix/update systemPrompt for ai-agent / prune-ai / openai-app
- "code"             → fix JavaScript or Python code in a code node
- "output_template"  → fix the outputTemplate string for output nodes (use {{reply}}, {{message}}, etc.)
- "template_content" → fix the templateContent markdown for template-out nodes
- "condition"        → fix the condition expression for if-else nodes
- "prompt"           → fix the user-prompt / inputValue for an ai-agent node
- "model"            → switch to a different model (e.g. if a model was renamed)
- "none"             → cannot auto-fix; requires human intervention

Common auto-fixable scenarios:
- State variable mismatch: prompt references {{customer_id}} but state has {{user_id}}
- Code node syntax error or logic bug
- Output template references a key not in state
- Deprecated/renamed model ID
- Wrong condition expression that evaluates to a non-boolean

NOT auto-fixable (return "none"):
- Missing API credentials or environment variables
- Network / connection errors
- Permission / authorization errors
- Missing required external services or integrations

RESPOND WITH ONLY VALID JSON (no markdown fences, no text outside JSON):
{
  "fixable": true,
  "diagnosis": "One or two sentences explaining the exact cause of the failure.",
  "fix_description": "One sentence explaining what you changed and why.",
  "patch_type": "system_prompt",
  "patch_value": "<complete new value of the patched field>"
}"""


async def _claude_heal(
    error_msg: str,
    node_config: dict[str, Any],
    node_kind: str,
    state_at_failure: dict[str, Any],
) -> dict[str, Any]:
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not configured")

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    user_msg = (
        f"Error message:\n{error_msg}\n\n"
        f"Node kind: {node_kind}\n\n"
        f"Node configuration:\n{json.dumps(node_config, indent=2)}\n\n"
        f"Workflow state available at failure:\n{json.dumps(state_at_failure, indent=2)}"
    )

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        system=_HEAL_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
        max_tokens=2048,
        temperature=0.1,
    )
    raw: str = response.content[0].text.strip()  # type: ignore[union-attr]

    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw.rstrip())

    return json.loads(raw)


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post("/runs/{run_id}/heal", response_model=HealResponse)
async def heal_run(
    run_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> HealResponse:
    # --- validate run_id ---
    try:
        rid = uuid.UUID(run_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid run_id")

    # --- fetch the failed run ---
    run_row = await session.execute(
        select(Run).where(Run.id == rid, Run.tenant_id == current_user.tenant_id)
    )
    run = run_row.scalar_one_or_none()
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    if run.status != "error":
        raise HTTPException(status_code=400, detail="Run did not fail — nothing to heal")
    if run.workflow_id is None:
        raise HTTPException(status_code=400, detail="Run has no associated workflow")

    # --- find the failing trace step ---
    ts_row = await session.execute(
        select(TraceStep)
        .where(TraceStep.run_id == rid, TraceStep.status == "error")
        .order_by(TraceStep.created_at.desc())
        .limit(1)
    )
    failing_step = ts_row.scalar_one_or_none()
    if failing_step is None:
        return HealResponse(
            status="no_fix",
            diagnosis="No failing trace step found — the run may have crashed before any node executed.",
            fix_description="Check server logs for startup errors.",
            applied=False,
        )

    # --- fetch the workflow + locate the canvas node ---
    wf_row = await session.execute(
        select(Workflow).where(
            Workflow.id == run.workflow_id,
            Workflow.tenant_id == current_user.tenant_id,
        )
    )
    wf = wf_row.scalar_one_or_none()
    if wf is None:
        raise HTTPException(status_code=404, detail="Workflow not found")

    canvas_nodes: list[dict[str, Any]] = wf.graph.get("nodes", [])

    failing_node: dict[str, Any] | None = next(
        (n for n in canvas_nodes if n["id"] == failing_step.node_id), None
    )
    # Synthetic KB nodes embed agent ID: __kb_{agent_id}_{i}
    if failing_node is None:
        for n in canvas_nodes:
            if failing_step.node_id.startswith(f"__kb_{n['id']}_"):
                failing_node = n
                break

    if failing_node is None:
        return HealResponse(
            status="no_fix",
            diagnosis=f"Node '{failing_step.node_id}' not found in the workflow graph. The workflow may have been modified since this run.",
            fix_description="Open the workflow in the builder to inspect it manually.",
            applied=False,
        )

    node_kind: str = failing_node.get("kind", "")
    node_label: str = failing_node.get("label", node_kind)
    error_msg: str = failing_step.error or run.error or "Unknown error"
    state_at_failure: dict[str, Any] = failing_step.input or {}

    # --- call Claude to analyze and generate the fix ---
    try:
        analysis = await _claude_heal(
            error_msg=error_msg,
            node_config=failing_node,
            node_kind=node_kind,
            state_at_failure=state_at_failure,
        )
    except json.JSONDecodeError:
        return HealResponse(
            status="error",
            diagnosis="The heal AI returned malformed JSON. Please try again.",
            fix_description="",
            applied=False,
        )
    except Exception as exc:
        return HealResponse(
            status="error",
            diagnosis=f"Heal analysis failed: {exc}",
            fix_description="",
            applied=False,
        )

    fixable: bool = bool(analysis.get("fixable", False))
    diagnosis: str = analysis.get("diagnosis", "")
    fix_description: str = analysis.get("fix_description", "")
    patch_type: str = analysis.get("patch_type", "none")
    patch_value: str = str(analysis.get("patch_value", ""))

    if not fixable or patch_type == "none":
        return HealResponse(
            status="no_fix",
            diagnosis=diagnosis,
            fix_description=fix_description or "This failure requires manual intervention.",
            applied=False,
        )

    canvas_field = _PATCH_FIELD.get(patch_type)
    if not canvas_field:
        return HealResponse(
            status="no_fix",
            diagnosis=diagnosis,
            fix_description=f"Unknown patch type '{patch_type}' — please fix manually.",
            applied=False,
        )

    old_value: str = str(failing_node.get(canvas_field, ""))

    # --- apply patch to the canvas graph ---
    patched_nodes = [
        {**n, canvas_field: patch_value} if n["id"] == failing_node["id"] else n
        for n in canvas_nodes
    ]
    new_graph: dict[str, Any] = {**wf.graph, "nodes": patched_nodes}
    wf.graph = new_graph
    await session.flush()
    await session.refresh(wf)

    # --- get initial inputs for the test run ---
    first_step_row = await session.execute(
        select(TraceStep)
        .where(TraceStep.run_id == rid)
        .order_by(TraceStep.created_at.asc())
        .limit(1)
    )
    first_step = first_step_row.scalar_one_or_none()
    test_inputs: dict[str, Any] = first_step.input if first_step and first_step.input else {}

    # --- create the test run record (commit first so _execute_run can read it) ---
    test_run = Run(
        tenant_id=current_user.tenant_id,
        workflow_id=run.workflow_id,
        status=RunStatus.PENDING,
        state={},
        started_at=datetime.now(UTC),
    )
    session.add(test_run)
    await session.commit()
    await session.refresh(test_run)

    # --- fire the test run in the background ---
    engine_graph = canvas_to_engine(new_graph)
    asyncio.create_task(
        _execute_run(
            test_run.id,
            engine_graph,
            test_inputs,
            str(current_user.tenant_id),
        )
    )

    return HealResponse(
        status="healed",
        diagnosis=diagnosis,
        fix_description=fix_description,
        patch=HealPatch(
            node_id=failing_node["id"],
            node_kind=node_kind,
            node_label=node_label,
            field=canvas_field,
            old_value=old_value,
            new_value=patch_value,
        ),
        applied=True,
        test_run_id=str(test_run.id),
        workflow_updated=True,
    )
