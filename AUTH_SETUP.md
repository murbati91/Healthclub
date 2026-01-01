# Healthy Club - Authentication Setup Guide

Complete Supabase authentication implementation for the Healthy Club meal subscription platform.

## Overview

This authentication system uses Supabase with Next.js 14 App Router and includes:

- Phone number + password login (primary for Bahrain users)
- Email + password login (alternative method)
- Role-based access control (customer, driver, admin)
- Protected routes with middleware
- Session management with cookies
- Real-time auth state updates
- Form validation with Zod
- Toast notifications

## Files Created/Updated

### Core Authentication

1. **`/lib/supabase.ts`** - Supabase client configuration
   - `createClient()` - Browser client for client components
   - `createServerSupabaseClient()` - Server client for server components/API routes
   - Database type definitions

2. **`/lib/auth-context.tsx`** - Auth context and hooks
   - `AuthProvider` - Wraps the app with auth state
   - `useAuth()` - Hook to access user, profile, and auth methods
   - Auto-syncs with Supabase auth state changes

3. **`/middleware.ts`** - Route protection
   - Protects `/dashboard`, `/admin`, `/driver` routes
   - Redirects unauthenticated users to `/login`
   - Role-based redirects (admin → /admin, driver → /driver, customer → /dashboard)
   - Session refresh

### Forms & UI

4. **`/components/forms/LoginForm.tsx`** - Reusable login form
   - Toggle between phone/email login
   - Remember me checkbox
   - Loading states
   - Error handling with toast
   - Automatic role-based redirect

5. **`/components/forms/RegisterForm.tsx`** - Reusable registration form
   - Full name, phone (required), email, password fields
   - Password confirmation validation
   - Password strength indicator
   - Phone number formatting (+973 for Bahrain)
   - Terms acceptance checkbox
   - Creates user in both auth.users and profiles table

6. **`/components/ui/checkbox.tsx`** - Checkbox component
   - Used for "Remember me" and "Accept terms"

### Pages

7. **`/app/login/page.tsx`** - Login page
   - Uses LoginForm component
   - Link to registration

8. **`/app/register/page.tsx`** - Registration page
   - Uses RegisterForm component
   - Link to login

### API Routes

9. **`/app/auth/callback/route.ts`** - Auth callback handler
   - Handles OAuth callbacks
   - Handles email confirmations
   - Role-based redirects after authentication

### Layout

10. **`/app/layout.tsx`** - Updated root layout
    - Wrapped with AuthProvider
    - Added Toaster for notifications

### Configuration

11. **`.env.local.example`** - Environment variables template
    - Instructions for Supabase credentials

## Database Schema

You need to create a `profiles` table in Supabase:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'driver', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Anyone can insert during registration (will be restricted by auth)
CREATE POLICY "Users can create profile on signup"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Supabase Configuration

### 1. Phone Authentication Setup

In your Supabase project dashboard:

1. Go to **Authentication > Providers**
2. Enable **Phone** provider
3. Configure your SMS provider (Twilio, MessageBird, etc.)
4. Add your provider credentials

### 2. Email Authentication Setup

Email auth is enabled by default, but you may want to:

1. Go to **Authentication > Email Templates**
2. Customize confirmation email template
3. Set redirect URL to: `https://yourdomain.com/auth/callback`

### 3. URL Configuration

1. Go to **Settings > API**
2. Add your site URL to **Site URL** field
3. Add callback URLs to **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

## Environment Setup

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials from: `https://app.supabase.com/project/_/settings/api`

3. Get:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your anonymous/public key

## Usage Examples

### Using Auth in Client Components

```tsx
'use client';

import { useAuth } from '@/lib/auth-context';

export function UserProfile() {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <div>Not logged in</div>;

  return (
    <div>
      <h1>Welcome, {profile?.full_name}</h1>
      <p>Role: {profile?.role}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Using Auth in Server Components

```tsx
import { createServerSupabaseClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {profile?.full_name}</p>
    </div>
  );
}
```

### Protected API Routes

```tsx
import { createServerSupabaseClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Your protected logic here
  return NextResponse.json({ data: 'Protected data' });
}
```

## Authentication Flow

### Login Flow

1. User enters phone/email + password
2. Form validates with Zod
3. Supabase authenticates credentials
4. Middleware catches session cookie
5. Profile is fetched from database
6. User is redirected based on role:
   - Admin → `/admin`
   - Driver → `/driver`
   - Customer → `/dashboard`

### Registration Flow

1. User fills registration form
2. Form validates (password match, terms accepted, etc.)
3. Supabase creates auth user with phone
4. Profile is created in `profiles` table
5. User receives OTP via SMS (in production)
6. After verification, redirects to login

### Session Management

- Sessions are stored in HTTP-only cookies
- Middleware refreshes sessions automatically
- AuthProvider syncs auth state across the app
- Sessions persist across page refreshes

## Route Protection

Routes are protected in `middleware.ts`:

```typescript
const protectedRoutes = {
  '/dashboard': ['customer', 'admin', 'driver'], // All roles
  '/admin': ['admin'],                            // Admin only
  '/driver': ['driver'],                          // Driver only
};
```

## Role-Based Access

Three user roles:

1. **Customer** - Regular users, can order meals
2. **Driver** - Delivery personnel, can view/manage deliveries
3. **Admin** - Full access, can manage everything

Roles are set in the `profiles` table and checked by middleware.

## Features

- ✅ Phone number authentication (Bahrain +973)
- ✅ Email authentication (alternative)
- ✅ Password strength indicator
- ✅ Form validation with Zod
- ✅ Toast notifications (sonner)
- ✅ Loading states
- ✅ Error handling
- ✅ Remember me functionality
- ✅ Role-based access control
- ✅ Protected routes
- ✅ Session management
- ✅ Auth state synchronization
- ✅ RTL-ready (Arabic support)

## Next Steps

1. **Set up Supabase project** and configure phone auth
2. **Run database migrations** to create `profiles` table
3. **Add environment variables** from `.env.local.example`
4. **Customize email templates** in Supabase dashboard
5. **Add OTP verification page** for phone registration (optional)
6. **Style forms** to match your green theme
7. **Add password reset flow** (forgot password)
8. **Add profile editing** functionality

## Testing

### Test Phone Login

```
Phone: +97312345678
Password: test123
```

### Test Email Login

```
Email: test@example.com
Password: test123
```

Make sure to create test users in Supabase dashboard first.

## Troubleshooting

### "Invalid credentials" error
- Check if user exists in Supabase dashboard
- Verify phone format is +973XXXXXXXX
- Check password is correct

### Redirect loop
- Clear browser cookies
- Check middleware configuration
- Verify environment variables are set

### Profile not found
- Run database migration to create `profiles` table
- Check RLS policies are set correctly
- Verify profile is created during registration

## Security Considerations

- ✅ HTTP-only cookies for sessions
- ✅ Row Level Security (RLS) on profiles table
- ✅ Server-side session validation
- ✅ Password strength enforcement
- ✅ Rate limiting (handled by Supabase)
- ✅ CSRF protection (Next.js built-in)

## Support

For issues:
1. Check Supabase logs in dashboard
2. Check browser console for errors
3. Verify environment variables are set
4. Check database RLS policies

---

**Implementation Date:** January 2026
**Framework:** Next.js 14 (App Router)
**Auth Provider:** Supabase
**Validation:** Zod
**UI:** shadcn/ui + Tailwind CSS
