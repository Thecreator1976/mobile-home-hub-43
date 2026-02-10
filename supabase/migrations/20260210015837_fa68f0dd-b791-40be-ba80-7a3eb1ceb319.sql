
-- =============================================
-- CRITICAL FIX 1: Make core security functions SECURITY DEFINER
-- =============================================

CREATE OR REPLACE FUNCTION public.get_user_org(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM profiles 
        WHERE user_id = _user_id 
        LIMIT 1
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_org()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN get_user_org(auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_org(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF is_super_admin(_user_id) THEN
        RETURN true;
    END IF;
    RETURN get_user_org(_user_id) = _org_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = _user_id 
        AND role = _role
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN has_role(auth.uid(), _role);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_agent(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = _user_id 
        AND role IN ('admin', 'agent', 'tenant_admin')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_agent()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN is_admin_or_agent(auth.uid());
END;
$$;

-- =============================================
-- CRITICAL FIX 2: Drop _deny_super_admin policies
-- (bypass org isolation for ALL non-super-admin users)
-- =============================================

DROP POLICY IF EXISTS "appointments_deny_super_admin" ON public.appointments;
DROP POLICY IF EXISTS "contract_templates_deny_super_admin" ON public.contract_templates;
DROP POLICY IF EXISTS "contracts_deny_super_admin" ON public.contracts;
DROP POLICY IF EXISTS "expenses_deny_super_admin" ON public.expenses;
DROP POLICY IF EXISTS "messenger_conversations_deny_super_admin" ON public.messenger_conversations;
DROP POLICY IF EXISTS "personal_advances_deny_super_admin" ON public.personal_advances;
DROP POLICY IF EXISTS "purchase_orders_deny_super_admin" ON public.purchase_orders;
DROP POLICY IF EXISTS "seller_leads_deny_super_admin" ON crm_private.seller_leads;
DROP POLICY IF EXISTS "sms_templates_deny_super_admin" ON public.sms_templates;
DROP POLICY IF EXISTS "social_posts_queue_deny_super_admin" ON public.social_posts_queue;

-- =============================================
-- FIX 3: Drop all deny_all policies (confusing no-ops)
-- =============================================

DROP POLICY IF EXISTS "deny_all" ON public.appointments;
DROP POLICY IF EXISTS "deny_all" ON public.contract_status_history;
DROP POLICY IF EXISTS "deny_all" ON public.contract_templates;
DROP POLICY IF EXISTS "deny_all" ON public.contracts;
DROP POLICY IF EXISTS "deny_all" ON public.expenses;
DROP POLICY IF EXISTS "deny_all" ON public.invitations;
DROP POLICY IF EXISTS "deny_all" ON public.lead_timeline;
DROP POLICY IF EXISTS "deny_all" ON public.messenger_conversations;
DROP POLICY IF EXISTS "deny_all" ON public.messenger_messages;
DROP POLICY IF EXISTS "deny_all" ON public.organizations;

-- =============================================
-- FIX 4: Drop redundant _org_read/_org_write policies
-- =============================================

DROP POLICY IF EXISTS "appointments_org_read" ON public.appointments;
DROP POLICY IF EXISTS "appointments_org_write" ON public.appointments;
DROP POLICY IF EXISTS "contract_templates_org_read" ON public.contract_templates;
DROP POLICY IF EXISTS "contract_templates_org_write" ON public.contract_templates;
DROP POLICY IF EXISTS "contracts_org_read" ON public.contracts;
DROP POLICY IF EXISTS "contracts_org_write" ON public.contracts;
DROP POLICY IF EXISTS "expenses_org_read" ON public.expenses;
DROP POLICY IF EXISTS "expenses_org_write" ON public.expenses;
DROP POLICY IF EXISTS "messenger_conversations_read" ON public.messenger_conversations;
DROP POLICY IF EXISTS "messenger_conversations_write" ON public.messenger_conversations;
DROP POLICY IF EXISTS "personal_advances_org_read" ON public.personal_advances;
DROP POLICY IF EXISTS "personal_advances_org_write" ON public.personal_advances;
DROP POLICY IF EXISTS "purchase_orders_org_read" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_org_write" ON public.purchase_orders;
DROP POLICY IF EXISTS "sms_templates_org_read" ON public.sms_templates;
DROP POLICY IF EXISTS "sms_templates_org_write" ON public.sms_templates;
DROP POLICY IF EXISTS "social_posts_queue_org_read" ON public.social_posts_queue;
DROP POLICY IF EXISTS "social_posts_queue_org_write" ON public.social_posts_queue;
DROP POLICY IF EXISTS "seller_leads_org_read" ON crm_private.seller_leads;
DROP POLICY IF EXISTS "seller_leads_org_write" ON crm_private.seller_leads;

-- =============================================
-- FIX 5: Fix profiles UPDATE policy
-- =============================================

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
