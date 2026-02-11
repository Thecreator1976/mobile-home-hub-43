

# Fix: Super Admin Cannot Change User Roles

## Problem
The RLS policy on the `user_roles` table only permits users with the `admin` role to make changes. Super Admins have the role `super_admin`, which does not match the `admin` check -- so the update is silently rejected.

**Current policy:**
```sql
-- "Admins can manage all roles"
USING (has_role(auth.uid(), 'admin'))
```

This blocks `super_admin` and `tenant_admin` users from updating roles.

## Solution
Replace the existing policy with one that allows `super_admin`, `tenant_admin`, and `admin` roles to manage user roles.

## Changes

### 1. Database migration -- Update RLS policy on `user_roles`

Drop the existing policy and create a new one that checks for all admin-level roles:

```sql
DROP POLICY "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'tenant_admin'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'tenant_admin'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);
```

### 2. No frontend changes needed
The existing code in `AdminUsers.tsx` already calls `supabase.from("user_roles").update(...)` correctly -- it's just being blocked by RLS.

## Summary
- **1 database migration** to fix the RLS policy
- **0 code file changes**
- After this, Super Admins and Tenant Admins will be able to change user roles from the admin panel

