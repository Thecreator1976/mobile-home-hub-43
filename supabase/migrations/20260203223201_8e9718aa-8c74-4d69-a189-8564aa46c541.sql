-- =====================================================
-- FIX 1: Create secure profiles view with masked emails for non-admins
-- =====================================================

-- Create a secure view for profiles that masks email for non-admin users
CREATE OR REPLACE VIEW public.profiles_masked
WITH (security_invoker=on) AS
SELECT 
  id,
  user_id,
  full_name,
  avatar_url,
  status,
  organization_id,
  subscription_tier,
  subscription_expires_at,
  is_paid,
  created_at,
  updated_at,
  -- Only show email to super admins, same user, or admin/agents in same org
  CASE 
    WHEN is_super_admin() THEN email
    WHEN user_id = auth.uid() THEN email
    WHEN is_admin_or_agent() AND can_access_org(auth.uid(), organization_id) THEN email
    ELSE CONCAT(
      SUBSTRING(email FROM 1 FOR 2),
      '***@',
      SUBSTRING(email FROM POSITION('@' IN email) + 1)
    )
  END AS email,
  -- Hide is_super_admin flag from non-super-admins
  CASE 
    WHEN is_super_admin() THEN is_super_admin
    ELSE NULL
  END AS is_super_admin
FROM public.profiles;

-- Add comment for documentation
COMMENT ON VIEW public.profiles_masked IS 'Secure view of profiles with email masking for non-admin users. Use this view for general profile queries.';

-- =====================================================
-- FIX 2: Create secure buyers view with masked contact info
-- =====================================================

-- Create a secure view for buyers that masks contact info for viewers
CREATE OR REPLACE VIEW public.buyers_masked
WITH (security_invoker=on) AS
SELECT 
  id,
  name,
  min_price,
  max_price,
  home_types,
  locations,
  credit_score,
  status,
  created_by,
  created_at,
  updated_at,
  organization_id,
  org_id,
  notes,
  -- Only show phone to super admins, record creator, or admin/agents in same org
  CASE 
    WHEN is_super_admin() THEN phone
    WHEN created_by = auth.uid() THEN phone
    WHEN is_admin_or_agent() AND can_access_org(auth.uid(), organization_id) THEN phone
    ELSE CASE 
      WHEN phone IS NOT NULL THEN CONCAT(
        SUBSTRING(phone FROM 1 FOR 3),
        '***',
        SUBSTRING(phone FROM LENGTH(phone) - 3)
      )
      ELSE NULL
    END
  END AS phone,
  -- Only show email to super admins, record creator, or admin/agents in same org
  CASE 
    WHEN is_super_admin() THEN email
    WHEN created_by = auth.uid() THEN email
    WHEN is_admin_or_agent() AND can_access_org(auth.uid(), organization_id) THEN email
    ELSE CASE 
      WHEN email IS NOT NULL THEN CONCAT(
        SUBSTRING(email FROM 1 FOR 2),
        '***@',
        SUBSTRING(email FROM POSITION('@' IN email) + 1)
      )
      ELSE NULL
    END
  END AS email
FROM public.buyers;

-- Add comment for documentation
COMMENT ON VIEW public.buyers_masked IS 'Secure view of buyers with contact info masking for viewer-level users. Admin/agents can see full contact info.';

-- Log the security changes
INSERT INTO public.security_audit_changes (
  object_type, 
  object_name, 
  change_type, 
  change_reason,
  new_value
) VALUES 
(
  'view',
  'profiles_masked',
  'CREATE',
  'Security fix: Created masked view to prevent email harvesting by non-admin users',
  'Emails masked for non-admin/agent users with pattern xx***@domain.com'
),
(
  'view',
  'buyers_masked', 
  'CREATE',
  'Security fix: Created masked view to prevent customer contact data theft by viewer-level users',
  'Phone and email masked for viewer users, full access for admin/agents and record creators'
);