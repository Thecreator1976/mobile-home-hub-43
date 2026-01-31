
-- Fix: organizations table has a PERMISSIVE "Require authentication" policy but should be RESTRICTIVE

-- First drop the incorrectly configured policy
DROP POLICY IF EXISTS "Require authentication for organizations" ON organizations;

-- Re-create as RESTRICTIVE policy to properly block anonymous access
CREATE POLICY "Require authentication for organizations"
ON organizations
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL);
