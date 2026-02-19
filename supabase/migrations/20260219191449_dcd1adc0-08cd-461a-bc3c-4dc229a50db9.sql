
-- Fix secure_seller_leads view to allow super_admins to see all leads
CREATE OR REPLACE VIEW public.secure_seller_leads
WITH (security_invoker=on) AS
SELECT 
    id, name, phone, email, address, city, state, zip,
    home_type, year_built, condition, length_ft, width_ft, park_owned,
    lot_rent, asking_price, owed_amount, estimated_value, target_offer,
    status, notes, created_by, created_at, updated_at, organization_id
FROM crm_private.seller_leads sl
WHERE 
    -- Super admins see all leads
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_super_admin = true))
    OR
    -- Org members see their org's leads
    (organization_id = (SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid()));
