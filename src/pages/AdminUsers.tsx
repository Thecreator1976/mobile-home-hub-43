import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable, Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Shield, Loader2, Building, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { StatCardSkeleton } from "@/components/ui/loading";
import { useAuth } from "@/contexts/AuthContext";
import { useInvitations } from "@/hooks/useInvitations";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface UserWithRole {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  status: string | null;
  created_at: string;
  role: string;
  organization_id: string | null;
  organization_name: string | null;
}

export default function AdminUsers() {
  const { isSuperAdmin, userOrganization } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [newOrganizationId, setNewOrganizationId] = useState<string>("");

  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("agent");
  const { sendInvitation, sending: sendingInvite } = useInvitations();

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .order("name");
      
      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      let profilesQuery = supabase
        .from("profiles")
        .select(`
          *,
          organizations:organization_id (
            id,
            name,
            slug
          )
        `)
        .order("created_at", { ascending: false });

      if (!isSuperAdmin && userOrganization) {
        profilesQuery = profilesQuery.eq("organization_id", userOrganization.id);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          status: profile.status,
          created_at: profile.created_at,
          role: userRole?.role || "viewer",
          organization_id: profile.organization_id,
          organization_name: profile.organizations?.name || null,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin, userOrganization]);

  useEffect(() => {
    fetchUsers();
    if (isSuperAdmin) {
      fetchOrganizations();
    }
  }, [isSuperAdmin, fetchUsers]);

  const handleEditUser = (user: UserWithRole) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setNewStatus(user.status || "pending");
    setNewOrganizationId(user.organization_id || "none");
    setDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedUser) return;

    setUpdating(true);
    try {
      // Update profile status and organization
      const updateData: { 
        status: string; 
        organization_id?: string | null;
      } = {
        status: newStatus,
      };

      // Only super_admin can change organization
      if (isSuperAdmin) {
        updateData.organization_id = newOrganizationId === "none" ? null : (newOrganizationId || null);
      }
      
      const { error: profileError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", selectedUser.user_id);

      if (profileError) throw profileError;

      // Update user role - super_admin can set any role, tenant_admin can only set admin/agent/viewer
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role: newRole as "admin" | "agent" | "viewer" | "super_admin" | "tenant_admin" })
        .eq("user_id", selectedUser.user_id);

      if (roleError) throw roleError;

      toast({
        title: "User Updated",
        description: "User settings have been updated successfully.",
      });

      setDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setDeleting(true);
    try {
      // Delete user role
      await supabase.from("user_roles").delete().eq("user_id", selectedUser.user_id);
      // Delete profile
      await supabase.from("profiles").delete().eq("user_id", selectedUser.user_id);

      toast({
        title: "User Deleted",
        description: `${selectedUser.email} has been removed.`,
      });
      setConfirmDeleteOpen(false);
      setDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenInviteDialog = () => {
    setInviteEmail("");
    setInviteRole("agent");
    setInviteDialogOpen(true);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return;

    const orgId = isSuperAdmin ? null : userOrganization?.id || null;
    const orgName = isSuperAdmin ? "MobileHome CRM" : userOrganization?.name || "MobileHome CRM";

    const result = await sendInvitation({
      email: inviteEmail.trim(),
      organization_id: orgId,
      organization_name: orgName,
      role: inviteRole,
    });

    if (result.success) {
      if (result.inviteUrl) {
        toast({
          title: "Invitation Created - Copy Link",
          description: result.inviteUrl,
          duration: 30000,
        });
        await navigator.clipboard.writeText(result.inviteUrl).catch(() => {});
        toast({
          title: "Link Copied!",
          description: "The invitation link has been copied to your clipboard. Share it with the user manually.",
        });
      }
      setInviteDialogOpen(false);
      setInviteEmail("");
    }
  };

  const columns: Column<UserWithRole>[] = [
    {
      key: "full_name",
      header: "Name",
      sortable: true,
      render: (user) => (
        <div>
          <p className="font-medium">{user.full_name || "No name"}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (user) => {
        return (
          <Badge
            variant={user.role === "admin" ? "default" : user.role === "agent" ? "secondary" : "outline"}
            className={user.role === "super_admin" ? "bg-primary text-primary-foreground" : user.role === "tenant_admin" ? "bg-accent text-accent-foreground" : ""}
          >
            {user.role === "super_admin" ? "Super Admin" : 
             user.role === "tenant_admin" ? "Tenant Admin" : 
             user.role}
          </Badge>
        );
      },
    },
    ...(isSuperAdmin ? [{
      key: "organization_name" as keyof UserWithRole,
      header: "Organization",
      sortable: true,
      render: (user: UserWithRole) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <span>{user.organization_name || "No Organization"}</span>
        </div>
      ),
    }] : []),
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (user) => (
        <span
          className={`status-badge ${
            user.status === "active"
              ? "bg-status-closed/10 text-status-closed"
              : user.status === "suspended"
              ? "bg-status-lost/10 text-status-lost"
              : "bg-status-offer/10 text-status-offer"
          }`}
        >
          {user.status || "pending"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Joined",
      sortable: true,
      render: (user) => format(new Date(user.created_at), "MMM d, yyyy"),
    },
    {
      key: "actions",
      header: "Actions",
      render: (user) => (
        <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
          Edit
        </Button>
      ),
    },
  ];

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    pending: users.filter((u) => u.status === "pending" || !u.status).length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage user roles and approval status</p>
          </div>
          <Button variant="gradient" onClick={handleOpenInviteDialog}>
            <Mail className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <UserCheck className="h-4 w-4 text-status-closed" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-status-closed">{stats.active}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <UserX className="h-4 w-4 text-status-offer" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-status-offer">{stats.pending}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Admins</CardTitle>
                  <Shield className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.admins}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Click on a user to edit their role and approval status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={users}
              columns={columns}
              isLoading={isLoading}
              searchPlaceholder="Search users..."
              emptyMessage="No users found"
            />
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update role and status for {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    {isSuperAdmin && (
                      <>
                        <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {isSuperAdmin 
                    ? "Super Admin: Full platform access. Tenant Admin: Manages their organization. Admin/Agent/Viewer: Standard CRM roles."
                    : "Admins can manage users and access all features. Agents can manage leads and buyers. Viewers have read-only access."}
                </p>
              </div>

              {isSuperAdmin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Organization</label>
                  <Select value={newOrganizationId} onValueChange={setNewOrganizationId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Organization</SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Assign user to an organization to limit their data access.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only active users can access the CRM.
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {isSuperAdmin && (
                <Button
                  variant="destructive"
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="sm:mr-auto"
                >
                  Delete User
                </Button>
              )}
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="gradient" onClick={handleSaveChanges} disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Delete Dialog */}
        <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{selectedUser?.email}</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser} disabled={deleting}>
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invite User Dialog */}
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation to join {isSuperAdmin ? "MobileHome CRM" : userOrganization?.name || "your organization"}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {inviteRole === "agent" && "Agents can manage leads and buyers."}
                  {inviteRole === "viewer" && "Viewers have read-only access."}
                  {inviteRole === "admin" && "Admins can manage users and access all features."}
                  {inviteRole === "tenant_admin" && "Tenant Admins manage their organization."}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="gradient" 
                onClick={handleSendInvite} 
                disabled={sendingInvite || !inviteEmail.trim()}
              >
                {sendingInvite ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
