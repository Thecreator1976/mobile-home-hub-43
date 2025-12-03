import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, LogOut, RefreshCw, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function PendingApproval() {
  const { user, signOut, isLoading } = useAuth();
  const [profileStatus, setProfileStatus] = useState<string>("pending");
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
      return;
    }

    // Listen for profile status changes
    if (user) {
      const channel = supabase
        .channel("profile-status")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newStatus = payload.new.status;
            setProfileStatus(newStatus);
            
            if (newStatus === "active") {
              toast({
                title: "Account Approved!",
                description: "Your account has been approved. Redirecting...",
              });
              navigate("/dashboard");
            }
          }
        )
        .subscribe();

      // Initial fetch
      fetchProfileStatus();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isLoading, navigate]);

  const fetchProfileStatus = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("status")
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      setProfileStatus(data.status || "pending");
      
      if (data.status === "active") {
        navigate("/dashboard");
      }
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    await fetchProfileStatus();
    setChecking(false);
    
    if (profileStatus !== "active") {
      toast({
        title: "Still pending",
        description: "Your account is still awaiting approval.",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
              <UserCheck className="h-8 w-8 text-secondary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Account Pending Approval</CardTitle>
          <CardDescription className="text-center">
            Your account is currently under review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-5 w-5 text-secondary" />
              <p className="text-lg font-medium">
                Status: <span className="capitalize text-secondary">{profileStatus}</span>
              </p>
            </div>
            <p className="text-muted-foreground">{user.email}</p>
          </div>

          <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Your account has been created and your email verified. An administrator 
              needs to approve your account before you can access the CRM. This usually 
              takes 1-2 business days.
            </p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Once approved, you'll be able to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Manage seller leads and buyers</li>
              <li>Schedule appointments</li>
              <li>Track expenses and deals</li>
              <li>Generate contracts</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button
            onClick={handleCheckStatus}
            variant="gradient"
            className="w-full"
            disabled={checking}
          >
            {checking ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Approval Status
              </>
            )}
          </Button>

          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
