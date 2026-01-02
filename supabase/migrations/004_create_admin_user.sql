-- Migration: Create Admin User
-- Purpose: Insert admin user for Healthy Club management
-- Email: admin@healthyclub.com
-- Password: 2022@Bukhalid

-- =============================================
-- CREATE ADMIN USER IN AUTH.USERS
-- =============================================
-- Note: This uses Supabase's internal auth functions to properly hash the password
-- The password will be bcrypt hashed automatically

DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'admin@healthyclub.com';
  admin_password TEXT := '2022@Bukhalid';
  admin_full_name TEXT := 'Admin';
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;

  IF admin_user_id IS NULL THEN
    -- Create user in auth.users
    -- Note: In production Supabase, you typically create users via:
    -- 1. Supabase Dashboard > Authentication > Users > Add User
    -- 2. Supabase Auth API endpoint
    -- 3. SQL admin functions (if available)

    -- Insert into auth.users (this requires superuser privileges or auth schema access)
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      admin_email,
      crypt(admin_password, gen_salt('bf')), -- bcrypt password hash
      NOW(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', admin_full_name),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO admin_user_id;

    RAISE NOTICE 'Created admin user with ID: %', admin_user_id;

    -- Insert profile with admin role
    INSERT INTO public.profiles (
      id,
      full_name,
      phone,
      role,
      address,
      area
    ) VALUES (
      admin_user_id,
      admin_full_name,
      '+973-00000000', -- Default admin phone
      'admin',
      'Admin Office',
      'Manama'
    );

    RAISE NOTICE 'Created admin profile for user: %', admin_email;
    RAISE NOTICE 'Password: 2022@Bukhalid';
  ELSE
    RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;

    -- Update existing user to admin role if not already
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = admin_user_id AND role != 'admin';

    IF FOUND THEN
      RAISE NOTICE 'Updated existing user % to admin role', admin_email;
    END IF;
  END IF;
END $$;

-- =============================================
-- ALTERNATIVE: Function to promote user to admin
-- =============================================
-- Use this function to promote any existing user to admin role
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email TEXT)
RETURNS VOID AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get user ID from email
  SELECT au.id INTO user_uuid
  FROM auth.users au
  WHERE au.email = user_email;

  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Update profile role to admin
  UPDATE public.profiles
  SET role = 'admin'
  WHERE id = user_uuid;

  IF FOUND THEN
    RAISE NOTICE 'User % promoted to admin', user_email;
  ELSE
    RAISE EXCEPTION 'Profile for user % not found', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.promote_user_to_admin IS 'Promote an existing user to admin role by email';

-- =============================================
-- USAGE INSTRUCTIONS
-- =============================================
-- If the direct auth.users insert fails due to permissions:
--
-- OPTION 1: Create user via Supabase Dashboard
-- 1. Go to Authentication > Users
-- 2. Click "Add User"
-- 3. Email: admin@healthyclub.com
-- 4. Password: 2022@Bukhalid
-- 5. Auto-confirm: Yes
-- 6. Then run: SELECT public.promote_user_to_admin('admin@healthyclub.com');
--
-- OPTION 2: Create user via signup and promote
-- 1. Sign up normally through your app
-- 2. Then run: SELECT public.promote_user_to_admin('your@email.com');
--
-- OPTION 3: Use Supabase CLI
-- npx supabase gen types typescript --local > schema.ts
-- Then create user programmatically via Admin API

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
