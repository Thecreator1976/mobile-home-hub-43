import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPermissionContext,
  requirePermission,
  checkRecordAccess,
  type PermissionContext,
  type PermissionResult,
} from "@/lib/permissions";
import type { Database } from "@/integrations/supabase/types";

type TableName = keyof Database["public"]["Tables"];
type CrudAction = "select" | "insert" | "update" | "delete";

/**
 * Hook that provides the current user's permission context
 * Caches the result using React Query
 */
export function usePermissionContext() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["permission-context", user?.id],
    queryFn: getPermissionContext,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Main permissions hook that provides permission checking utilities
 */
export function usePermissions() {
  const { user, userRole, isSuperAdmin, isTenantAdmin, userOrganization } = useAuth();
  const queryClient = useQueryClient();
  const { data: permissionContext, isLoading: contextLoading } = usePermissionContext();
  
  /**
   * Check if user can perform an action on a table
   * Returns a memoized function that can be called with table, action, and optional recordId
   */
  const canPerform = useCallback(
    async (table: TableName, action: CrudAction, recordId?: string): Promise<boolean> => {
      if (!user) return false;
      
      const result = await requirePermission(table, action, recordId);
      return result.allowed;
    },
    [user]
  );
  
  /**
   * Synchronous permission check based on cached context
   * Use this for UI rendering when you don't need fresh server validation
   */
  const canPerformSync = useCallback(
    (table: TableName, action: CrudAction): boolean => {
      if (!user || !userRole) return false;
      if (isSuperAdmin) return true;
      
      // Use cached role data for quick UI decisions
      const rolePermissions: Record<string, Record<CrudAction, boolean>> = {
        super_admin: { select: true, insert: true, update: true, delete: true },
        tenant_admin: { select: true, insert: true, update: true, delete: true },
        admin: { select: true, insert: true, update: true, delete: true },
        agent: { select: true, insert: true, update: true, delete: false },
        viewer: { select: true, insert: false, update: false, delete: false },
      };
      
      return rolePermissions[userRole]?.[action] ?? false;
    },
    [user, userRole, isSuperAdmin]
  );
  
  /**
   * Check if user can access a specific record
   */
  const canAccessRecord = useCallback(
    async (table: TableName, recordId: string): Promise<boolean> => {
      if (!user) return false;
      
      const result = await checkRecordAccess(table, recordId);
      return result.allowed;
    },
    [user]
  );
  
  /**
   * Invalidate permission cache (call after role changes)
   */
  const invalidatePermissions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["permission-context"] });
  }, [queryClient]);
  
  /**
   * Quick check helpers based on role
   */
  const permissions = useMemo(() => ({
    canCreate: (table: TableName) => canPerformSync(table, "insert"),
    canRead: (table: TableName) => canPerformSync(table, "select"),
    canUpdate: (table: TableName) => canPerformSync(table, "update"),
    canDelete: (table: TableName) => canPerformSync(table, "delete"),
  }), [canPerformSync]);
  
  return {
    // Context
    permissionContext,
    isLoading: contextLoading,
    
    // Quick access to auth context values
    isSuperAdmin,
    isTenantAdmin,
    isAdminOrAgent: userRole === "admin" || userRole === "agent",
    userRole,
    organizationId: userOrganization?.id ?? null,
    
    // Permission checking functions
    canPerform,
    canPerformSync,
    canAccessRecord,
    invalidatePermissions,
    
    // Convenience accessors
    permissions,
  };
}

/**
 * Hook for checking a specific permission
 * Useful when you need to check one specific permission
 */
export function useCanPerform(
  table: TableName,
  action: CrudAction,
  recordId?: string
) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["permission", table, action, recordId, user?.id],
    queryFn: async (): Promise<PermissionResult> => {
      return requirePermission(table, action, recordId);
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook for checking record-level access
 */
export function useRecordAccess(table: TableName, recordId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["record-access", table, recordId, user?.id],
    queryFn: async (): Promise<PermissionResult> => {
      if (!recordId) return { allowed: false, reason: "No record ID provided" };
      return checkRecordAccess(table, recordId);
    },
    enabled: !!user && !!recordId,
    staleTime: 60 * 1000, // 1 minute
  });
}
