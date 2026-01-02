import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/auth/callback'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Protected routes
  const protectedRoutes = {
    '/dashboard': ['customer', 'admin', 'driver'],
    '/admin': ['admin'],
    '/driver': ['driver'],
  };

  // If user is not logged in and trying to access protected route
  if (!user && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is logged in
  if (user) {
    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role || 'customer';

    // Redirect logged-in users away from auth pages
    if (pathname === '/login' || pathname === '/register') {
      const redirectUrl = request.nextUrl.clone();
      // Redirect based on role
      if (userRole === 'admin') {
        redirectUrl.pathname = '/admin';
      } else if (userRole === 'driver') {
        redirectUrl.pathname = '/driver';
      } else {
        redirectUrl.pathname = '/dashboard';
      }
      return NextResponse.redirect(redirectUrl);
    }

    // Check role-based access for protected routes
    for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(userRole)) {
          // Redirect to appropriate dashboard based on role
          const redirectUrl = request.nextUrl.clone();
          if (userRole === 'admin') {
            redirectUrl.pathname = '/admin';
          } else if (userRole === 'driver') {
            redirectUrl.pathname = '/driver';
          } else {
            redirectUrl.pathname = '/dashboard';
          }
          return NextResponse.redirect(redirectUrl);
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - site.webmanifest
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|site\\.webmanifest|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|xml|txt|webmanifest)$).*)',
  ],
};
