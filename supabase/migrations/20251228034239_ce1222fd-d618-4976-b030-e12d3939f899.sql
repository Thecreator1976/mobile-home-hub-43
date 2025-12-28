
-- Drop existing RLS policies and create tenant-aware ones

-- ============================================
-- PROFILES
-- ============================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- SELLER_LEADS
-- ============================================
DROP POLICY IF EXISTS "Admins and agents can create leads" ON public.seller_leads;
DROP POLICY IF EXISTS "Admins and agents can update leads" ON public.seller_leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.seller_leads;
DROP POLICY IF EXISTS "Users can view leads they created or admins/agents see all" ON public.seller_leads;

CREATE POLICY "Users can view leads in their org or super admins see all" ON public.seller_leads
FOR SELECT USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND (created_by = auth.uid() OR public.is_admin_or_agent(auth.uid())))
);

CREATE POLICY "Admins and agents can create leads" ON public.seller_leads
FOR INSERT WITH CHECK (public.is_admin_or_agent(auth.uid()));

CREATE POLICY "Admins and agents can update leads in their org" ON public.seller_leads
FOR UPDATE USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.is_admin_or_agent(auth.uid()))
);

CREATE POLICY "Admins can delete leads in their org" ON public.seller_leads
FOR DELETE USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.has_role(auth.uid(), 'admin'))
);

-- ============================================
-- BUYERS
-- ============================================
DROP POLICY IF EXISTS "Admins and agents can manage buyers" ON public.buyers;
DROP POLICY IF EXISTS "Users can view buyers they created or admins/agents see all" ON public.buyers;

CREATE POLICY "Users can view buyers in their org" ON public.buyers
FOR SELECT USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND (created_by = auth.uid() OR public.is_admin_or_agent(auth.uid())))
);

CREATE POLICY "Admins and agents can manage buyers in their org" ON public.buyers
FOR ALL USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.is_admin_or_agent(auth.uid()))
);

-- ============================================
-- CONTRACTS
-- ============================================
DROP POLICY IF EXISTS "Admins and agents can manage contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can view contracts they created" ON public.contracts;

CREATE POLICY "Users can view contracts in their org" ON public.contracts
FOR SELECT USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND (created_by = auth.uid() OR public.is_admin_or_agent(auth.uid())))
);

CREATE POLICY "Admins and agents can manage contracts in their org" ON public.contracts
FOR ALL USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.is_admin_or_agent(auth.uid()))
);

-- ============================================
-- CONTRACT_TEMPLATES
-- ============================================
DROP POLICY IF EXISTS "Admins can create contract templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Admins can delete contract templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Admins can update contract templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Agents and admins can view contract templates" ON public.contract_templates;

CREATE POLICY "Agents and admins can view contract templates in their org" ON public.contract_templates
FOR SELECT USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.is_admin_or_agent(auth.uid()))
);

CREATE POLICY "Admins can create contract templates" ON public.contract_templates
FOR INSERT WITH CHECK (public.is_admin_or_agent(auth.uid()));

CREATE POLICY "Admins can update contract templates in their org" ON public.contract_templates
FOR UPDATE USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.is_admin_or_agent(auth.uid()))
);

CREATE POLICY "Admins can delete contract templates in their org" ON public.contract_templates
FOR DELETE USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.is_admin_or_agent(auth.uid()))
);

-- ============================================
-- EXPENSES
-- ============================================
DROP POLICY IF EXISTS "Admins and agents can manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can view expenses they created or admins/agents see all" ON public.expenses;

CREATE POLICY "Users can view expenses in their org" ON public.expenses
FOR SELECT USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND (created_by = auth.uid() OR public.is_admin_or_agent(auth.uid())))
);

CREATE POLICY "Admins and agents can manage expenses in their org" ON public.expenses
FOR ALL USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.is_admin_or_agent(auth.uid()))
);

-- ============================================
-- APPOINTMENTS
-- ============================================
DROP POLICY IF EXISTS "Admins and agents can manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view appointments they created or admins/agents see a" ON public.appointments;

CREATE POLICY "Users can view appointments in their org" ON public.appointments
FOR SELECT USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND (created_by = auth.uid() OR public.is_admin_or_agent(auth.uid())))
);

CREATE POLICY "Admins and agents can manage appointments in their org" ON public.appointments
FOR ALL USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.is_admin_or_agent(auth.uid()))
);

-- ============================================
-- PURCHASE_ORDERS
-- ============================================
DROP POLICY IF EXISTS "Admins and agents can manage purchase orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Users can view POs they created or admins/agents see all" ON public.purchase_orders;

CREATE POLICY "Users can view POs in their org" ON public.purchase_orders
FOR SELECT USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND (created_by = auth.uid() OR public.is_admin_or_agent(auth.uid())))
);

CREATE POLICY "Admins and agents can manage POs in their org" ON public.purchase_orders
FOR ALL USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.is_admin_or_agent(auth.uid()))
);

-- ============================================
-- PERSONAL_ADVANCES
-- ============================================
DROP POLICY IF EXISTS "Agents and admins can create personal advances" ON public.personal_advances;
DROP POLICY IF EXISTS "Agents and admins can delete personal advances" ON public.personal_advances;
DROP POLICY IF EXISTS "Agents and admins can update personal advances" ON public.personal_advances;
DROP POLICY IF EXISTS "Users can view advances they created or admins/agents see all" ON public.personal_advances;

CREATE POLICY "Users can view advances in their org" ON public.personal_advances
FOR SELECT USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND (created_by = auth.uid() OR public.is_admin_or_agent(auth.uid())))
);

CREATE POLICY "Agents and admins can create advances" ON public.personal_advances
FOR INSERT WITH CHECK (public.is_admin_or_agent(auth.uid()));

CREATE POLICY "Agents and admins can update advances in their org" ON public.personal_advances
FOR UPDATE USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.is_admin_or_agent(auth.uid()))
);

CREATE POLICY "Agents and admins can delete advances in their org" ON public.personal_advances
FOR DELETE USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.is_admin_or_agent(auth.uid()))
);

-- ============================================
-- MESSENGER_CONVERSATIONS
-- ============================================
DROP POLICY IF EXISTS "Agents and admins can manage conversations" ON public.messenger_conversations;
DROP POLICY IF EXISTS "Agents and admins can view conversations" ON public.messenger_conversations;

CREATE POLICY "Agents and admins can view conversations in their org" ON public.messenger_conversations
FOR SELECT USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.is_admin_or_agent(auth.uid()))
);

CREATE POLICY "Agents and admins can manage conversations in their org" ON public.messenger_conversations
FOR ALL USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.is_admin_or_agent(auth.uid()))
);

-- ============================================
-- MESSENGER_MESSAGES
-- ============================================
DROP POLICY IF EXISTS "Agents and admins can manage messages" ON public.messenger_messages;
DROP POLICY IF EXISTS "Agents and admins can view messages" ON public.messenger_messages;

CREATE POLICY "Agents and admins can view messages" ON public.messenger_messages
FOR SELECT USING (public.is_admin_or_agent(auth.uid()));

CREATE POLICY "Agents and admins can manage messages" ON public.messenger_messages
FOR ALL USING (public.is_admin_or_agent(auth.uid()));

-- ============================================
-- SMS_TEMPLATES
-- ============================================
DROP POLICY IF EXISTS "Agents and admins can manage templates" ON public.sms_templates;
DROP POLICY IF EXISTS "Agents and admins can view SMS templates" ON public.sms_templates;

CREATE POLICY "Agents and admins can view SMS templates in their org" ON public.sms_templates
FOR SELECT USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.is_admin_or_agent(auth.uid()))
);

CREATE POLICY "Agents and admins can manage SMS templates in their org" ON public.sms_templates
FOR ALL USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.is_admin_or_agent(auth.uid()))
);

-- ============================================
-- EXTERNAL_INTEGRATIONS
-- ============================================
DROP POLICY IF EXISTS "Users can manage their own integrations" ON public.external_integrations;
DROP POLICY IF EXISTS "Users can view their own integrations" ON public.external_integrations;

CREATE POLICY "Users can view integrations in their org" ON public.external_integrations
FOR SELECT USING (
  public.is_super_admin(auth.uid()) OR 
  auth.uid() = user_id OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Users can manage integrations in their org" ON public.external_integrations
FOR ALL USING (
  public.is_super_admin(auth.uid()) OR 
  auth.uid() = user_id OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.has_role(auth.uid(), 'admin'))
);

-- ============================================
-- SOCIAL_POSTS_QUEUE
-- ============================================
DROP POLICY IF EXISTS "Agents and admins can manage social posts" ON public.social_posts_queue;
DROP POLICY IF EXISTS "Agents and admins can view social posts" ON public.social_posts_queue;

CREATE POLICY "Agents and admins can view social posts in their org" ON public.social_posts_queue
FOR SELECT USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.is_admin_or_agent(auth.uid()))
);

CREATE POLICY "Agents and admins can manage social posts in their org" ON public.social_posts_queue
FOR ALL USING (
  public.is_super_admin(auth.uid()) OR 
  (public.can_access_org(auth.uid(), organization_id) AND public.is_admin_or_agent(auth.uid()))
);

-- ============================================
-- LEAD_TIMELINE
-- ============================================
DROP POLICY IF EXISTS "Admins and agents can add timeline entries" ON public.lead_timeline;
DROP POLICY IF EXISTS "Users can view timeline for leads they have access to" ON public.lead_timeline;

CREATE POLICY "Users can view timeline in their org" ON public.lead_timeline
FOR SELECT USING (
  public.is_super_admin(auth.uid()) OR 
  user_id = auth.uid() OR 
  public.is_admin_or_agent(auth.uid())
);

CREATE POLICY "Admins and agents can add timeline entries" ON public.lead_timeline
FOR INSERT WITH CHECK (public.is_admin_or_agent(auth.uid()));

-- ============================================
-- CONTRACT_STATUS_HISTORY
-- ============================================
DROP POLICY IF EXISTS "Admins and agents can view status history" ON public.contract_status_history;
DROP POLICY IF EXISTS "Admins and agents can insert status history" ON public.contract_status_history;

CREATE POLICY "Admins and agents can view status history" ON public.contract_status_history
FOR SELECT USING (public.is_admin_or_agent(auth.uid()));

CREATE POLICY "Admins and agents can insert status history" ON public.contract_status_history
FOR INSERT WITH CHECK (public.is_admin_or_agent(auth.uid()));
