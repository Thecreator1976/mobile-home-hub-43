-- =============================================
-- SECURITY HARDENING: Fix Cross-Organization Data Leakage
-- =============================================

-- ===========================================
-- Phase 3 & 4: Fix messenger_messages policies
-- ===========================================

-- Drop existing policies that lack org verification
DROP POLICY IF EXISTS "Agents and admins can view messages" ON messenger_messages;
DROP POLICY IF EXISTS "Agents and admins can manage messages" ON messenger_messages;

-- Create org-scoped SELECT policy
CREATE POLICY "Agents and admins can view messages in their org"
ON messenger_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messenger_conversations mc
    WHERE mc.id = messenger_messages.conversation_id
    AND (
      public.is_super_admin(auth.uid()) OR
      (public.can_access_org(auth.uid(), mc.organization_id) AND public.is_admin_or_agent(auth.uid()))
    )
  )
);

-- Create org-scoped ALL policy for mutations
CREATE POLICY "Agents and admins can manage messages in their org"
ON messenger_messages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM messenger_conversations mc
    WHERE mc.id = messenger_messages.conversation_id
    AND (
      public.is_super_admin(auth.uid()) OR
      (public.can_access_org(auth.uid(), mc.organization_id) AND public.is_admin_or_agent(auth.uid()))
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM messenger_conversations mc
    WHERE mc.id = messenger_messages.conversation_id
    AND (
      public.is_super_admin(auth.uid()) OR
      (public.can_access_org(auth.uid(), mc.organization_id) AND public.is_admin_or_agent(auth.uid()))
    )
  )
);

-- ===========================================
-- Fix contract_status_history policies
-- ===========================================

-- Drop existing policies that lack org verification
DROP POLICY IF EXISTS "Admins and agents can view status history" ON contract_status_history;
DROP POLICY IF EXISTS "Admins and agents can insert status history" ON contract_status_history;

-- Create org-scoped SELECT policy
CREATE POLICY "Admins and agents can view status history in their org"
ON contract_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_status_history.contract_id
    AND (
      public.is_super_admin(auth.uid()) OR
      (public.can_access_org(auth.uid(), c.organization_id) AND public.is_admin_or_agent(auth.uid()))
    )
  )
);

-- Create org-scoped INSERT policy
CREATE POLICY "Admins and agents can insert status history in their org"
ON contract_status_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_status_history.contract_id
    AND (
      public.is_super_admin(auth.uid()) OR
      (public.can_access_org(auth.uid(), c.organization_id) AND public.is_admin_or_agent(auth.uid()))
    )
  )
);

-- ===========================================
-- Fix lead_timeline policies
-- ===========================================

-- Drop existing policies that lack org verification
DROP POLICY IF EXISTS "Users can view timeline in their org" ON lead_timeline;
DROP POLICY IF EXISTS "Admins and agents can add timeline entries" ON lead_timeline;

-- Create org-scoped SELECT policy
CREATE POLICY "Users can view timeline in their org"
ON lead_timeline FOR SELECT
USING (
  public.is_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM seller_leads sl
    WHERE sl.id = lead_timeline.seller_lead_id
    AND public.can_access_org(auth.uid(), sl.organization_id)
    AND (sl.created_by = auth.uid() OR public.is_admin_or_agent(auth.uid()))
  )
);

-- Create org-scoped INSERT policy
CREATE POLICY "Admins and agents can add timeline entries in their org"
ON lead_timeline FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM seller_leads sl
    WHERE sl.id = lead_timeline.seller_lead_id
    AND (
      public.is_super_admin(auth.uid()) OR
      (public.can_access_org(auth.uid(), sl.organization_id) AND public.is_admin_or_agent(auth.uid()))
    )
  )
);