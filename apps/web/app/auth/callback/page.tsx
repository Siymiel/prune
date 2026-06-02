'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const go = (path: string) => router.replace(path as any);

    if (errorParam) {
      go('/login?error=' + encodeURIComponent(errorDescription ?? errorParam));
      return;
    }

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          go('/login?error=' + encodeURIComponent(error.message));
        } else {
          go('/dashboard');
        }
      });
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        go(session ? '/dashboard' : '/login');
      });
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
