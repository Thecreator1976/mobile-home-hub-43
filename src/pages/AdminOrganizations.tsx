import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable, Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Building, Users, Plus, Loader2, MoreHorizontal, Play, Pause, Trash2, UserCog, Check, Ban, UserMinus, Mail } from "lucide-react";
import { useInvitations } from "@/hooks/useInvitations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Organization {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  user_count: number;
  pending_count: number;
}

interface OrgUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  status: string | null;
  role: string | null;
}

export default function AdminOrganizations() {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

  // Manage users dialog state
  const [manageUsersOpen, setManageUsersOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteOrgId, setInviteOrgId] = useState<string | null>(null);
  const [inviteOrgName, setInviteOrgName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const { sendInvitation, sending: sendingInvite } = useInvitations();

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate("/dashboard");
      return;
    }
    fetchOrganizations();
  }, [isSuperAdmin, navigate]);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      const { data: orgs, error: orgsError } = await supabase
        .from("organizations")
        .select("*")
        .order("name");

      if (orgsError) throw orgsError;

      // Get user counts and pending counts per organization
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("organization_id, status");

      if (profilesError) throw profilesError;

      const orgStats = (profiles || []).reduce((acc: Record<string, { total: number; pending: number }>, profile) => {
        if (profile.organization_id) {
          if (!acc[profile.organization_id]) {
            acc[profile.organization_id] = { total: 0, pending: 0 };
          }
          acc[profile.organization_id].total += 1;
          if (profile.status === 'pending') {
            acc[profile.organization_id].pending += 1;
          }
        }
        return acc;
      }, {});

      const orgsWithCounts: Organization[] = (orgs || []).map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        is_active: org.is_active ?? true,
        created_at: org.created_at ?? "",
        user_count: orgStats[org.id]?.total || 0,
        pending_count: orgStats[org.id]?.pending || 0,
      }));

      setOrganizations(orgsWithCounts);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch organizations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      toast({
        title: "Error",
        description: "Organization name is required",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const slug = newOrgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const { error } = await supabase.from("organizations").insert({
        name: newOrgName.trim(),
        slug,
      });

      if (error) throw error;

      toast({
        title: "Organization Created",
        description: `${newOrgName} has been created successfully.`,
      });

      setDialogOpen(false);
      setNewOrgName("");
      fetchOrganizations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleOrgStatus = async (org: Organization) => {
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ is_active: !org.is_active })
        .eq("id", org.id);

      if (error) throw error;

      toast({
        title: org.is_active ? "Organization Suspended" : "Organization Activated",
        description: `${org.name} has been ${org.is_active ? "suspended" : "activated"}.`,
      });

      fetchOrganizations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update organization",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrganization = async () => {
    if (!orgToDelete) return;

    setDeleting(true);
    try {
      // First remove org from all users
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ organization_id: null })
        .eq("organization_id", orgToDelete.id);

      if (profileError) throw profileError;

      // Then delete the organization
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", orgToDelete.id);

      if (error) throw error;

      toast({
        title: "Organization Deleted",
        description: `${orgToDelete.name} has been deleted. Users have been unassigned.`,
      });

      setDeleteDialogOpen(false);
      setOrgToDelete(null);
      fetchOrganizations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete organization",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const fetchOrgUsers = async (orgId: string) => {
    setLoadingUsers(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, email, full_name, status")
        .eq("organization_id", orgId);

      if (profilesError) throw profilesError;

      // Get roles for these users
      const userIds = (profiles || []).map(p => p.user_id);
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      if (rolesError) throw rolesError;

      const roleMap = (roles || []).reduce((acc: Record<string, string>, r) => {
        acc[r.user_id] = r.role;
        return acc;
      }, {});

      const usersWithRoles: OrgUser[] = (profiles || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        email: p.email,
        full_name: p.full_name,
        status: p.status,
        role: roleMap[p.user_id] || 'viewer',
      }));

      setOrgUsers(usersWithRoles);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleManageUsers = (org: Organization) => {
    setSelectedOrg(org);
    setManageUsersOpen(true);
    fetchOrgUsers(org.id);
  };

  const handleUpdateUserStatus = async (user: OrgUser, newStatus: string) => {
    setUpdatingUser(user.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "User Updated",
        description: `${user.email} status changed to ${newStatus}.`,
      });

      if (selectedOrg) fetchOrgUsers(selectedOrg.id);
      fetchOrganizations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleUpdateUserRole = async (user: OrgUser, newRole: "admin" | "agent" | "super_admin" | "tenant_admin" | "viewer") => {
    setUpdatingUser(user.id);
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", user.user_id);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `${user.email} role changed to ${newRole}.`,
      });

      if (selectedOrg) fetchOrgUsers(selectedOrg.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleRemoveFromOrg = async (user: OrgUser) => {
    setUpdatingUser(user.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ organization_id: null })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "User Removed",
        description: `${user.email} has been removed from the organization.`,
      });

      if (selectedOrg) fetchOrgUsers(selectedOrg.id);
      fetchOrganizations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to remove user",
        variant: "destructive",
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Pending</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  const handleInviteTenantAdmin = (org: Organization) => {
    setInviteOrgId(org.id);
    setInviteOrgName(org.name);
    setInviteEmail("");
    setInviteDialogOpen(true);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !inviteOrgId) return;
    
    const result = await sendInvitation({
      email: inviteEmail.trim(),
      organization_id: inviteOrgId,
      organization_name: inviteOrgName,
      role: "tenant_admin",
    });

    if (result.success) {
      setInviteDialogOpen(false);
      setInviteEmail("");
    }
  };

  const columns: Column<Organization>[] = [
    {
      key: "name",
      header: "Organization",
      sortable: true,
      render: (org) => (
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${org.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
            <Building className={`h-5 w-5 ${org.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="font-medium">{org.name}</p>
            <p className="text-sm text-muted-foreground">{org.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "user_count",
      header: "Users",
      sortable: true,
      render: (org) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{org.user_count}</span>
          {org.pending_count > 0 && (
            <Badge variant="secondary" className="ml-2 bg-yellow-500 text-white text-xs">
              {org.pending_count} pending
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      render: (org) => (
        <Badge variant={org.is_active ? "default" : "destructive"}>
          {org.is_active ? "Active" : "Suspended"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      render: (org) => org.created_at ? format(new Date(org.created_at), "MMM d, yyyy") : "-",
    },
    {
      key: "actions" as keyof Organization,
      header: "Actions",
      render: (org) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleInviteTenantAdmin(org)}>
              <Mail className="h-4 w-4 mr-2" />
              Invite Tenant Admin
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleManageUsers(org)}>
              <UserCog className="h-4 w-4 mr-2" />
              Manage Users
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!org.is_active && (
              <DropdownMenuItem 
                className="text-green-600 focus:text-green-600"
                onClick={() => handleToggleOrgStatus(org)}
              >
                <Play className="h-4 w-4 mr-2" />
                Activate
              </DropdownMenuItem>
            )}
            {org.is_active && (
              <DropdownMenuItem 
                className="text-yellow-600 focus:text-yellow-600"
                onClick={() => handleToggleOrgStatus(org)}
              >
                <Pause className="h-4 w-4 mr-2" />
                Suspend
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => {
                setOrgToDelete(org);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Organizations</h1>
            <p className="text-muted-foreground">Manage tenant organizations</p>
          </div>
          <Button variant="gradient" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Organization
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Building className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {organizations.filter((o) => o.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <Building className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {organizations.filter((o) => !o.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {organizations.reduce((sum, o) => sum + o.user_count, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organizations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Organizations</CardTitle>
            <CardDescription>
              Manage tenant organizations - suspend, activate, delete, or manage users within each organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={organizations}
              columns={columns}
              isLoading={isLoading}
              searchPlaceholder="Search organizations..."
              emptyMessage="No organizations found"
            />
          </CardContent>
        </Card>

        {/* Create Organization Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Create a new tenant organization. Users assigned to this organization will only see their org's data.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization Name</label>
                <Input
                  placeholder="e.g., Acme Real Estate"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A URL-friendly slug will be generated automatically.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="gradient" onClick={handleCreateOrganization} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Organization"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Users Dialog */}
        <Dialog open={manageUsersOpen} onOpenChange={setManageUsersOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Manage Users - {selectedOrg?.name}</DialogTitle>
              <DialogDescription>
                View and manage users in this organization. Approve pending users, suspend access, or change roles.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : orgUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users in this organization yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.full_name || 'No name'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role || 'viewer'}
                            onValueChange={(value) => handleUpdateUserRole(user, value as "admin" | "agent" | "super_admin" | "tenant_admin" | "viewer")}
                            disabled={updatingUser === user.id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="agent">Agent</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {user.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleUpdateUserStatus(user, 'active')}
                                disabled={updatingUser === user.id}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            )}
                            {user.status === 'active' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-yellow-600 hover:text-yellow-700"
                                onClick={() => handleUpdateUserStatus(user, 'suspended')}
                                disabled={updatingUser === user.id}
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Suspend
                              </Button>
                            )}
                            {user.status === 'suspended' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleUpdateUserStatus(user, 'active')}
                                disabled={updatingUser === user.id}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Activate
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveFromOrg(user)}
                              disabled={updatingUser === user.id}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setManageUsersOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Organization?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{orgToDelete?.name}</strong> and remove all {orgToDelete?.user_count || 0} users from this organization. 
                Users will not be deleted, but they will no longer be assigned to any organization.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteOrganization}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Organization"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Invite Tenant Admin Dialog */}
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Tenant Admin</DialogTitle>
              <DialogDescription>
                Send an invitation to join <strong>{inviteOrgName}</strong> as a Tenant Admin.
                They will manage users and settings for this organization.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  An invitation email will be sent to this address.
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
