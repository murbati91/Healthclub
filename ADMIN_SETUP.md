# Admin User Setup Guide

This guide explains how to create an admin user for the Healthy Club application.

## Credentials
- **Email:** admin@healthyclub.com
- **Password:** 2022@Bukhalid
- **Role:** admin

## Setup Options

### Option 1: Automatic Migration (Recommended)

The migration file `supabase/migrations/004_create_admin_user.sql` attempts to automatically create the admin user.

**Run the migration:**
```bash
# If using Supabase CLI locally
npx supabase db reset

# Or apply just this migration
npx supabase migration up
```

**Note:** This may fail if you don't have superuser access to the auth schema. If it fails, use Option 2 or 3.

### Option 2: Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"** or **"Invite"**
4. Fill in:
   - Email: `admin@healthyclub.com`
   - Password: `2022@Bukhalid`
   - Auto Confirm User: **Yes** (check this box)
5. Click **Create User**
6. Run this SQL query in the SQL Editor:
   ```sql
   SELECT public.promote_user_to_admin('admin@healthyclub.com');
   ```

### Option 3: Promote Existing User

If you've already signed up with a different email and want to make that account an admin:

1. Go to Supabase SQL Editor
2. Run:
   ```sql
   SELECT public.promote_user_to_admin('your@email.com');
   ```

### Option 4: Sign Up Through App

1. Sign up normally through your application with:
   - Email: admin@healthyclub.com
   - Password: 2022@Bukhalid
   - Fill in required profile fields
2. After signup, run this SQL in Supabase SQL Editor:
   ```sql
   SELECT public.promote_user_to_admin('admin@healthyclub.com');
   ```

## Verification

After creating the admin user, verify it works:

```sql
-- Check if user exists
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'admin@healthyclub.com';

-- Check if profile has admin role
SELECT p.id, p.full_name, p.role
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'admin@healthyclub.com';

-- Should return role = 'admin'
```

## Test Admin Permissions

Try logging in with:
- Email: `admin@healthyclub.com`
- Password: `2022@Bukhalid`

As an admin, you should be able to:
- View all user profiles
- Manage packages and package options
- View and manage all subscriptions
- Assign drivers to orders
- View all WhatsApp messages
- Access all administrative functions

## Troubleshooting

### "User already exists" error
If the user already exists but isn't an admin:
```sql
SELECT public.promote_user_to_admin('admin@healthyclub.com');
```

### "Profile not found" error
If the user exists in auth.users but not in profiles:
```sql
INSERT INTO public.profiles (id, full_name, phone, role)
SELECT id, 'Admin', '+973-00000000', 'admin'
FROM auth.users
WHERE email = 'admin@healthyclub.com';
```

### Password reset needed
Reset via Supabase Dashboard:
1. Authentication → Users
2. Find admin@healthyclub.com
3. Click the three dots → "Send recovery email"
4. Or click "Update user" to set a new password directly

## Security Notes

1. **Change default password** after first login in production
2. **Enable MFA** for admin accounts in production
3. **Restrict admin email domain** if needed (e.g., only @yourcompany.com)
4. **Audit admin actions** via database logs
5. **Use separate admin accounts** for each team member (don't share credentials)

## Available Admin Functions

```sql
-- Promote any user to admin
SELECT public.promote_user_to_admin('user@example.com');

-- Check if current user is admin (in RLS policies)
SELECT public.is_admin();

-- Generate daily orders (admin only via RLS)
SELECT * FROM public.generate_daily_orders(CURRENT_DATE);

-- Auto-assign driver to order (admin only via RLS)
SELECT public.auto_assign_driver_to_order('order-uuid-here');
```
