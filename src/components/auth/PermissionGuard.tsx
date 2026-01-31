import { ReactNode } from "react";
import { useCanPerform, useRecordAccess } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ShieldX } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type TableName = keyof Database["public"]["Tables"];
type CrudAction = "select" | "insert" | "update" | "delete";

interface PermissionGuardProps {
  /** The database table to check permissions against */
  table: TableName;
  /** The CRUD action to verify */
  action: CrudAction;
  /** Optional record ID for record-level permission checks */
  recordId?: string;
  /** Content to render when permission is granted */
  children: ReactNode;
  /** Custom content to show when access is denied (default: null - hides content) */
  fallback?: ReactNode;
  /** Show a visual indicator when access is denied instead of hiding */
  showDenied?: boolean;
  /** Custom message for denied state */
  deniedMessage?: string;
  /** Show loading spinner while checking permissions */
  showLoading?: boolean;
}

/**
 * Permission Guard Component
 * 
 * Wraps content that requires specific permissions.
 * Validates permissions server-side via RPC before rendering children.
 * 
 * @example
 * ```tsx
 * <PermissionGuard table="seller_leads" action="delete" recordId={lead.id}>
 *   <Button onClick={handleDelete}>Delete Lead</Button>
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  table,
  action,
  recordId,
  children,
  fallback = null,
  showDenied = false,
  deniedMessage = "You don't have permission to perform this action",
  showLoading = false,
}: PermissionGuardProps) {
  const { user } = useAuth();
  
  // Use record access check if recordId provided, otherwise use action permission
  const permissionQuery = useCanPerform(table, action, recordId);
  const recordQuery = useRecordAccess(table, recordId);
  
  // Determine which query to use
  const query = recordId ? recordQuery : permissionQuery;
  const { data: result, isLoading } = query;
  
  // Not authenticated - don't show anything
  if (!user) {
    return fallback;
  }
  
  // Loading state
  if (isLoading) {
    if (showLoading) {
      return (
        <div className="flex items-center justify-center p-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      );
    }
    // While loading, hide the content by default
    return null;
  }
  
  // Permission denied
  if (!result?.allowed) {
    if (showDenied) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
          <ShieldX className="h-4 w-4" />
          <span>{deniedMessage}</span>
        </div>
      );
    }
    return fallback;
  }
  
  // Permission granted - render children
  return <>{children}</>;
}

/**
 * Simple role-based guard that uses cached auth context
 * Faster than PermissionGuard but doesn't do server-side verification
 */
interface RoleGuardProps {
  /** Roles that are allowed to see the content */
  allowedRoles: Array<"admin" | "agent" | "viewer" | "super_admin" | "tenant_admin">;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user, userRole, isSuperAdmin } = useAuth();
  
  if (!user) {
    return fallback;
  }
  
  // Super admins always have access
  if (isSuperAdmin) {
    return <>{children}</>;
  }
  
  // Check if user's role is in allowed roles
  if (userRole && allowedRoles.includes(userRole)) {
    return <>{children}</>;
  }
  
  return fallback;
}

/**
 * Guard that only shows content to admins (admin, tenant_admin, super_admin)
 */
export function AdminGuard({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["admin", "tenant_admin", "super_admin"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Guard that shows content to admins and agents
 */
export function AgentGuard({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["admin", "agent", "tenant_admin", "super_admin"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}
