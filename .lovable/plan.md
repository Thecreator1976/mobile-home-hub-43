
# Supabase Security Hardening Plan

## Overview
Your project already has a solid security foundation with RLS enabled on all tables and proper security definer functions. This plan focuses on **fixing the identified vulnerabilities** rather than building from scratch.

---

## Phase 1: Enable Leaked Password Protection

Enable the built-in protection that checks passwords against known breach databases.

**Action**: Update authentication settings to enable leaked password protection.

---

## Phase 2: Fix Cross-Organization Data Leakage

Several tables allow any admin/agent to access data regardless of organization. We need to add organization-level checks.

### Tables Requiring Fixes:

1. **messenger_messages** - Currently only checks `is_admin_or_agent()` without organization verification
2. **contract_status_history** - Same issue, agents can see contract history from other organizations  
3. **lead_timeline** - Missing organization scope in SELECT policy

### Solution Approach:
For each table, we'll:
- Join with parent tables to verify organization membership
- Add explicit `can_access_org()` checks where applicable

---

## Phase 3: Strengthen Existing RLS Policies

### messenger_messages Fix:
```sql
-- Current: Only checks role, not organization
-- Fix: Join with messenger_conversations to verify org access
DROP POLICY IF EXISTS "Agents and admins can view messages" ON messenger_messages;

CREATE POLICY "Agents and admins can view messages in their org"
ON messenger_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messenger_conversations mc
    WHERE mc.id = messenger_messages.conversation_id
    AND (
      public.is_super_admin(auth.uid()) OR
      (public.can_access_org(auth.uid(), mc.organization_id) AND public.is_admin_or_agent(auth.uid()))
    )
  )
);
```

### contract_status_history Fix:
```sql
-- Fix: Join with contracts to verify org access
DROP POLICY IF EXISTS "Admins and agents can view status history" ON contract_status_history;

CREATE POLICY "Admins and agents can view status history in their org"
ON contract_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_status_history.contract_id
    AND (
      public.is_super_admin(auth.uid()) OR
      (public.can_access_org(auth.uid(), c.organization_id) AND public.is_admin_or_agent(auth.uid()))
    )
  )
);
```

### lead_timeline Fix:
```sql
-- Fix: Join with seller_leads to verify org access
DROP POLICY IF EXISTS "Users can view timeline in their org" ON lead_timeline;

CREATE POLICY "Users can view timeline in their org"
ON lead_timeline FOR SELECT
USING (
  public.is_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM seller_leads sl
    WHERE sl.id = lead_timeline.seller_lead_id
    AND (
      public.can_access_org(auth.uid(), sl.organization_id) AND
      (sl.created_by = auth.uid() OR public.is_admin_or_agent(auth.uid()))
    )
  )
);
```

---

## Phase 4: Update Mutation Policies for Same Tables

Apply the same organization-scoped fixes to INSERT, UPDATE, DELETE policies on:
- `messenger_messages` (ALL policy)
- `contract_status_history` (INSERT policy)
- `lead_timeline` (INSERT policy)

---

## Phase 5: Security Verification

After applying fixes:

1. **Test cross-organization isolation** - Verify agents in Org A cannot see data from Org B
2. **Test super_admin access** - Confirm super_admin can still access all organizations
3. **Test normal user flows** - Ensure legitimate access still works
4. **Run security scan again** - Verify findings are resolved

---

## Technical Details

### Files That Will Be Created/Modified:
- New SQL migration for RLS policy updates (via database migration tool)
- No application code changes required

### Database Changes Summary:
- 6 RLS policies will be dropped and recreated with organization scoping
- Authentication config update for leaked password protection

### Existing Security Functions (No Changes Needed):
- `is_super_admin()` - Already correctly implemented
- `can_access_org()` - Already correctly implemented
- `is_admin_or_agent()` - Correct, but needs to be paired with org checks
- `has_role()` - Correctly implemented
- `get_user_org()` - Correctly implemented

---

## Risk Assessment

| Change | Risk Level | Mitigation |
|--------|------------|------------|
| Policy updates | Low | Policies are additive, existing access patterns preserved |
| Organization joins | Low | Uses existing organization_id columns |
| Password protection | None | Only affects new signups/password changes |

---

## Expected Outcome

After implementation:
- Cross-organization data leakage eliminated
- Leaked password protection enabled
- Security scan should show 0 errors, reduced warnings
- All legitimate user access preserved
