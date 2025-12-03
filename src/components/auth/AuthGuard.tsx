import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "agent" | "viewer";
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login, preserving the intended destination
      navigate("/login", { state: { from: location.pathname }, replace: true });
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
