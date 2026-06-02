'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hop } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { session, isLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && session) {
      router.replace('/dashboard');
    }
  }, [session, isLoading, router]);

  async function handleGoogleSignIn() {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <Hop className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold tracking-tight">PruneAI</span>
        </div>

        <div className="rounded-xl border bg-card px-7 py-8 shadow-sm">
          <h1 className="text-lg font-semibold mb-1">Welcome to PruneAI</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to continue to your workspace.
          </p>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md mb-4">
              {error}
            </p>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            variant="outline"
            className="w-full gap-2.5 h-10"
          >
            <GoogleIcon />
            {loading ? 'Redirecting…' : 'Continue with Google'}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in you agree to our{' '}
          <a href="#" className="underline underline-offset-2">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="underline underline-offset-2">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
