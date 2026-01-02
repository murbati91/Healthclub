# How to Apply Admin User Migration

This document explains how to run the admin user creation migration.

## Migration File
- **Path:** `supabase/migrations/004_create_admin_user.sql`
- **Purpose:** Creates admin user and promotion function

## Admin Credentials
- **Email:** admin@healthyclub.com
- **Password:** 2022@Bukhalid
- **Role:** admin

---

## Method 1: Supabase Dashboard SQL Editor (Easiest)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy and paste the entire contents of `supabase/migrations/004_create_admin_user.sql`
5. Click **Run** (or press `Ctrl+Enter`)
6. Check the output for success messages

**Expected output:**
```
NOTICE: Created admin user with ID: [uuid]
NOTICE: Created admin profile for user: admin@healthyclub.com
NOTICE: Password: 2022@Bukhalid
```

---

## Method 2: Supabase CLI (If using local development)

If you have Supabase CLI installed:

```bash
# Navigate to project
cd "c:\Users\Faisal\Desktop\Healthy club\healthy-club"

# Apply all pending migrations
npx supabase db push

# OR reset database (warning: deletes all data)
npx supabase db reset
```

---

## Method 3: Manual User Creation (If migration fails)

If the automated migration fails due to permissions:

### Step 1: Create user in Supabase Dashboard
1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Enter:
   - Email: `admin@healthyclub.com`
   - Password: `2022@Bukhalid`
4. Check **Auto Confirm User**
5. Click **Create User**

### Step 2: Promote to admin
Go to **SQL Editor** and run:
```sql
SELECT public.promote_user_to_admin('admin@healthyclub.com');
```

---

## Verification

After running the migration, verify it worked:

### Check 1: User exists in auth.users
```sql
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'admin@healthyclub.com';
```

### Check 2: Profile has admin role
```sql
SELECT p.id, p.full_name, p.role, p.phone
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'admin@healthyclub.com';
```

**Expected result:**
- `role` should be `'admin'`
- `full_name` should be `'Admin'`

### Check 3: Admin function works
```sql
-- This should return true when logged in as admin
SELECT public.is_admin();
```

---

## Troubleshooting

### Issue: "permission denied for schema auth"
**Solution:** Use Method 3 (Manual User Creation) instead. The auth schema may not be accessible for direct inserts.

### Issue: "User already exists"
**Solution:** The user was created but may not have admin role. Run:
```sql
SELECT public.promote_user_to_admin('admin@healthyclub.com');
```

### Issue: "Profile not found"
**Solution:** The user exists in auth but not in profiles. Run:
```sql
INSERT INTO public.profiles (id, full_name, phone, role)
SELECT id, 'Admin', '+973-00000000', 'admin'
FROM auth.users
WHERE email = 'admin@healthyclub.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

### Issue: Can't log in
**Possible causes:**
1. Email not confirmed → Go to Dashboard → Users → Click user → Confirm email
2. Wrong password → Reset via Dashboard or send recovery email
3. RLS policies blocking → Check browser console for errors

---

## Testing Admin Access

After creating the admin user:

1. **Log in to your app** with:
   - Email: admin@healthyclub.com
   - Password: 2022@Bukhalid

2. **Test admin permissions** (you should be able to):
   - View all user profiles
   - View all subscriptions
   - Manage packages
   - Assign drivers to orders
   - View all orders and messages

3. **Check in code** that `is_admin()` returns true:
```typescript
// In your Next.js app
const { data: isAdmin } = await supabase
  .rpc('is_admin');
console.log('Is Admin:', isAdmin); // Should be true
```

---

## Security Recommendations

After testing:

1. **Change the default password** to something unique
2. **Enable 2FA** in Supabase Dashboard for admin account
3. **Create separate admin accounts** for each team member
4. **Never commit** real credentials to git (this is just for initial setup)
5. **Rotate passwords** regularly

---

## Available Admin Functions

The migration creates these helper functions:

```sql
-- Promote any user to admin
SELECT public.promote_user_to_admin('user@example.com');

-- Check if current user is admin (used in RLS policies)
SELECT public.is_admin();
```

Use these functions as needed for admin management.
