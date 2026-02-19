

# Fix: Super Admin Cannot See Seller Leads (Detail or List)

## Root Cause

The `secure_seller_leads` view was created with `security_invoker=on`, which means it executes queries as the calling user (the `authenticated` role). However, the `authenticated` role does **not** have `USAGE` permission on the `crm_private` schema. This means the view silently returns 0 rows for every user, regardless of their role.

- The **list page** shows empty because 0 rows come back
- The **detail page** shows "Failed to load lead details" because `.single()` expects exactly 1 row but gets 0, returning a 406 error

## Fix

**One database migration** with a single SQL statement:

```sql
GRANT USAGE ON SCHEMA crm_private TO authenticated;
```

This allows the `authenticated` role to access the `crm_private` schema through the view. The existing RLS policies on `crm_private.seller_leads` will still enforce proper access control (super admins see all, org members see their org's data, etc.).

No frontend code changes needed.

## Why This Is Safe

- RLS is enabled on `crm_private.seller_leads` with proper policies already in place
- The `Require authentication` restrictive policy ensures unauthenticated access is blocked
- Permissive SELECT policies correctly scope visibility by role (super_admin, org members, record creators)
- The USAGE grant only allows the schema to be referenced; actual row access is still governed by RLS

