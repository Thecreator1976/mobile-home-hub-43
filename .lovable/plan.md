
# Server-Side Permission Middleware Implementation Plan

## Overview
This plan implements a robust server-side permission checking middleware that validates user access rights using the existing database functions. The middleware will leverage Supabase's RPC calls to verify permissions securely on the server side rather than relying on client-side checks.

## Current State Analysis

### Existing Infrastructure
- **Database Functions Available:**
  - `is_super_admin(_user_id)` - Check if user is a super admin
  - `has_role(_user_id, _role)` - Check if user has a specific role
  - `can_access_org(_user_id, _org_id)` - Check if user can access an organization
  - `is_admin_or_agent(_user_id)` - Check if user is admin or agent
  - `is_tenant_admin_for_org(_user_id, _org_id)` - Check if user is tenant admin for specific org
  - `get_user_org(_user_id)` - Get user's organization ID

- **Role Types:** `admin`, `agent`, `viewer`, `super_admin`, `tenant_admin`

- **Current Auth Context:** Provides `userRole`, `isSuperAdmin`, `isTenantAdmin`, `userOrganization`

### Gap Analysis
- Permission checks are scattered across components
- No centralized middleware for action-based permissions
- No record-level permission verification

## Implementation Plan

### Step 1: Create Permission Middleware Module

Create `src/lib/permissions.ts` with the following capabilities:

**Core Functions:**

```text
+----------------------------------+
|     Permission Middleware        |
+----------------------------------+
| - requireAuth()                  |
| - requirePermission()            |
| - checkRecordAccess()            |
| - getPermissionContext()         |
+----------------------------------+
          |
          v
+----------------------------------+
|     Supabase RPC Functions       |
+----------------------------------+
| - is_super_admin                 |
| - has_role                       |
| - can_access_org                 |
| - is_admin_or_agent             |
| - get_user_org                   |
+----------------------------------+
```

**Function Signatures:**
1. `requireAuth()` - Ensures user is authenticated, returns user data
2. `requirePermission(table, action, recordId?)` - Validates CRUD permissions
3. `checkRecordAccess(table, recordId)` - Verifies user can access specific record
4. `getPermissionContext()` - Returns complete permission context for current user

### Step 2: Define Permission Matrix

Create a permission matrix that maps roles to allowed actions:

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| super_admin | All | All | All | All |
| tenant_admin | Org | Org | Org | Org |
| admin | Org | Org | Org | Org |
| agent | Org | Own | Own | No |
| viewer | Org | No | No | No |

### Step 3: Create Custom React Hook

Create `src/hooks/usePermissions.ts`:
- `usePermissions()` - Hook that provides permission checking functions
- `useCanPerform(table, action, recordId?)` - Hook for specific permission checks
- `useRecordAccess(table, recordId)` - Hook for record-level access

### Step 4: Create Permission Guard Component

Create `src/components/auth/PermissionGuard.tsx`:
- Wraps components that require specific permissions
- Shows appropriate UI when access is denied
- Handles loading states

### Step 5: Update Existing Hooks

Modify data hooks to use permission middleware:
- `useSellerLeads.ts` - Add permission checks for CRUD operations
- `useBuyers.ts` - Add permission checks for CRUD operations
- Other hooks as needed

---

## Technical Details

### File: `src/lib/permissions.ts`

This module will:
1. Export type definitions for permissions
2. Export async functions that call Supabase RPCs
3. Handle caching of permission results (optional, for performance)
4. Return structured permission responses

### File: `src/hooks/usePermissions.ts`

This hook will:
1. Use the AuthContext for user data
2. Call permission functions from `src/lib/permissions.ts`
3. Provide memoized permission checking functions
4. Cache results using React Query

### File: `src/components/auth/PermissionGuard.tsx`

This component will:
1. Accept `table`, `action`, and optional `recordId` props
2. Check permissions on mount
3. Render children if allowed, or fallback UI if denied
4. Support custom denied message

---

## Security Considerations

1. **Server-Side Validation:** All permission checks use Supabase RPC functions that run on the database server with `SECURITY DEFINER`

2. **No Client-Side Trust:** The middleware never trusts client-side role data; it always verifies via RPC

3. **Record-Level Security:** For record access, the middleware queries the database to verify organization ownership

4. **Fail-Secure:** If permission check fails or returns undefined, access is denied by default

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/permissions.ts` | Create | Core permission middleware functions |
| `src/hooks/usePermissions.ts` | Create | React hooks for permission checking |
| `src/components/auth/PermissionGuard.tsx` | Create | Permission wrapper component |
| `src/hooks/useSellerLeads.ts` | Modify | Add permission checks |
| `src/hooks/useBuyers.ts` | Modify | Add permission checks |

---

## Usage Examples

**Using the middleware in a hook:**
```typescript
const { canDelete } = await requirePermission('seller_leads', 'delete', leadId);
if (!canDelete) {
  throw new Error('Permission denied');
}
```

**Using the PermissionGuard component:**
```tsx
<PermissionGuard table="seller_leads" action="delete" recordId={lead.id}>
  <Button onClick={handleDelete}>Delete Lead</Button>
</PermissionGuard>
```

**Using the usePermissions hook:**
```typescript
const { canPerform, isLoading } = usePermissions();
const canEdit = canPerform('seller_leads', 'update', lead.id);
```
