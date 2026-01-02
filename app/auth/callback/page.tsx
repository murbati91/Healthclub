'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (errorParam) {
        setError(errorDescription || errorParam);
        setTimeout(() => router.push('/login?error=' + encodeURIComponent(errorDescription || errorParam)), 2000);
        return;
      }

      if (code) {
        try {
          // Exchange code for session on the client side
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('Auth callback error:', exchangeError);
            setError(exchangeError.message);
            setTimeout(() => router.push('/login?error=' + encodeURIComponent(exchangeError.message)), 2000);
            return;
          }

          // Get user and check/create profile
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            // Check if profile exists
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single();

            // If no profile exists, create one
            if (profileError && profileError.code === 'PGRST116') {
              const fullName = user.user_metadata?.full_name ||
                              user.user_metadata?.name ||
                              user.email?.split('@')[0] ||
                              'User';

              await supabase.from('profiles').insert({
                id: user.id,
                full_name: fullName,
                email: user.email || '',
                phone: user.phone || null,
                role: 'customer',
              });

              router.push('/dashboard');
              return;
            }

            // Redirect based on role
            const role = profile?.role || 'customer';
            if (role === 'admin') {
              router.push('/admin');
            } else if (role === 'driver') {
              router.push('/driver');
            } else {
              router.push('/dashboard');
            }
          } else {
            router.push('/dashboard');
          }
        } catch (err) {
          console.error('Callback error:', err);
          setError('Authentication failed. Please try again.');
          setTimeout(() => router.push('/login'), 2000);
        }
      } else {
        // No code, just redirect to dashboard
        router.push('/dashboard');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="text-red-500 text-lg font-medium">{error}</div>
            <p className="text-muted-foreground">Redirecting to login...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto" />
            <p className="text-lg font-medium text-gray-700">Completing sign in...</p>
            <p className="text-sm text-muted-foreground">Please wait while we verify your account</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto" />
        <p className="text-lg font-medium text-gray-700">Loading...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
