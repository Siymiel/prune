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

async function apiFetchForm<T>(path: string, body: FormData): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
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
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
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

export interface WorkflowGraph {
  nodes: unknown[];
  edges: unknown[];
}

export interface WorkflowOut {
  id: string;
  name: string;
  description: string | null;
  graph: WorkflowGraph;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowCreate {
  name: string;
  description?: string;
  graph?: WorkflowGraph;
}

export interface WorkflowUpdate {
  name?: string;
  description?: string;
  graph?: WorkflowGraph;
  is_published?: boolean;
}

export interface RunOut {
  id: string;
  workflow_id: string | null;
  status: 'pending' | 'running' | 'waiting' | 'done' | 'error';
  state: Record<string, unknown>;
  error: string | null;
  trace: TraceStep[];
  started_at: string | null;
  completed_at: string | null;
  parent_run_id: string | null;
}

export interface TriggerRunRequest {
  workflow_id: string;
  inputs?: Record<string, unknown>;
}

export interface KnowledgeBaseOut {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  document_count: number;
}

export interface KnowledgeDocumentOut {
  id: string;
  filename: string;
  file_type: string;
  chunk_count: number;
  status: 'processing' | 'ready' | 'error';
  error: string | null;
  created_at: string;
}

export interface KnowledgeSource {
  filename: string;
  text: string;
  score: number;
  chunk_index: number;
  kb_id: string;
}

export type DeploymentType = 'chat' | 'form' | 'api' | 'widget';
export type DeploymentStatus = 'active' | 'inactive' | 'archived';

export interface DeploymentOut {
  id: string;
  workflow_id: string;
  version_id: string;
  deployment_type: DeploymentType;
  status: DeploymentStatus;
  slug: string;
  url: string | null;
  created_by: string | null;
  published_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  version_number: number | null;
}

export interface WorkflowVersionOut {
  id: string;
  workflow_id: string;
  version_number: number;
  created_by: string | null;
  created_at: string;
}

export interface PublishRequest {
  workflow_id: string;
  deployment_type: DeploymentType;
  slug?: string;
  metadata?: Record<string, unknown>;
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

  workflows: {
    list: () =>
      apiFetch<WorkflowOut[]>('/v1/workflows'),

    create: (body: WorkflowCreate) =>
      apiFetch<WorkflowOut>('/v1/workflows', { method: 'POST', body: JSON.stringify(body) }),

    get: (id: string) =>
      apiFetch<WorkflowOut>(`/v1/workflows/${id}`),

    update: (id: string, body: WorkflowUpdate) =>
      apiFetch<WorkflowOut>(`/v1/workflows/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    delete: (id: string) =>
      apiFetch<void>(`/v1/workflows/${id}`, { method: 'DELETE' }),
  },

  knowledgeBases: {
    list: () =>
      apiFetch<KnowledgeBaseOut[]>('/v1/knowledge-bases'),

    create: (name: string, description?: string) =>
      apiFetch<KnowledgeBaseOut>('/v1/knowledge-bases', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      }),

    delete: (id: string) =>
      apiFetch<void>(`/v1/knowledge-bases/${id}`, { method: 'DELETE' }),

    listDocuments: (kbId: string) =>
      apiFetch<KnowledgeDocumentOut[]>(`/v1/knowledge-bases/${kbId}/documents`),

    uploadDocument: (
      kbId: string,
      file: File,
      opts?: {
        chunkSize?: number;
        chunkOverlapPct?: number;
        chunkingMethod?: 'sentence' | 'naive';
        embeddingModel?: string;
      },
    ) => {
      const form = new FormData();
      form.append('file', file);
      const params = new URLSearchParams();
      if (opts?.chunkSize)        params.set('chunk_size', String(opts.chunkSize));
      if (opts?.chunkOverlapPct != null) params.set('chunk_overlap_pct', String(opts.chunkOverlapPct));
      if (opts?.chunkingMethod)   params.set('chunking_method', opts.chunkingMethod);
      if (opts?.embeddingModel)   params.set('embedding_model', opts.embeddingModel);
      const qs = params.toString();
      return apiFetchForm<KnowledgeDocumentOut>(
        `/v1/knowledge-bases/${kbId}/documents${qs ? `?${qs}` : ''}`,
        form,
      );
    },

    deleteDocument: (kbId: string, docId: string) =>
      apiFetch<void>(`/v1/knowledge-bases/${kbId}/documents/${docId}`, { method: 'DELETE' }),
  },

  files: {
    extract: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return apiFetchForm<{ name: string; text: string; type: string; size: number }>(
        '/v1/files/extract',
        form,
      );
    },
  },

  runs: {
    trigger: (body: TriggerRunRequest) =>
      apiFetch<RunOut>('/v1/runs', { method: 'POST', body: JSON.stringify(body) }),

    get: (id: string) =>
      apiFetch<RunOut>(`/v1/runs/${id}`),

    list: (params?: { workflow_id?: string; status?: string; parent_run_id?: string; page?: number; page_size?: number }) => {
      const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString() : '';
      return apiFetch<RunOut[]>(`/v1/runs${qs}`);
    },
  },

  deployments: {
    publish: (body: PublishRequest) =>
      apiFetch<DeploymentOut>('/v1/deployments', { method: 'POST', body: JSON.stringify(body) }),

    list: (params?: { workflow_id?: string; status?: string; limit?: number; offset?: number }) => {
      const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString() : '';
      return apiFetch<DeploymentOut[]>(`/v1/deployments${qs}`);
    },

    get: (id: string) =>
      apiFetch<DeploymentOut>(`/v1/deployments/${id}`),

    update: (id: string, body: { status?: string; metadata?: Record<string, unknown> }) =>
      apiFetch<DeploymentOut>(`/v1/deployments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    archive: (id: string) =>
      apiFetch<void>(`/v1/deployments/${id}`, { method: 'DELETE' }),

    versions: (workflowId: string) =>
      apiFetch<WorkflowVersionOut[]>(`/v1/workflows/${workflowId}/versions`),
  },

  channels: {
    create: (body: { workflow_id: string; channel_type: string; config: Record<string, string> }) =>
      apiFetch<{ id: string; workflow_id: string; channel_type: string; config: Record<string, unknown>; is_active: boolean; created_at: string }>(
        '/v1/channels', { method: 'POST', body: JSON.stringify(body) }
      ),

    list: (workflow_id?: string) => {
      const qs = workflow_id ? `?workflow_id=${workflow_id}` : '';
      return apiFetch<{ id: string; workflow_id: string; channel_type: string; config: Record<string, unknown>; is_active: boolean; created_at: string }[]>(`/v1/channels${qs}`);
    },

    delete: (id: string) =>
      apiFetch<void>(`/v1/channels/${id}`, { method: 'DELETE' }),
  },

  conversations: {
    list: (params?: { page?: number; page_size?: number }) => {
      const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString() : '';
      return apiFetch<{ id: string; contact_phone: string | null; channel: string; created_at: string; updated_at: string; last_message: string | null; message_count: number }[]>(`/v1/conversations${qs}`);
    },

    get: (id: string) =>
      apiFetch<{ id: string; contact_phone: string | null; channel: string; created_at: string; updated_at: string }>(`/v1/conversations/${id}`),

    messages: (id: string) =>
      apiFetch<{ id: string; role: string; content: string; created_at: string }[]>(`/v1/conversations/${id}/messages`),
  },
};

// ---------------------------------------------------------------------------
// Streaming run helper — yields SSE events as workflow nodes complete
// ---------------------------------------------------------------------------

export interface RunStepEvent {
  event: 'step';
  node: string;
  node_type: string;
  status: string;
  ms: number;
  output?: Record<string, unknown> | null;
  error?: string | null;
}

export interface RunDoneEvent {
  event: 'done';
  status: string;
  error?: string | null;
  state?: Record<string, unknown>;
}

export type RunStreamEvent = RunStepEvent | RunDoneEvent;

export async function* streamRun(runId: string): AsyncGenerator<RunStreamEvent> {
  const token = await getToken();
  const res = await fetch(`${API_URL}/v1/runs/${runId}/stream`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok || !res.body) {
    throw new Error(`Run stream failed: HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const payload = JSON.parse(line.slice(6)) as RunStreamEvent;
        yield payload;
        if (payload.event === 'done') return;
      } catch {
        // malformed chunk — skip
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Streaming chat helper — yields tokens via SSE
// ---------------------------------------------------------------------------

export async function* streamChat(
  message: string,
  options: { templateSlug?: string; systemPrompt?: string; history?: Array<{ role: string; content: string }> } = {},
): AsyncGenerator<string> {
  const token = await getToken();
  const res = await fetch(`${API_URL}/v1/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message,
      template_slug: options.templateSlug,
      system_prompt: options.systemPrompt,
      history: options.history ?? [],
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Stream request failed: HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const payload = JSON.parse(line.slice(6)) as { token?: string; done?: boolean; error?: string };
        if (payload.error) throw new Error(payload.error);
        if (payload.done) return;
        if (payload.token) yield payload.token;
      } catch {
        // malformed chunk — skip
      }
    }
  }
}
