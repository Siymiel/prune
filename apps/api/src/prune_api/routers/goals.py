"""Goal-Based AI — convert a natural language goal into a complete workflow."""

from __future__ import annotations

import json
import re

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from prune_api.core.auth import CurrentUser, get_current_user
from prune_api.core.settings import settings
from prune_api.db.base import get_session
from prune_api.db.models import Workflow
from prune_api.routers.workflows import WorkflowOut, _to_out

router = APIRouter()

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class GenerateGoalRequest(BaseModel):
    goal: str


class GoalNodeSummary(BaseModel):
    kind: str
    label: str
    role: str


class GenerateGoalResponse(BaseModel):
    workflow_id: str
    workflow_name: str
    explanation: list[str]
    nodes_summary: list[GoalNodeSummary]
    workflow: WorkflowOut


# ---------------------------------------------------------------------------
# Planner system prompt
# ---------------------------------------------------------------------------

PLANNER_SYSTEM = """You are Prune AI's workflow planner. Convert a user's natural language business goal into a complete, ready-to-run workflow graph.

AVAILABLE NODE KINDS AND THEIR FIELDS:

Inputs:
- "text-input": Accept user text. Fields: outputKey (string), placeholder (string)
- "files": Upload documents/PDFs. Fields: exposeAsInput (bool), enableParsing (bool), enableOcr (bool)
- "trigger": Start the workflow. Fields: triggerType ("manual"|"scheduled"|"webhook"|"integration"), triggerScheduleCron (cron string if scheduled), triggerIntegrationId (integration name if integration)
- "url": Fetch web content. Fields: urlExtractionMode ("html"|"metadata"), urlEnableAsInput (bool)
- "audio-input": Record/upload audio. Fields: audioSource ("upload"|"url"), audioProvider ("deepgram"|"whisper-1")

Core:
- "ai-agent": LLM with system prompt. Fields: systemPrompt (string describing the agent's role and task), model ("claude-sonnet-4-6"|"claude-haiku-4-5"|"gpt-4o"|"gpt-4o-mini")
- "knowledge-base": Retrieve from KB. Fields: inputValue (leave as empty string "")
- "prune-ai": WhatsApp AI handler. Fields: systemPrompt (string), model ("claude-sonnet-4-6")
- "workflow": Call another workflow. Fields: inputValue ("")

Apps:
- "gmail-app": Send email via Gmail. Fields: inputValue (description of what to send)
- "slack-app": Post to Slack. Fields: inputValue (channel like "#general")
- "whatsapp": WhatsApp messages. Fields: inputValue (description)
- "google-calendar-app": Calendar events. Fields: inputValue (event description)
- "google-drive-app": Drive files. Fields: inputValue (action description)
- "mpesa": M-Pesa payments. Fields: inputValue (payment description)
- "openai-app": Call OpenAI directly. Fields: systemPrompt (string), model ("gpt-4o")

Outputs:
- "output": Return text result. Fields: outputTemplate (use {{reply}} to reference AI output)
- "action": Perform external action. Fields: inputValue (action description)
- "template-out": Formatted message. Fields: templateContent (markdown string with the message template)

Logic:
- "if-else": Branch on condition. Fields: inputValue (condition like "{{reply}} contains error")
- "code": Run custom code. Fields: code (JS/Python string), inputValue ("javascript"|"python")
- "ai-routing": AI classification routing. Fields: systemPrompt (routing rules)

Utils:
- "delay": Pause execution. Fields: inputValue ("5s"|"1m"|"1h")
- "shared-memory": Persist values. Fields: inputValue (key name)

GRAPH RULES:
- Always start with a trigger or input node ("trigger", "text-input", "files", "url", "audio-input")
- Always end with an output or action node ("output", "action", "gmail-app", "slack-app", "whatsapp", "template-out")
- Use "ai-agent" for analysis, summarization, extraction, generation, classification
- If goal mentions email → include gmail-app; Slack → slack-app; WhatsApp → whatsapp or prune-ai
- If goal mentions documents/PDFs/files → use files node before ai-agent
- If goal mentions knowledge base/retrieval/RAG → use knowledge-base before ai-agent
- If goal mentions schedule/daily/weekly/cron → use trigger with triggerType "scheduled"
- If goal mentions form/webhook/API → use trigger with triggerType "webhook"
- Keep it focused: 3–7 nodes is typical. Don't over-engineer.
- Node IDs: use kind prefix + index, e.g. "trigger-0", "llm-0", "llm-1", "slack-0", "out-0"
- The "label" should be a short human-readable name (2–4 words)

DO NOT include x/y position fields — the system handles layout.

RESPOND WITH ONLY VALID JSON, no markdown fences, no explanation outside JSON:
{
  "name": "Short Workflow Name",
  "description": "One sentence describing this workflow.",
  "explanation": ["What step 1 does", "What step 2 does", "What the workflow achieves"],
  "nodes": [
    { "id": "trigger-0", "kind": "trigger", "label": "Webhook Trigger", "triggerType": "webhook" },
    { "id": "llm-0", "kind": "ai-agent", "label": "Analyze Request", "systemPrompt": "You are an expert at...", "model": "claude-sonnet-4-6" },
    { "id": "out-0", "kind": "output", "label": "Return Result", "outputTemplate": "{{reply}}" }
  ],
  "edges": [
    { "id": "e-0", "sourceId": "trigger-0", "targetId": "llm-0" },
    { "id": "e-1", "sourceId": "llm-0", "targetId": "out-0" }
  ]
}"""


def _layout_nodes(nodes: list[dict]) -> list[dict]:
    """Assign x/y positions in a linear left-to-right layout."""
    for i, node in enumerate(nodes):
        node["x"] = 100 + i * 340
        node["y"] = 280
    return nodes


def _node_role(node: dict) -> str:
    kind_roles: dict[str, str] = {
        "trigger": "Starts the workflow",
        "text-input": "Accepts user input",
        "files": "Accepts file uploads",
        "url": "Fetches web content",
        "audio-input": "Processes audio",
        "ai-agent": "AI reasoning & generation",
        "knowledge-base": "Retrieves relevant context",
        "prune-ai": "WhatsApp AI handler",
        "workflow": "Calls another workflow",
        "output": "Returns the result",
        "action": "Performs an action",
        "template-out": "Formats the output",
        "gmail-app": "Sends email via Gmail",
        "slack-app": "Posts to Slack",
        "whatsapp": "Sends WhatsApp message",
        "google-calendar-app": "Manages calendar events",
        "google-drive-app": "Manages Drive files",
        "mpesa": "Processes M-Pesa payment",
        "openai-app": "Calls OpenAI",
        "if-else": "Branches the flow",
        "code": "Runs custom code",
        "ai-routing": "Routes by AI classification",
        "delay": "Pauses execution",
        "shared-memory": "Persists data",
    }
    return kind_roles.get(node.get("kind", ""), node.get("label", ""))


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post("/goals/generate", response_model=GenerateGoalResponse)
async def generate_goal(
    body: GenerateGoalRequest,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> GenerateGoalResponse:
    if not body.goal.strip():
        raise HTTPException(status_code=400, detail="Goal cannot be empty")
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="AI service not configured")

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    try:
        response = await client.messages.create(
            model="claude-sonnet-4-6",
            system=PLANNER_SYSTEM,
            messages=[{"role": "user", "content": f"Goal: {body.goal.strip()}"}],
            max_tokens=4096,
            temperature=0.2,
        )
        raw = response.content[0].text.strip()  # type: ignore[union-attr]
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}") from exc

    # Strip markdown code fences if the model adds them
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw.rstrip())

    try:
        plan = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail=f"Planner returned invalid JSON: {exc}") from exc

    name: str = plan.get("name", "Generated Workflow")
    description: str = plan.get("description", "")
    explanation: list[str] = plan.get("explanation", [])
    raw_nodes: list[dict] = plan.get("nodes", [])
    raw_edges: list[dict] = plan.get("edges", [])

    raw_nodes = _layout_nodes(raw_nodes)
    graph = {"nodes": raw_nodes, "edges": raw_edges}

    wf = Workflow(
        tenant_id=current_user.tenant_id,
        created_by=current_user.user_id,
        name=name,
        description=description,
        graph=graph,
    )
    session.add(wf)
    await session.flush()
    await session.refresh(wf)

    nodes_summary = [
        GoalNodeSummary(
            kind=n.get("kind", ""),
            label=n.get("label", n.get("kind", "")),
            role=_node_role(n),
        )
        for n in raw_nodes
    ]

    return GenerateGoalResponse(
        workflow_id=str(wf.id),
        workflow_name=name,
        explanation=explanation,
        nodes_summary=nodes_summary,
        workflow=_to_out(wf),
    )
