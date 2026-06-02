/**
 * Typed API client for the FastAPI backend.
 * Automatically injects the Supabase JWT on every request.
 */

import { supabase } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface MeResponse {
  user_id: string;
  tenant_id: string;
  email: string;
  role: string;
}

export interface TraceStep {
  node: string;
  node_type: string;
  status: string;
  ms?: number;
}

export interface ChatResponse {
  reply: string;
  conversation_id?: string;
  trace: TraceStep[];
}

export interface ChatRequest {
  template_slug?: string;
  workflow_id?: string;
  conversation_id?: string;
  message: string;
  history?: Array<{ role: string; content: string }>;
}

// ---------------------------------------------------------------------------
// API surface
// ---------------------------------------------------------------------------

export const api = {
  auth: {
    me: () => apiFetch<MeResponse>('/v1/auth/me'),
  },
  chat: {
    send: (body: ChatRequest) =>
      apiFetch<ChatResponse>('/v1/chat', { method: 'POST', body: JSON.stringify(body) }),
  },
};
