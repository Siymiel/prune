'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setTenantId, setLoading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        api.auth.me().then((me) => setTenantId(me.tenant_id)).catch(() => {});
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        api.auth.me().then((me) => setTenantId(me.tenant_id)).catch(() => {});
      } else {
        useAuthStore.getState().reset();
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, setTenantId, setLoading]);

  return <>{children}</>;
}
