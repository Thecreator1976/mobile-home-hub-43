
-- =============================================
-- FIX 1: Clean up conflicting profiles RLS policies
-- =============================================

-- Drop conflicting/blocking policies
DROP POLICY IF EXISTS "Block all access" ON public.profiles;
DROP POLICY IF EXISTS "Test simple block" ON public.profiles;
DROP POLICY IF EXISTS "Base: No anonymous access" ON public.profiles;

-- Drop redundant SELECT policies (keep clean ones)
DROP POLICY IF EXISTS "Super admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_org" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_super_admin" ON public.profiles;
DROP POLICY IF EXISTS "restrict_profile_email_viewing" ON public.profiles;

-- Create clean, non-recursive SELECT policies using SECURITY DEFINER functions
CREATE POLICY "profiles_select_self"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "profiles_select_org"
  ON public.profiles FOR SELECT
  USING (organization_id = get_user_org(auth.uid()));

CREATE POLICY "profiles_select_super_admin"
  ON public.profiles FOR SELECT
  USING (is_super_admin(auth.uid()));

-- =============================================
-- FIX 2: Clean up conflicting buyers RLS policies
-- =============================================

-- Drop conflicting/blocking policies
DROP POLICY IF EXISTS "deny_all" ON public.buyers;
DROP POLICY IF EXISTS "buyers_deny_super_admin" ON public.buyers;

-- Drop redundant SELECT policies
DROP POLICY IF EXISTS "Users can view buyers in their organization or created by them" ON public.buyers;
DROP POLICY IF EXISTS "Users can view their own buyers only" ON public.buyers;
DROP POLICY IF EXISTS "buyers_read_org" ON public.buyers;
DROP POLICY IF EXISTS "buyers_org_write" ON public.buyers;

-- Create clean SELECT policy
CREATE POLICY "buyers_select_access"
  ON public.buyers FOR SELECT
  USING (
    is_super_admin(auth.uid())
    OR can_access_org(auth.uid(), organization_id)
  );

-- =============================================
-- FIX 3: Drop test/demo views that expose data
-- =============================================
DROP VIEW IF EXISTS public.access_control_demo CASCADE;
DROP VIEW IF EXISTS public.access_control_demo_simple CASCADE;
DROP VIEW IF EXISTS public.test_secure_buyers CASCADE;
DROP VIEW IF EXISTS public.buyers_viewer CASCADE;
