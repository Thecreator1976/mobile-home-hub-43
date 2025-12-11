import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "agent" | "viewer";
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login, preserving the intended destination
      navigate("/login", { state: { from: location.pathname }, replace: true });
      return;
    }

    if (user) {
      // Check email verification first
      if (!user.email_confirmed_at) {
        navigate("/verify-email", { replace: true });
        setCheckingProfile(false);
        return;
      }

      // Check profile status and payment
      const checkProfile = async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("status, is_paid")
          .eq("user_id", user.id)
          .single();

        if (!error && data) {
          setProfileStatus(data.status);
          
          // Redirect based on profile status
          if (data.status === "pending") {
            navigate("/pending-approval", { replace: true });
            setCheckingProfile(false);
            return;
          }
          
          // Check payment status for active users
          if (data.status === "active" && !data.is_paid) {
            navigate("/payment-required", { replace: true });
            setCheckingProfile(false);
            return;
          }
        }
        setCheckingProfile(false);
      };

      checkProfile();
    }
  }, [user, isLoading, navigate, location]);

  useEffect(() => {
    if (!isLoading && user && requiredRole) {
      const roleHierarchy = { admin: 3, agent: 2, viewer: 1 };
      const userRoleLevel = roleHierarchy[userRole || "viewer"];
      const requiredRoleLevel = roleHierarchy[requiredRole];

      if (userRoleLevel < requiredRoleLevel) {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, userRole, requiredRole, isLoading, navigate]);

  if (isLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if profile is pending approval
  if (profileStatus === "pending") {
    return null; // Will be redirected by useEffect
  }

  return <>{children}</>;
}
