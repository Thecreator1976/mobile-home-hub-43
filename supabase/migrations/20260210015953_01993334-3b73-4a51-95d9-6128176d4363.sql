
-- Fix is_tenant_admin_for_org - needs SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_tenant_admin_for_org(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur 
        JOIN profiles p ON p.user_id = ur.user_id
        WHERE ur.user_id = _user_id 
        AND ur.role = 'tenant_admin'
        AND p.organization_id = _org_id
    );
END;
$$;

-- Fix is_super_admin() no-arg to have search_path
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND is_super_admin = true
    );
END;
$$;
