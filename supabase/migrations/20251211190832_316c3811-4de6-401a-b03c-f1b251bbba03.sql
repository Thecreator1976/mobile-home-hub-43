-- Add authentication baseline policies to all tables
-- These RESTRICTIVE policies ensure no anonymous access is possible

-- appointments
CREATE POLICY "Require authentication for appointments"
ON public.appointments AS RESTRICTIVE
FOR ALL USING (auth.uid() IS NOT NULL);

-- buyers
CREATE POLICY "Require authentication for buyers"
ON public.buyers AS RESTRICTIVE
FOR ALL USING (auth.uid() IS NOT NULL);

-- contract_status_history
CREATE POLICY "Require authentication for contract_status_history"
ON public.contract_status_history AS RESTRICTIVE
FOR ALL USING (auth.uid() IS NOT NULL);

-- contract_templates
CREATE POLICY "Require authentication for contract_templates"
ON public.contract_templates AS RESTRICTIVE
FOR ALL USING (auth.uid() IS NOT NULL);

-- contracts
CREATE POLICY "Require authentication for contracts"
ON public.contracts AS RESTRICTIVE
FOR ALL USING (auth.uid() IS NOT NULL);

-- expenses
CREATE POLICY "Require authentication for expenses"
ON public.expenses AS RESTRICTIVE
FOR ALL USING (auth.uid() IS NOT NULL);

-- external_integrations
CREATE POLICY "Require authentication for external_integrations"
ON public.external_integrations AS RESTRICTIVE
FOR ALL USING (auth.uid() IS NOT NULL);

-- lead_timeline
CREATE POLICY "Require authentication for lead_timeline"
ON public.lead_timeline AS RESTRICTIVE
FOR ALL USING (auth.uid() IS NOT NULL);

-- messenger_conversations
CREATE POLICY "Require authentication for messenger_conversations"
ON public.messenger_conversations AS RESTRICTIVE
FOR ALL USING (auth.uid() IS NOT NULL);

-- messenger_messages
CREATE POLICY "Require authentication for messenger_messages"
ON public.messenger_messages AS RESTRICTIVE
FOR ALL USING (auth.uid() IS NOT NULL);

-- personal_advances
CREATE POLICY "Require authentication for personal_advances"
ON public.personal_advances AS RESTRICTIVE
FOR ALL USING (auth.uid() IS NOT NULL);

-- profiles
CREATE POLICY "Require authentication for profiles"
ON public.profiles AS RESTRICTIVE
FOR ALL USING (auth.uid() IS NOT NULL);

-- purchase_orders
CREATE POLICY "Require authentication for purchase_orders"
ON public.purchase_orders AS RESTRICTIVE
FOR ALL USING (auth.uid() IS NOT NULL);

-- seller_leads
CREATE POLICY "Require authentication for seller_leads"
ON public.seller_leads AS RESTRICTIVE
FOR ALL USING (auth.uid() IS NOT NULL);

-- sms_templates
CREATE POLICY "Require authentication for sms_templates"
ON public.sms_templates AS RESTRICTIVE
FOR ALL USING (auth.uid() IS NOT NULL);

-- social_posts_queue
CREATE POLICY "Require authentication for social_posts_queue"
ON public.social_posts_queue AS RESTRICTIVE
FOR ALL USING (auth.uid() IS NOT NULL);

-- user_roles
CREATE POLICY "Require authentication for user_roles"
ON public.user_roles AS RESTRICTIVE
FOR ALL USING (auth.uid() IS NOT NULL);