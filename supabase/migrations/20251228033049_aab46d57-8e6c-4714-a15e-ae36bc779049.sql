-- Phase 1 Part C: Create helper functions and RLS policies

-- 1. Helper functions for multi-tenant security

-- Get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_org(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Check if user is tenant admin for a specific org
CREATE OR REPLACE FUNCTION public.is_tenant_admin_for_org(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = _user_id 
      AND ur.role = 'tenant_admin'
      AND p.organization_id = _org_id
  )
$$;

-- Check if user can access an organization's data
CREATE OR REPLACE FUNCTION public.can_access_org(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_super_admin(_user_id) OR 
    public.get_user_org(_user_id) = _org_id
$$;

-- 2. RLS Policies for organizations table

-- Require authentication for organizations
CREATE POLICY "Require authentication for organizations"
ON public.organizations FOR ALL
USING (auth.uid() IS NOT NULL);

-- Super admins can manage all organizations
CREATE POLICY "Super admins can manage all organizations"
ON public.organizations FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Users can view their organization
CREATE POLICY "Users can view their organization"
ON public.organizations FOR SELECT
USING (
  id = public.get_user_org(auth.uid()) OR 
  public.is_super_admin(auth.uid())
);

-- Tenant admins can update their organization
CREATE POLICY "Tenant admins can update their organization"
ON public.organizations FOR UPDATE
USING (
  public.is_tenant_admin_for_org(auth.uid(), id) OR 
  public.is_super_admin(auth.uid())
);