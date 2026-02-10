
-- Fix all foreign keys that reference organizations without ON DELETE action
-- Audit/log tables: SET NULL (preserve logs but remove org reference)
-- Data tables: CASCADE (delete org's data when org is deleted)

-- security_audit_logs: SET NULL
ALTER TABLE public.security_audit_logs DROP CONSTRAINT security_audit_logs_organization_id_fkey;
ALTER TABLE public.security_audit_logs ADD CONSTRAINT security_audit_logs_organization_id_fkey 
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

-- contact_access_audit: SET NULL
ALTER TABLE public.contact_access_audit DROP CONSTRAINT contact_access_audit_organization_id_fkey;
ALTER TABLE public.contact_access_audit ADD CONSTRAINT contact_access_audit_organization_id_fkey 
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

-- messenger_messages: SET NULL
ALTER TABLE public.messenger_messages DROP CONSTRAINT messenger_messages_organization_id_fkey;
ALTER TABLE public.messenger_messages ADD CONSTRAINT messenger_messages_organization_id_fkey 
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

-- org_fk columns (CASCADE - these are the tenant-scoped mandatory org references)
ALTER TABLE public.appointments DROP CONSTRAINT appointments_org_fk;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_org_fk 
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.buyers DROP CONSTRAINT buyers_org_fk;
ALTER TABLE public.buyers ADD CONSTRAINT buyers_org_fk 
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.contract_templates DROP CONSTRAINT contract_templates_org_fk;
ALTER TABLE public.contract_templates ADD CONSTRAINT contract_templates_org_fk 
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.contracts DROP CONSTRAINT contracts_org_fk;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_org_fk 
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.expenses DROP CONSTRAINT expenses_org_fk;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_org_fk 
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.messenger_conversations DROP CONSTRAINT messenger_conversations_org_fk;
ALTER TABLE public.messenger_conversations ADD CONSTRAINT messenger_conversations_org_fk 
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.personal_advances DROP CONSTRAINT personal_advances_org_fk;
ALTER TABLE public.personal_advances ADD CONSTRAINT personal_advances_org_fk 
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.purchase_orders DROP CONSTRAINT purchase_orders_org_fk;
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_org_fk 
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.sms_templates DROP CONSTRAINT sms_templates_org_fk;
ALTER TABLE public.sms_templates ADD CONSTRAINT sms_templates_org_fk 
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.social_posts_queue DROP CONSTRAINT social_posts_queue_org_fk;
ALTER TABLE public.social_posts_queue ADD CONSTRAINT social_posts_queue_org_fk 
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE crm_private.seller_leads DROP CONSTRAINT seller_leads_org_fk;
ALTER TABLE crm_private.seller_leads ADD CONSTRAINT seller_leads_org_fk 
  FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
