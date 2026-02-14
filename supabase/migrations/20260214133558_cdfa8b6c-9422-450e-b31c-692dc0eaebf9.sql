
-- ============================================================
-- FIX 1: Create writable RPC functions for crm_private.seller_leads
-- ============================================================

-- INSERT function
CREATE OR REPLACE FUNCTION public.insert_seller_lead(
  p_name TEXT,
  p_address TEXT,
  p_asking_price NUMERIC,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_zip TEXT DEFAULT NULL,
  p_home_type home_type DEFAULT 'single',
  p_year_built INTEGER DEFAULT NULL,
  p_condition INTEGER DEFAULT NULL,
  p_length_ft NUMERIC DEFAULT NULL,
  p_width_ft NUMERIC DEFAULT NULL,
  p_park_owned BOOLEAN DEFAULT false,
  p_lot_rent NUMERIC DEFAULT NULL,
  p_owed_amount NUMERIC DEFAULT NULL,
  p_estimated_value NUMERIC DEFAULT NULL,
  p_target_offer NUMERIC DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_org_id UUID;
  v_result JSON;
BEGIN
  -- Get caller's organization
  v_org_id := get_user_org(auth.uid());
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User has no organization assigned';
  END IF;

  -- Verify caller is admin or agent
  IF NOT is_admin_or_agent(auth.uid()) AND NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: insufficient role';
  END IF;

  INSERT INTO crm_private.seller_leads (
    name, address, asking_price, phone, email, city, state, zip,
    home_type, year_built, condition, length_ft, width_ft, park_owned,
    lot_rent, owed_amount, estimated_value, target_offer, notes,
    created_by, org_id, organization_id, status
  ) VALUES (
    p_name, p_address, p_asking_price, p_phone, p_email, p_city, p_state, p_zip,
    p_home_type, p_year_built, p_condition, p_length_ft, p_width_ft, p_park_owned,
    p_lot_rent, p_owed_amount, p_estimated_value, p_target_offer, p_notes,
    auth.uid(), v_org_id, v_org_id, 'new'
  )
  RETURNING row_to_json(crm_private.seller_leads.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- UPDATE function
CREATE OR REPLACE FUNCTION public.update_seller_lead(
  p_id UUID,
  p_name TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_asking_price NUMERIC DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_zip TEXT DEFAULT NULL,
  p_home_type home_type DEFAULT NULL,
  p_year_built INTEGER DEFAULT NULL,
  p_condition INTEGER DEFAULT NULL,
  p_length_ft NUMERIC DEFAULT NULL,
  p_width_ft NUMERIC DEFAULT NULL,
  p_park_owned BOOLEAN DEFAULT NULL,
  p_lot_rent NUMERIC DEFAULT NULL,
  p_owed_amount NUMERIC DEFAULT NULL,
  p_estimated_value NUMERIC DEFAULT NULL,
  p_target_offer NUMERIC DEFAULT NULL,
  p_status lead_status DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_org_id UUID;
  v_result JSON;
BEGIN
  v_org_id := get_user_org(auth.uid());
  
  -- Verify the lead belongs to caller's org (or caller is super_admin)
  IF NOT is_super_admin(auth.uid()) THEN
    IF NOT EXISTS (
      SELECT 1 FROM crm_private.seller_leads
      WHERE id = p_id AND org_id = v_org_id
    ) THEN
      RAISE EXCEPTION 'Permission denied or lead not found';
    END IF;
  END IF;

  UPDATE crm_private.seller_leads SET
    name = COALESCE(p_name, name),
    address = COALESCE(p_address, address),
    asking_price = COALESCE(p_asking_price, asking_price),
    phone = COALESCE(p_phone, phone),
    email = COALESCE(p_email, email),
    city = COALESCE(p_city, city),
    state = COALESCE(p_state, state),
    zip = COALESCE(p_zip, zip),
    home_type = COALESCE(p_home_type, home_type),
    year_built = COALESCE(p_year_built, year_built),
    condition = COALESCE(p_condition, condition),
    length_ft = COALESCE(p_length_ft, length_ft),
    width_ft = COALESCE(p_width_ft, width_ft),
    park_owned = COALESCE(p_park_owned, park_owned),
    lot_rent = COALESCE(p_lot_rent, lot_rent),
    owed_amount = COALESCE(p_owed_amount, owed_amount),
    estimated_value = COALESCE(p_estimated_value, estimated_value),
    target_offer = COALESCE(p_target_offer, target_offer),
    status = COALESCE(p_status, status),
    notes = COALESCE(p_notes, notes),
    updated_at = now()
  WHERE id = p_id
  RETURNING row_to_json(crm_private.seller_leads.*) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  RETURN v_result;
END;
$$;

-- DELETE function
CREATE OR REPLACE FUNCTION public.delete_seller_lead(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  v_org_id := get_user_org(auth.uid());
  
  IF NOT is_super_admin(auth.uid()) THEN
    IF NOT EXISTS (
      SELECT 1 FROM crm_private.seller_leads
      WHERE id = p_id AND org_id = v_org_id
    ) THEN
      RAISE EXCEPTION 'Permission denied or lead not found';
    END IF;
  END IF;

  DELETE FROM crm_private.seller_leads WHERE id = p_id;
END;
$$;

-- ============================================================
-- FIX 2: Assign organizations to unassigned users
-- ============================================================

UPDATE profiles SET organization_id = 'f30b44ce-ed9b-4c44-ba40-01315de2aa6c'
WHERE user_id IN (
  '89099c24-c9ab-4ca6-b5e1-6af2cf51acbb',
  '978b9386-b375-4f9f-bfc8-ea2e0dfce29b',
  '56b99d73-8a40-4805-8d88-54870aa17523'
) AND organization_id IS NULL;

-- Also ensure they're in organization_members
INSERT INTO organization_members (user_id, organization_id, role)
VALUES
  ('89099c24-c9ab-4ca6-b5e1-6af2cf51acbb', 'f30b44ce-ed9b-4c44-ba40-01315de2aa6c', 'admin'),
  ('978b9386-b375-4f9f-bfc8-ea2e0dfce29b', 'f30b44ce-ed9b-4c44-ba40-01315de2aa6c', 'admin'),
  ('56b99d73-8a40-4805-8d88-54870aa17523', 'f30b44ce-ed9b-4c44-ba40-01315de2aa6c', 'admin')
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- ============================================================
-- FIX 3: Fix current_user_access view to recognize tenant_admin
-- ============================================================

CREATE OR REPLACE VIEW public.current_user_access
WITH (security_invoker = on)
AS
WITH user_profile AS (
  SELECT
    p.user_id,
    p.email,
    p.full_name,
    p.is_super_admin,
    p.organization_id,
    COALESCE(
      om.role,
      CASE
        WHEN p.is_super_admin THEN 'super_admin'
        WHEN EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = p.user_id
          AND ur.role IN ('tenant_admin', 'admin', 'agent')
        ) THEN 'admin'
        ELSE 'viewer'
      END
    ) AS organization_role
  FROM profiles p
  LEFT JOIN organization_members om
    ON om.user_id = p.user_id
    AND om.organization_id = p.organization_id
  WHERE p.user_id = auth.uid()
)
SELECT
  user_id,
  email,
  full_name,
  is_super_admin,
  organization_id,
  organization_role,
  CASE
    WHEN is_super_admin THEN 'super_admin'
    WHEN organization_role = 'admin' THEN 'admin'
    WHEN organization_role = 'viewer' THEN 'viewer'
    ELSE 'none'
  END AS access_level
FROM user_profile;
