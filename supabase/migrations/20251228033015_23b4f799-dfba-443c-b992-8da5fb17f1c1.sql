-- Phase 1 Part A: Add enum values and organization_id columns
-- (Functions that use these new values will be added in a separate migration)

-- 1. Add new role values to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tenant_admin';