import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Settings as SettingsIcon, 
  DollarSign, 
  Users, 
  Loader2, 
  Save, 
  Mail, 
  UserPlus,
  Trash2,
  Check,
  Ban,
  Building
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useInvitations } from "@/hooks/useInvitations";
import { format } from "date-fns";

interface ServiceCharges {
  billing_cycle: "monthly" | "yearly";
  monthly_price: number;
  yearly_price: number;
  currency: string;
}

interface OrgSettings {
  service_charges?: ServiceCharges;
}

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  status: string | null;
  role: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export default function Settings() {
  const { userOrganization, isSuperAdmin, isTenantAdmin } = useAuth();
  
  // For super admins, we need to select an org to configure
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  
  // General Settings state
  const [generalDialogOpen, setGeneralDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [serviceCharges, setServiceCharges] = useState<ServiceCharges>({
    billing_cycle: "monthly",
    monthly_price: 49,
    yearly_price: 490,
    currency: "USD",
  });

  // Team Settings state
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [updatingMember, setUpdatingMember] = useState<string | null>(null);
  
  // Invite state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("agent");
  const { sendInvitation, sending: sendingInvite } = useInvitations();

  const canManageSettings = isSuperAdmin || isTenantAdmin;
  
  // Get the effective org ID (user's org or super admin's selected org)
  const effectiveOrgId = isSuperAdmin ? selectedOrgId : userOrganization?.id;
  const effectiveOrgName = isSuperAdmin 
    ? organizations.find(o => o.id === selectedOrgId)?.name 
    : userOrganization?.name;

  // Load organizations for super admin
  useEffect(() => {
    if (isSuperAdmin) {
      const fetchOrgs = async () => {
        const { data } = await supabase
          .from("organizations")
          .select("id, name")
          .order("name");
        
        if (data && data.length > 0) {
          setOrganizations(data);
          // Auto-select first org if none selected
          if (!selectedOrgId) {
            setSelectedOrgId(data[0].id);
          }
        }
      };
      fetchOrgs();
    }
  }, [isSuperAdmin]);

  // Load organization settings
  const loadSettings = async () => {
    if (!effectiveOrgId) return;
    
    setLoadingSettings(true);
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", effectiveOrgId)
        .single();

      if (error) throw error;

      const settings = data?.settings as OrgSettings | null;
      if (settings?.service_charges) {
        setServiceCharges(settings.service_charges);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Save service charges
  const handleSaveServiceCharges = async () => {
    if (!effectiveOrgId) {
      toast({
        title: "Error",
        description: "No organization selected",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    try {
      // First get existing settings
      const { data: existingData } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", effectiveOrgId)
        .single();

      const existingSettings = (existingData?.settings as Record<string, unknown>) || {};
      
      const updatedSettings = {
        ...existingSettings,
        service_charges: {
          billing_cycle: serviceCharges.billing_cycle,
          monthly_price: serviceCharges.monthly_price,
          yearly_price: serviceCharges.yearly_price,
          currency: serviceCharges.currency,
        },
      };

      const { error } = await supabase
        .from("organizations")
        .update({ settings: updatedSettings as never })
        .eq("id", effectiveOrgId);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Service charges have been updated successfully.",
      });
      setGeneralDialogOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save settings";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Load team members
  const loadTeamMembers = async () => {
    if (!effectiveOrgId) return;
    
    setLoadingTeam(true);
    try {
      // Fetch team members
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, email, full_name, status")
        .eq("organization_id", effectiveOrgId);

      if (profilesError) throw profilesError;

      // Get roles
      const userIds = (profiles || []).map(p => p.user_id);
      
      if (userIds.length === 0) {
        setTeamMembers([]);
        setInvitations([]);
        setLoadingTeam(false);
        return;
      }
      
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      if (rolesError) throw rolesError;

      const roleMap = (roles || []).reduce((acc: Record<string, string>, r) => {
        acc[r.user_id] = r.role;
        return acc;
      }, {});

      const members: TeamMember[] = (profiles || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        email: p.email,
        full_name: p.full_name,
        status: p.status,
        role: roleMap[p.user_id] || 'viewer',
      }));

      setTeamMembers(members);

      // Fetch pending invitations
      const { data: invites, error: invitesError } = await supabase
        .from("invitations")
        .select("id, email, role, status, created_at, expires_at")
        .eq("organization_id", effectiveOrgId)
        .eq("status", "pending");

      if (invitesError) throw invitesError;

      setInvitations(invites || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive",
      });
    } finally {
      setLoadingTeam(false);
    }
  };

  // Update member status
  const handleUpdateMemberStatus = async (member: TeamMember, newStatus: string) => {
    setUpdatingMember(member.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", member.id);

      if (error) throw error;

      toast({
        title: "Member Updated",
        description: `${member.email} status changed to ${newStatus}.`,
      });
      loadTeamMembers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update member";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUpdatingMember(null);
    }
  };

  // Update member role
  const handleUpdateMemberRole = async (member: TeamMember, newRole: string) => {
    setUpdatingMember(member.id);
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole as "admin" | "agent" | "viewer" | "tenant_admin" })
        .eq("user_id", member.user_id);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `${member.email} role changed to ${newRole}.`,
      });
      loadTeamMembers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update role";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUpdatingMember(null);
    }
  };

  // Cancel invitation
  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "Invitation Cancelled",
        description: "The invitation has been cancelled.",
      });
      loadTeamMembers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to cancel invitation";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  // Send invitation
  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !effectiveOrgId) return;

    const result = await sendInvitation({
      email: inviteEmail.trim(),
      organization_id: effectiveOrgId,
      organization_name: effectiveOrgName || "Organization",
      role: inviteRole,
    });

    if (result.success) {
      setInviteDialogOpen(false);
      setInviteEmail("");
      loadTeamMembers();
    }
  };

  useEffect(() => {
    if (generalDialogOpen && effectiveOrgId) {
      loadSettings();
    }
  }, [generalDialogOpen, effectiveOrgId]);

  useEffect(() => {
    if (teamDialogOpen && effectiveOrgId) {
      loadTeamMembers();
    }
  }, [teamDialogOpen, effectiveOrgId]);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Pending</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'tenant_admin':
        return <Badge className="bg-accent text-accent-foreground">Tenant Admin</Badge>;
      case 'admin':
        return <Badge variant="default">Admin</Badge>;
      case 'agent':
        return <Badge variant="secondary">Agent</Badge>;
      default:
        return <Badge variant="outline">Viewer</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account and application settings</p>
          </div>
        </div>

        {/* Organization Selector for Super Admins */}
        {isSuperAdmin && organizations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Select Organization</CardTitle>
              <CardDescription>As a super admin, select which organization to configure</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedOrgId || ""}
                onValueChange={setSelectedOrgId}
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Select organization..." />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* General Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                General Settings
              </CardTitle>
              <CardDescription>Service charges and pricing configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Billing Cycle:</span>
                  <Badge variant="outline">{serviceCharges.billing_cycle}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Price:</span>
                  <span className="font-medium">${serviceCharges.monthly_price}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Yearly Price:</span>
                  <span className="font-medium">${serviceCharges.yearly_price}</span>
                </div>
              </div>
              <Button 
                className="mt-4 w-full" 
                onClick={() => setGeneralDialogOpen(true)}
                disabled={!canManageSettings}
              >
                <SettingsIcon className="h-4 w-4 mr-2" />
                Configure
              </Button>
              {!canManageSettings && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Only admins can modify settings
                </p>
              )}
            </CardContent>
          </Card>

          {/* Team Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Settings
              </CardTitle>
              <CardDescription>Manage team members and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Team Members:</span>
                  <Badge variant="outline">{teamMembers.length}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pending Invites:</span>
                  <Badge variant="secondary">{invitations.length}</Badge>
                </div>
              </div>
              <Button 
                className="mt-4 w-full" 
                onClick={() => setTeamDialogOpen(true)}
                disabled={!canManageSettings}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Team
              </Button>
              {!canManageSettings && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Only admins can manage team
                </p>
              )}
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Advanced configuration options</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>
        </div>

        {/* General Settings Dialog */}
        <Dialog open={generalDialogOpen} onOpenChange={setGeneralDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Service Charges Configuration</DialogTitle>
              <DialogDescription>
                Configure your subscription pricing for organizations
              </DialogDescription>
            </DialogHeader>

            {loadingSettings ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Default Billing Cycle</Label>
                  <Select
                    value={serviceCharges.billing_cycle}
                    onValueChange={(value: "monthly" | "yearly") => 
                      setServiceCharges({ ...serviceCharges, billing_cycle: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Monthly Price ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={serviceCharges.monthly_price}
                    onChange={(e) => 
                      setServiceCharges({ 
                        ...serviceCharges, 
                        monthly_price: parseFloat(e.target.value) || 0 
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Yearly Price ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={serviceCharges.yearly_price}
                    onChange={(e) => 
                      setServiceCharges({ 
                        ...serviceCharges, 
                        yearly_price: parseFloat(e.target.value) || 0 
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Yearly is {((1 - serviceCharges.yearly_price / (serviceCharges.monthly_price * 12)) * 100).toFixed(0)}% discount vs monthly
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={serviceCharges.currency}
                    onValueChange={(value) => 
                      setServiceCharges({ ...serviceCharges, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setGeneralDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="gradient" onClick={handleSaveServiceCharges} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Team Settings Dialog */}
        <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Team Management</DialogTitle>
              <DialogDescription>
                Manage team members and invitations for {effectiveOrgName || "your organization"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Invite Button */}
              <div className="flex justify-end">
                <Button variant="gradient" onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </div>

              {/* Team Members */}
              <div>
                <h4 className="text-sm font-medium mb-3">Team Members ({teamMembers.length})</h4>
                {loadingTeam ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No team members yet. Invite someone to get started!
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{member.full_name || 'No name'}</p>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={member.role || 'viewer'}
                              onValueChange={(value) => handleUpdateMemberRole(member, value)}
                              disabled={updatingMember === member.id}
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
                          <TableCell>{getStatusBadge(member.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {member.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleUpdateMemberStatus(member, 'active')}
                                  disabled={updatingMember === member.id}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              )}
                              {member.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-yellow-600 hover:text-yellow-700"
                                  onClick={() => handleUpdateMemberStatus(member, 'suspended')}
                                  disabled={updatingMember === member.id}
                                >
                                  <Ban className="h-4 w-4 mr-1" />
                                  Suspend
                                </Button>
                              )}
                              {member.status === 'suspended' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleUpdateMemberStatus(member, 'active')}
                                  disabled={updatingMember === member.id}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Activate
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Pending Invitations */}
              {invitations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Pending Invitations ({invitations.length})</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((invite) => (
                        <TableRow key={invite.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {invite.email}
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(invite.role)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(invite.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(invite.expires_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleCancelInvitation(invite.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setTeamDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invite Member Dialog */}
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join {effectiveOrgName || "your organization"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer (read-only)</SelectItem>
                    <SelectItem value="agent">Agent (manage leads & buyers)</SelectItem>
                    <SelectItem value="admin">Admin (full access)</SelectItem>
                  </SelectContent>
                </Select>
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
