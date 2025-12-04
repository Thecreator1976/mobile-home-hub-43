-- Fix Critical RLS Security Issues
-- Implement owner-based access control for sensitive data

-- ============================================
-- 1. BUYERS TABLE - Fix SELECT policy
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view buyers" ON public.buyers;

CREATE POLICY "Users can view buyers they created or admins/agents see all"
ON public.buyers
FOR SELECT
USING (
  created_by = auth.uid() 
  OR is_admin_or_agent(auth.uid())
);

-- ============================================
-- 2. SELLER_LEADS TABLE - Fix SELECT policy
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.seller_leads;

CREATE POLICY "Users can view leads they created or admins/agents see all"
ON public.seller_leads
FOR SELECT
USING (
  created_by = auth.uid() 
  OR is_admin_or_agent(auth.uid())
);

-- ============================================
-- 3. APPOINTMENTS TABLE - Fix SELECT policy
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON public.appointments;

CREATE POLICY "Users can view appointments they created or admins/agents see all"
ON public.appointments
FOR SELECT
USING (
  created_by = auth.uid() 
  OR is_admin_or_agent(auth.uid())
);

-- ============================================
-- 4. EXPENSES TABLE - Fix SELECT policy
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON public.expenses;

CREATE POLICY "Users can view expenses they created or admins/agents see all"
ON public.expenses
FOR SELECT
USING (
  created_by = auth.uid() 
  OR is_admin_or_agent(auth.uid())
);

-- ============================================
-- 5. PERSONAL_ADVANCES TABLE - Fix SELECT policy
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view personal advances" ON public.personal_advances;

CREATE POLICY "Users can view advances they created or admins/agents see all"
ON public.personal_advances
FOR SELECT
USING (
  created_by = auth.uid() 
  OR is_admin_or_agent(auth.uid())
);

-- ============================================
-- 6. PURCHASE_ORDERS TABLE - Fix SELECT policy
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view purchase orders" ON public.purchase_orders;

CREATE POLICY "Users can view POs they created or admins/agents see all"
ON public.purchase_orders
FOR SELECT
USING (
  created_by = auth.uid() 
  OR is_admin_or_agent(auth.uid())
);

-- ============================================
-- 7. LEAD_TIMELINE TABLE - Fix SELECT policy
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view timeline" ON public.lead_timeline;

CREATE POLICY "Users can view timeline for leads they have access to"
ON public.lead_timeline
FOR SELECT
USING (
  user_id = auth.uid() 
  OR is_admin_or_agent(auth.uid())
);

-- ============================================
-- 8. SMS_TEMPLATES - Restrict to agents/admins only
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view templates" ON public.sms_templates;

CREATE POLICY "Agents and admins can view SMS templates"
ON public.sms_templates
FOR SELECT
USING (is_admin_or_agent(auth.uid()));

-- ============================================
-- 9. CONTRACT_TEMPLATES - Restrict to agents/admins only
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view contract templates" ON public.contract_templates;

CREATE POLICY "Agents and admins can view contract templates"
ON public.contract_templates
FOR SELECT
USING (is_admin_or_agent(auth.uid()));