import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldX } from "lucide-react";

type UserRole = "viewer" | "agent" | "admin" | "tenant_admin" | "super_admin";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

const roleHierarchy: Record<UserRole, number> = {
  viewer: 1,
  agent: 2,
  admin: 3,
  tenant_admin: 4,
  super_admin: 5,
};

const hasRequiredRole = (userRole: UserRole | null, requiredRole?: UserRole): boolean => {
  if (!requiredRole) return true;
  if (!userRole) return false;
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, userRole, isLoading } = useAuth();
  const isAuthenticated = !!user;
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`, { replace: true });
      return;
    }

    if (userRole === null) {
      setIsAuthorized(null);
      return;
    }

    setIsAuthorized(hasRequiredRole(userRole, requiredRole));
  }, [isAuthenticated, isLoading, userRole, requiredRole, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (userRole === null && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-destructive/10 rounded-full p-4">
              <ShieldX className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page.
            {requiredRole && ` This area requires ${requiredRole} privileges or higher.`}
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthGuard;
