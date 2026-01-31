-- =====================================================
-- FIX #1: Storage bucket policies - enforce organization-level isolation
-- =====================================================

-- Drop existing overly permissive policies for documents bucket
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;

-- Drop existing overly permissive policies for receipts bucket
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update receipts" ON storage.objects;

-- Create organization-scoped storage policies

-- Upload: Users can only upload to their org's folder
CREATE POLICY "Users can upload to their org folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('documents', 'receipts') AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = public.get_user_org(auth.uid())::text
);

-- Read: Users can only read from their org's folder (or super admins can read all)
CREATE POLICY "Users can read from their org folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('documents', 'receipts') AND
  auth.uid() IS NOT NULL AND
  (
    (storage.foldername(name))[1] = public.get_user_org(auth.uid())::text OR
    public.is_super_admin(auth.uid())
  )
);

-- Update: Users can only update files in their org's folder
CREATE POLICY "Users can update in their org folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('documents', 'receipts') AND
  auth.uid() IS NOT NULL AND
  (
    (storage.foldername(name))[1] = public.get_user_org(auth.uid())::text OR
    public.is_super_admin(auth.uid())
  )
);

-- Delete: Users can only delete from their org's folder
CREATE POLICY "Users can delete from their org folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('documents', 'receipts') AND
  auth.uid() IS NOT NULL AND
  (
    (storage.foldername(name))[1] = public.get_user_org(auth.uid())::text OR
    public.is_super_admin(auth.uid())
  )
);

-- =====================================================
-- FIX #2: Remove hardcoded email check from buyers table policy
-- This policy uses a hardcoded email which is a security anti-pattern
-- =====================================================

-- Drop the policy with hardcoded email check
DROP POLICY IF EXISTS "Super admin can access all buyers" ON buyers;

-- The existing policies for buyers are already secure:
-- - "Require authentication for buyers" ensures auth.uid() IS NOT NULL
-- - "Users can view buyers in their org" uses proper org check
-- - "Admins and agents can manage buyers in their org" uses proper functions
-- - "Users can access own org buyers" duplicates functionality but is safe

-- =====================================================
-- FIX #3: Verify seller_leads policies are properly restrictive
-- The existing policies already look correct, but let's ensure no anonymous access
-- =====================================================

-- The seller_leads table already has proper policies:
-- - "Require authentication for seller_leads" (RESTRICTIVE)
-- - "Users can view leads in their org or super admins see all"
-- - "Admins and agents can create leads"
-- - "Admins and agents can update leads in their org"
-- - "Admins can delete leads in their org"

-- No changes needed for seller_leads - policies are properly configured