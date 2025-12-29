import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "agent" | "viewer";
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, isLoading, isSuperAdmin, userOrganization } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login", { replace: true });
      return;
    }

    // Super admins NEVER get payment blocked - they are platform owners
    if (isSuperAdmin) return;

    // Check if organization needs to pay (only for non-super admins)
    if (user && userOrganization && !userOrganization.is_paid) {
      navigate("/payment-required", { replace: true });
    }
  }, [user, isLoading, isSuperAdmin, userOrganization, navigate]);

  if (isLoading) {
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

  return <>{children}</>;
}
