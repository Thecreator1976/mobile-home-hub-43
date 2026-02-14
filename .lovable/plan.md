

# Complete Smoke Test Report and Fix Plan

## Critical Issues Found

### BLOCKER 1: Seller Leads INSERT/UPDATE/DELETE Completely Broken

**Root cause:** The `seller_leads` table was moved to the `crm_private` schema, but the API client (PostgREST) only exposes the `public` schema. The code does:

```
supabase.from("seller_leads").insert(...)
```

This targets `public.seller_leads`, which **does not exist**. The table is at `crm_private.seller_leads`.

- **Reads work** because they go through `public.secure_seller_leads` (a view that queries `crm_private.seller_leads`)
- **All writes fail** because there is no write path through the public schema

**Affected operations:** Create Lead, Edit Lead, Delete Lead -- none of these work for ANY user.

### BLOCKER 2: Three Users Have No Organization Assigned

These users cannot create ANY records (leads, buyers, appointments, expenses, contracts, etc.) because the code requires an `organization_id` and all tables have a NOT NULL `org_id` column:

| User | Role | Organization |
|------|------|-------------|
| ktoliphant18@gmail.com | super_admin | NULL |
| ironarmstrucking@gmail.com | tenant_admin | NULL |
| kt.oliphant08@yahoo.com | tenant_admin | NULL |

Only `mobilehomeexpress@yahoo.com` (tenant_admin, SC MOBILE HOME BUYER org) can potentially write data.

### BLOCKER 3: `current_user_access` View Doesn't Recognize tenant_admin Role

The `current_user_access` view determines access level by checking the `organization_members` table. Tenant admins who are not in `organization_members` fall back to `viewer` access level instead of `admin`. This means:
- They cannot see financial fields (phone, email, prices) in `secure_buyers`
- They cannot see contact data in `secure_messenger_conversations`

---

## What Works

| Feature | Status | Notes |
|---------|--------|-------|
| Login/Auth | OK | Authentication works correctly |
| Navigation | OK | All sidebar links navigate properly |
| Dashboard | OK | Stats and charts render |
| Buyers READ | OK | For users with an org |
| Appointments READ | OK | For users with an org |
| Contracts READ | OK | For users with an org |
| Seller Leads READ | Partial | Only via `secure_seller_leads` view; blocked for super_admin by design |

## What Is Broken

| Feature | Status | Root Cause |
|---------|--------|-----------|
| Seller Leads CREATE | BROKEN | Table in `crm_private`, not accessible via API |
| Seller Leads UPDATE | BROKEN | Same as above |
| Seller Leads DELETE | BROKEN | Same as above |
| Buyers CREATE (3 users) | BROKEN | No organization_id in profile |
| Appointments CREATE (3 users) | BROKEN | No organization_id in profile |
| Expenses CREATE (3 users) | BROKEN | No organization_id in profile |
| Contracts CREATE (3 users) | BROKEN | No organization_id in profile |
| Tenant Admin data visibility | DEGRADED | `current_user_access` view returns `viewer` instead of `admin` |

---

## Fix Plan

### Fix 1: Create a writable path for seller_leads (Database Migration)

Create public-schema database functions that allow INSERT, UPDATE, and DELETE on `crm_private.seller_leads` using `SECURITY DEFINER` (so they bypass the schema access restriction). Then update the frontend hook to call these functions via `supabase.rpc()` instead of `supabase.from("seller_leads")`.

**Database changes:**
- Create `public.insert_seller_lead(...)` function (SECURITY DEFINER) that inserts into `crm_private.seller_leads` and enforces RLS checks internally
- Create `public.update_seller_lead(...)` function (SECURITY DEFINER) that updates `crm_private.seller_leads`
- Create `public.delete_seller_lead(...)` function (SECURITY DEFINER) that deletes from `crm_private.seller_leads`

**Frontend changes:**
- Update `src/hooks/useSellerLeads.ts` to use `supabase.rpc("insert_seller_lead", {...})` instead of `supabase.from("seller_leads").insert(...)`
- Same pattern for update and delete mutations

### Fix 2: Assign organizations to unassigned users (Database Migration)

Run a migration to assign the three unassigned users to the existing "SC MOBILE HOME BUYER" organization (or create new organizations if they should be separate).

**Note:** You will need to confirm which organization each user should belong to. The default approach will assign all three to the existing "SC MOBILE HOME BUYER" organization.

### Fix 3: Fix `current_user_access` view (Database Migration)

Update the view to check the `user_roles` table for `tenant_admin` and `admin` roles when the user is not found in `organization_members`:

```sql
COALESCE(
  om.role,
  CASE
    WHEN p.is_super_admin THEN 'super_admin'
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = p.user_id
      AND ur.role IN ('tenant_admin', 'admin')
    ) THEN 'admin'
    ELSE 'viewer'
  END
) AS organization_role
```

---

## Technical Details

### Files to modify:
1. **src/hooks/useSellerLeads.ts** -- Replace direct table operations with RPC function calls
2. **1 database migration** containing:
   - 3 new SECURITY DEFINER functions for seller_leads CRUD
   - Profile organization_id updates for 3 users
   - Updated `current_user_access` view

### Estimated changes:
- 1 frontend file modified
- 1 database migration with ~6 SQL statements
- No edge function changes needed
- No new dependencies

