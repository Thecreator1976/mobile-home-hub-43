import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type TableName = keyof Database["public"]["Tables"];
type CrudAction = "select" | "insert" | "update" | "delete";

export interface PermissionContext {
  userId: string;
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
  isAdminOrAgent: boolean;
  organizationId: string | null;
  role: AppRole | null;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Permission matrix defining what each role can do
 * - "all" = can perform action on all records
 * - "org" = can perform action on organization's records
 * - "own" = can only perform action on own records
 * - "none" = cannot perform action
 */
const PERMISSION_MATRIX: Record<AppRole, Record<CrudAction, "all" | "org" | "own" | "none">> = {
  super_admin: { select: "all", insert: "all", update: "all", delete: "all" },
  tenant_admin: { select: "org", insert: "org", update: "org", delete: "org" },
  admin: { select: "org", insert: "org", update: "org", delete: "org" },
  agent: { select: "org", insert: "org", update: "own", delete: "none" },
  viewer: { select: "org", insert: "none", update: "none", delete: "none" },
};

/**
 * Ensures user is authenticated and returns user data
 * @throws Error if user is not authenticated
 */
export async function requireAuth(): Promise<{ userId: string; email: string }> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error("Authentication required");
  }
  
  return { userId: user.id, email: user.email || "" };
}

/**
 * Gets the complete permission context for the current user
 * All checks are done via Supabase RPC (server-side)
 */
export async function getPermissionContext(): Promise<PermissionContext | null> {
  try {
    const { userId } = await requireAuth();
    
    // Make all RPC calls in parallel for efficiency
    const [
      superAdminResult,
      orgResult,
      adminAgentResult,
      roleResult,
    ] = await Promise.all([
      supabase.rpc("is_super_admin", { _user_id: userId }),
      supabase.rpc("get_user_org", { _user_id: userId }),
      supabase.rpc("is_admin_or_agent", { _user_id: userId }),
      supabase.from("user_roles").select("role").eq("user_id", userId).single(),
    ]);
    
    const isSuperAdmin = superAdminResult.data === true;
    const organizationId = orgResult.data as string | null;
    const isAdminOrAgent = adminAgentResult.data === true;
    const role = roleResult.data?.role as AppRole | null;
    
    // Check if tenant admin for their org
    let isTenantAdmin = false;
    if (organizationId) {
      const tenantAdminResult = await supabase.rpc("is_tenant_admin_for_org", {
        _user_id: userId,
        _org_id: organizationId,
      });
      isTenantAdmin = tenantAdminResult.data === true;
    }
    
    return {
      userId,
      isSuperAdmin,
      isTenantAdmin,
      isAdminOrAgent,
      organizationId,
      role,
    };
  } catch (error) {
    console.error("Failed to get permission context:", error);
    return null;
  }
}

/**
 * Checks if user can perform an action on a table
 * Uses server-side RPC calls for validation
 */
export async function requirePermission(
  table: TableName,
  action: CrudAction,
  recordId?: string
): Promise<PermissionResult> {
  const context = await getPermissionContext();
  
  // Fail-secure: deny if we can't get context
  if (!context) {
    return { allowed: false, reason: "Unable to verify permissions" };
  }
  
  const { userId, isSuperAdmin, role, organizationId } = context;
  
  // Super admins can do everything
  if (isSuperAdmin) {
    return { allowed: true };
  }
  
  // Must have a role
  if (!role) {
    return { allowed: false, reason: "No role assigned" };
  }
  
  // Check permission matrix
  const permissionLevel = PERMISSION_MATRIX[role]?.[action];
  
  if (!permissionLevel || permissionLevel === "none") {
    return { allowed: false, reason: `Role '${role}' cannot perform '${action}' on '${table}'` };
  }
  
  // For "all" permission level, allow immediately
  if (permissionLevel === "all") {
    return { allowed: true };
  }
  
  // For record-specific actions, check record access
  if (recordId && (permissionLevel === "own" || permissionLevel === "org")) {
    const recordAccess = await checkRecordAccess(table, recordId, context);
    if (!recordAccess.allowed) {
      return recordAccess;
    }
  }
  
  // For org-level permissions, verify user has an organization
  if (permissionLevel === "org" && !organizationId) {
    return { allowed: false, reason: "No organization access" };
  }
  
  return { allowed: true };
}

/**
 * Checks if user can access a specific record
 * Verifies record belongs to user's organization
 */
export async function checkRecordAccess(
  table: TableName,
  recordId: string,
  context?: PermissionContext
): Promise<PermissionResult> {
  const permContext = context || await getPermissionContext();
  
  if (!permContext) {
    return { allowed: false, reason: "Unable to verify permissions" };
  }
  
  const { userId, isSuperAdmin, organizationId, role } = permContext;
  
  // Super admins can access everything
  if (isSuperAdmin) {
    return { allowed: true };
  }
  
  // Must have organization
  if (!organizationId) {
    return { allowed: false, reason: "No organization access" };
  }
  
  // Query the record to check organization_id and created_by
  const { data: record, error } = await supabase
    .from(table)
    .select("organization_id, created_by")
    .eq("id", recordId)
    .single();
  
  if (error || !record) {
    return { allowed: false, reason: "Record not found" };
  }
  
  // Check if record belongs to user's organization
  const recordOrgId = (record as { organization_id?: string }).organization_id;
  if (recordOrgId && recordOrgId !== organizationId) {
    return { allowed: false, reason: "Record belongs to different organization" };
  }
  
  // For "own" permission level, also check created_by
  const permissionLevel = role ? PERMISSION_MATRIX[role]?.update : null;
  if (permissionLevel === "own") {
    const recordCreatedBy = (record as { created_by?: string }).created_by;
    if (recordCreatedBy !== userId) {
      return { allowed: false, reason: "Can only modify own records" };
    }
  }
  
  return { allowed: true };
}

/**
 * Quick check for specific roles using RPC
 */
export async function hasRole(role: AppRole): Promise<boolean> {
  try {
    const { userId } = await requireAuth();
    const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: role });
    return data === true;
  } catch {
    return false;
  }
}

/**
 * Quick check for super admin status using RPC
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const { userId } = await requireAuth();
    const { data } = await supabase.rpc("is_super_admin", { _user_id: userId });
    return data === true;
  } catch {
    return false;
  }
}

/**
 * Quick check for admin or agent status using RPC
 */
export async function isAdminOrAgent(): Promise<boolean> {
  try {
    const { userId } = await requireAuth();
    const { data } = await supabase.rpc("is_admin_or_agent", { _user_id: userId });
    return data === true;
  } catch {
    return false;
  }
}

/**
 * Check if user can access a specific organization
 */
export async function canAccessOrg(orgId: string): Promise<boolean> {
  try {
    const { userId } = await requireAuth();
    const { data } = await supabase.rpc("can_access_org", { _user_id: userId, _org_id: orgId });
    return data === true;
  } catch {
    return false;
  }
}
