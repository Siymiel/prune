import { NextResponse } from 'next/server';
import { getTemplate, pickResponse } from '@/lib/templates';

export const runtime = 'edge';

interface ChatRequest {
  templateSlug: string;
  message: string;
}

/**
 * Mock chat endpoint backing the template preview chat widget.
 *
 * In production this would call the FastAPI workflow engine
 * (apps/api → POST /v1/runs/start) and stream tokens back. For the
 * demo we use the keyword router defined alongside the template data.
 */
export async function POST(req: Request) {
  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const template = getTemplate(body.templateSlug);
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'Empty message' }, { status: 400 });
  }

  const reply = pickResponse(template, body.message);

  // Mirror what a real run would return: a reply plus a synthetic trace.
  return NextResponse.json({
    reply,
    trace: [
      { node: 'whatsapp.trigger', ms: 12 },
      { node: 'ai.classify',      ms: 412 },
      { node: 'kb.retrieve',      ms: 89 },
      { node: 'ai.respond',       ms: 894 },
      { node: 'whatsapp.send',    ms: 167 },
    ],
  });
}
