import { useState, useEffect } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Shield, Loader2, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { StatCardSkeleton } from "@/components/ui/loading";
import { Switch } from "@/components/ui/switch";

interface UserWithRole {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  status: string | null;
  created_at: string;
  role: string;
  is_paid: boolean;
  subscription_tier: string | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newRole, setNewRole] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [newIsPaid, setNewIsPaid] = useState<boolean>(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine profiles with roles
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
          is_paid: profile.is_paid ?? false,
          subscription_tier: profile.subscription_tier,
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
  };

  const handleEditUser = (user: UserWithRole) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setNewStatus(user.status || "pending");
    setNewIsPaid(user.is_paid);
    setDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedUser) return;

    setUpdating(true);
    try {
      // Update profile status and payment
      const updateData: { status: string; is_paid: boolean; subscription_tier?: string; subscription_expires_at?: string | null } = {
        status: newStatus,
        is_paid: newIsPaid,
      };
      
      // Set subscription tier and expiry based on paid status
      if (newIsPaid && !selectedUser.is_paid) {
        updateData.subscription_tier = 'pro';
        updateData.subscription_expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      } else if (!newIsPaid) {
        updateData.subscription_tier = 'free';
        updateData.subscription_expires_at = null;
      }
      
      const { error: profileError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", selectedUser.user_id);

      if (profileError) throw profileError;

      // Update user role
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role: newRole as "admin" | "agent" | "viewer" })
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
      render: (user) => (
        <Badge
          variant={
            user.role === "admin" ? "default" : user.role === "agent" ? "secondary" : "outline"
          }
        >
          {user.role}
        </Badge>
      ),
    },
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
      key: "is_paid",
      header: "Paid",
      sortable: true,
      render: (user) => (
        <Badge variant={user.is_paid ? "default" : "outline"} className={user.is_paid ? "bg-status-closed text-white" : ""}>
          {user.is_paid ? "Paid" : "Free"}
        </Badge>
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
    paid: users.filter((u) => u.is_paid).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user roles and approval status</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {isLoading ? (
            <>
              <StatCardSkeleton />
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
                  <CardTitle className="text-sm font-medium">Paid</CardTitle>
                  <DollarSign className="h-4 w-4 text-status-closed" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-status-closed">{stats.paid}</div>
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
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Admins can manage users and access all features. Agents can manage leads and
                  buyers. Viewers have read-only access.
                </p>
              </div>

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
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Status</label>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Paid Subscription</p>
                    <p className="text-xs text-muted-foreground">
                      {newIsPaid ? "User has full access" : "User needs to subscribe"}
                    </p>
                  </div>
                  <Switch
                    checked={newIsPaid}
                    onCheckedChange={setNewIsPaid}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
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
      </div>
    </DashboardLayout>
  );
}
