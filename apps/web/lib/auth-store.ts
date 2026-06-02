import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  tenantId: string | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setTenantId: (id: string) => void;
  setLoading: (v: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  tenantId: null,
  isLoading: true,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setTenantId: (tenantId) => set({ tenantId }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ session: null, user: null, tenantId: null, isLoading: false }),
}));
