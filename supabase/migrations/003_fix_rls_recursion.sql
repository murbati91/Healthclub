-- Migration: Fix RLS Infinite Recursion
-- Problem: Policies checking admin role by querying profiles table cause infinite recursion
-- Solution: Create SECURITY DEFINER function to bypass RLS when checking user role

-- =============================================
-- SECURITY DEFINER FUNCTION: Check if user is admin
-- =============================================
-- This function bypasses RLS (SECURITY DEFINER) to safely check user role
-- without triggering the profiles table policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin IS 'Safely check if current user is admin without RLS recursion';

-- =============================================
-- DROP PROBLEMATIC POLICIES
-- =============================================

-- Profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Packages policies
DROP POLICY IF EXISTS "Everyone can view active packages" ON public.packages;
DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;

-- Package options policies
DROP POLICY IF EXISTS "Everyone can view active package options" ON public.package_options;
DROP POLICY IF EXISTS "Admins can manage package options" ON public.package_options;

-- Dietary options policies
DROP POLICY IF EXISTS "Everyone can view active dietary options" ON public.dietary_options;
DROP POLICY IF EXISTS "Admins can manage dietary options" ON public.dietary_options;

-- Subscriptions policies
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;

-- Drivers policies
DROP POLICY IF EXISTS "Admins can manage all drivers" ON public.drivers;

-- Daily orders policies
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.daily_orders;

-- WhatsApp messages policies
DROP POLICY IF EXISTS "Admins can view all messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.whatsapp_messages;

-- =============================================
-- RECREATE SAFE POLICIES USING is_admin() FUNCTION
-- =============================================

-- PROFILES POLICIES
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- PACKAGES POLICIES
CREATE POLICY "Everyone can view active packages"
  ON public.packages FOR SELECT
  USING (active = true OR public.is_admin());

CREATE POLICY "Admins can manage packages"
  ON public.packages FOR ALL
  USING (public.is_admin());

-- PACKAGE OPTIONS POLICIES
CREATE POLICY "Everyone can view active package options"
  ON public.package_options FOR SELECT
  USING (active = true OR public.is_admin());

CREATE POLICY "Admins can manage package options"
  ON public.package_options FOR ALL
  USING (public.is_admin());

-- DIETARY OPTIONS POLICIES
CREATE POLICY "Everyone can view active dietary options"
  ON public.dietary_options FOR SELECT
  USING (active = true OR public.is_admin());

CREATE POLICY "Admins can manage dietary options"
  ON public.dietary_options FOR ALL
  USING (public.is_admin());

-- SUBSCRIPTIONS POLICIES
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.is_admin());

-- DRIVERS POLICIES
CREATE POLICY "Admins can manage all drivers"
  ON public.drivers FOR ALL
  USING (public.is_admin());

-- DAILY ORDERS POLICIES
CREATE POLICY "Admins can manage all orders"
  ON public.daily_orders FOR ALL
  USING (public.is_admin());

-- WHATSAPP MESSAGES POLICIES
CREATE POLICY "Admins can view all messages"
  ON public.whatsapp_messages FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage all messages"
  ON public.whatsapp_messages FOR ALL
  USING (public.is_admin());

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- The is_admin() function uses SECURITY DEFINER, which means it runs with
-- the privileges of the function owner (bypassing RLS). This prevents
-- infinite recursion when checking if a user is an admin.
--
-- Regular users can still:
-- - View/update their own profile (existing policies)
-- - View active packages (active = true condition)
-- - View/manage their own subscriptions (auth.uid() = user_id policies)
--
-- Admins can:
-- - View/manage all data (is_admin() returns true)
-- - No infinite recursion because is_admin() bypasses RLS
