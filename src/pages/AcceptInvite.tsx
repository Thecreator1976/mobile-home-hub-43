import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Lock, ArrowRight, Loader2, CheckCircle, XCircle, Building, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface InvitationData {
  id: string;
  email: string;
  organization_id: string | null;
  role: string;
  status: string;
  expires_at: string;
  organization_name?: string;
}

export default function AcceptInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided");
      setIsLoading(false);
      return;
    }
    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      // Fetch invitation by token
      const { data: invite, error: inviteError } = await supabase
        .from("invitations")
        .select(`
          id,
          email,
          organization_id,
          role,
          status,
          expires_at,
          organizations:organization_id (
            name
          )
        `)
        .eq("token", token)
        .single();

      if (inviteError || !invite) {
        setError("Invalid or expired invitation link");
        setIsLoading(false);
        return;
      }

      // Check if already used
      if (invite.status !== "pending") {
        setError("This invitation has already been used or revoked");
        setIsLoading(false);
        return;
      }

      // Check if expired
      if (new Date(invite.expires_at) < new Date()) {
        setError("This invitation has expired");
        setIsLoading(false);
        return;
      }

      setInvitation({
        ...invite,
        organization_name: (invite.organizations as any)?.name || "Unknown Organization",
      });
      setIsLoading(false);
    } catch (err) {
      console.error("Error validating invitation:", err);
      setError("An error occurred while validating the invitation");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitation) return;

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: "",
            invited: true,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the profile with organization and pending status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          organization_id: invitation.organization_id,
          status: "pending", // Still needs admin approval
        })
        .eq("user_id", authData.user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
      }

      // Update user role
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role: invitation.role as any })
        .eq("user_id", authData.user.id);

      if (roleError) {
        console.error("Role update error:", roleError);
      }

      // Mark invitation as accepted
      const { error: inviteUpdateError } = await supabase
        .from("invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      if (inviteUpdateError) {
        console.error("Invitation update error:", inviteUpdateError);
      }

      toast({
        title: "Account created!",
        description: "Your account is pending approval. You'll be notified when it's activated.",
      });

      // Navigate to pending approval page
      navigate("/pending-approval", { replace: true });
    } catch (err: any) {
      console.error("Error accepting invitation:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "super_admin": return "Super Admin";
      case "tenant_admin": return "Tenant Admin";
      case "admin": return "Admin";
      case "agent": return "Agent";
      case "viewer": return "Viewer";
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
            <Home className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">MobileHome CRM</h1>
            <p className="text-sm text-muted-foreground">Real Estate Management</p>
          </div>
        </div>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">You're Invited!</CardTitle>
            <CardDescription>
              Set up your password to join the team
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Invitation Details */}
            <div className="space-y-3 mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Organization</p>
                  <p className="font-medium">{invitation?.organization_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge variant="secondary">{getRoleName(invitation?.role || "")}</Badge>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={invitation?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    minLength={6}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    minLength={6}
                  />
                </div>
              </div>
              <Button variant="gradient" className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Accept Invitation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground text-center w-full">
              After creating your account, an administrator will review and approve your access.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
