import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function PendingApproval() {
  const navigate = useNavigate();
  const { user, isLoading, signOut } = useAuth();
  const [status, setStatus] = useState<string>("pending");
  const [checking, setChecking] = useState(true);

  const fetchProfileStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("status")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      const profileStatus = profile?.status || "pending";
      setStatus(profileStatus);

      if (profileStatus === "active") {
        toast({
          title: "Access approved",
          description: "Your account has been approved. Welcome!",
        });
        navigate("/dashboard", { replace: true });
        return;
      }

      const channel = supabase
        .channel(`profile-status-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newStatus = payload.new && typeof payload.new === "object" && "status" in payload.new
              ? String(payload.new.status)
              : "pending";

            setStatus(newStatus);

            if (newStatus === "active") {
              toast({
                title: "Access approved",
                description: "Your account has been approved. Welcome!",
              });
              navigate("/dashboard", { replace: true });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error("Error fetching profile status:", error);
      toast({
        title: "Error",
        description: "Failed to check approval status.",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  }, [user?.id, navigate]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user) {
      const cleanupPromise = fetchProfileStatus();

      return () => {
        Promise.resolve(cleanupPromise).then((cleanup) => {
          if (typeof cleanup === "function") {
            cleanup();
          }
        });
      };
    }
  }, [user, isLoading, navigate, fetchProfileStatus]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  if (isLoading || checking) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-12">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-status-offer/10">
                <Clock className="h-8 w-8 text-status-offer" />
              </div>
            </div>
            <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
            <CardDescription>
              Your account has been created and is waiting for administrator approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground mb-2">Current status</p>
              <p className="font-semibold capitalize">{status}</p>
            </div>

            <p className="text-sm text-muted-foreground">
              You will be able to access the CRM once an administrator approves your account.
              This page will update automatically when your status changes.
            </p>

            <div className="flex justify-center">
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
