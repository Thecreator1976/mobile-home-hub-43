import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "agent" | "viewer";
}

type AppRole = "admin" | "agent" | "viewer" | "super_admin" | "tenant_admin";

const ROLE_LEVEL: Record<AppRole, number> = {
  viewer: 1,
  agent: 2,
  admin: 3,
  tenant_admin: 4,
  super_admin: 5,
};

function hasRequiredRole(
  userRole: AppRole | null,
  requiredRole?: "admin" | "agent" | "viewer"
): boolean {
  if (!requiredRole) return true;
  if (!userRole) return false;

  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole];
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const {
    user,
    userRole,
    isLoading,
    isSuperAdmin,
    userOrganization,
  } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (isSuperAdmin) return;

    if (userOrganization && !userOrganization.is_paid) {
      navigate("/payment-required", { replace: true });
      return;
    }

    if (!hasRequiredRole(userRole as AppRole | null, requiredRole)) {
      navigate("/unauthorized", { replace: true });
      return;
    }
  }, [
    user,
    userRole,
    requiredRole,
    isLoading,
    isSuperAdmin,
    userOrganization,
    navigate,
  ]);

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

  if (!isSuperAdmin) {
    if (userOrganization && !userOrganization.is_paid) {
      return null;
    }

    if (!hasRequiredRole(userRole as AppRole | null, requiredRole)) {
      return null;
    }
  }

  return <>{children}</>;
}
