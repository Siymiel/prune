"""Chat router — wraps a workflow run for the demo chat preview.

In production this would call the workflow engine and stream tokens via
Server-Sent Events. For now we keep parity with the Next.js mock so the
contract is identical.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class ChatRequest(BaseModel):
    template_slug: str
    message: str


class TraceStep(BaseModel):
    node: str
    ms: int


class ChatResponse(BaseModel):
    reply: str
    trace: list[TraceStep]


# Stub responses mirroring apps/web/lib/templates.ts. Pulled in from a
# shared TOML in a future iteration so templates aren't duplicated.
_STUB_REPLY = (
    "Sawa! Sending STK push for KES 500 deposit to your number now. "
    "Please enter your M-Pesa PIN to confirm. Your slot is held for 5 minutes."
)

_DEFAULT_TRACE = [
    TraceStep(node="whatsapp.trigger", ms=12),
    TraceStep(node="ai.classify",      ms=412),
    TraceStep(node="kb.retrieve",      ms=89),
    TraceStep(node="ai.respond",       ms=894),
    TraceStep(node="whatsapp.send",    ms=167),
]


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Empty message")
    # TODO: dispatch to workflow engine; for now return canned reply
    return ChatResponse(reply=_STUB_REPLY, trace=_DEFAULT_TRACE)
