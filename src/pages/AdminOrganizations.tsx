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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, Plus, Loader2 } from "lucide-react";
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
}

export default function AdminOrganizations() {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

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

      // Get user counts per organization
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("organization_id");

      if (profilesError) throw profilesError;

      const orgUserCounts = (profiles || []).reduce((acc: Record<string, number>, profile) => {
        if (profile.organization_id) {
          acc[profile.organization_id] = (acc[profile.organization_id] || 0) + 1;
        }
        return acc;
      }, {});

      const orgsWithCounts: Organization[] = (orgs || []).map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        is_active: org.is_active ?? true,
        created_at: org.created_at ?? "",
        user_count: orgUserCounts[org.id] || 0,
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

  const columns: Column<Organization>[] = [
    {
      key: "name",
      header: "Organization",
      sortable: true,
      render: (org) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Building className="h-5 w-5 text-primary" />
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
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      render: (org) => (
        <Badge variant={org.is_active ? "default" : "secondary"}>
          {org.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      render: (org) => org.created_at ? format(new Date(org.created_at), "MMM d, yyyy") : "-",
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
              <Building className="h-4 w-4 text-status-closed" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-status-closed">
                {organizations.filter((o) => o.is_active).length}
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
              View and manage tenant organizations. Assign users to organizations from the User Management page.
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
      </div>
    </DashboardLayout>
  );
}
