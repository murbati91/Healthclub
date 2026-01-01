import { createServerSupabaseClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Auth callback route handler
 * Handles OAuth callbacks and email confirmations
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = await createServerSupabaseClient();

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      // Redirect to login with error
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }

    // Get user to determine role
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // If no profile exists (e.g., first-time Google OAuth user), create one
      if (profileError && profileError.code === 'PGRST116') {
        // Extract name from Google OAuth metadata
        const fullName = user.user_metadata?.full_name ||
                        user.user_metadata?.name ||
                        user.email?.split('@')[0] ||
                        'User';

        // Create profile for OAuth user
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: fullName,
            email: user.email,
            phone: user.phone || null,
            role: 'customer', // Default role for new users
          });

        if (createError) {
          console.error('Error creating profile for OAuth user:', createError);
        }

        // New user - redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
      }

      // Redirect based on role if no 'next' param specified
      if (next === '/dashboard' && profile) {
        const role = profile.role;
        if (role === 'admin') {
          return NextResponse.redirect(new URL('/admin', requestUrl.origin));
        } else if (role === 'driver') {
          return NextResponse.redirect(new URL('/driver', requestUrl.origin));
        }
      }
    }
  }

  // Redirect to the specified next page or dashboard
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
