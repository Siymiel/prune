import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — createClient is deferred until first property access so that
// SSR module evaluation doesn't throw when env vars aren't set yet.
// All actual supabase calls happen in useEffect / event handlers (client-only).
let _client: SupabaseClient | undefined;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars — add NEXT_PUBLIC_SUPABASE_URL and ' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY to apps/web/.env.local'
    );
  }
  _client = createClient(url, key);
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    return getClient()[prop as keyof SupabaseClient];
  },
});
