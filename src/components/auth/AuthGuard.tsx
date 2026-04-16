import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldX } from 'lucide-react';
import Link from 'next/link';

type UserRole = 'viewer' | 'agent' | 'admin' | 'tenant_admin' | 'super_admin';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

// Role hierarchy with numeric levels for easy comparison
const roleHierarchy: Record<UserRole, number> = {
  viewer: 1,
  agent: 2,
  admin: 3,
  tenant_admin: 4,
  super_admin: 5,
};

/**
 * Checks if user's role meets or exceeds the required role level
 * Example: required 'agent' (level 2) is satisfied by agent(2), admin(3), tenant_admin(4), super_admin(5)
 */
const hasRequiredRole = (userRole: UserRole | null, requiredRole?: UserRole): boolean => {
  if (!requiredRole) return true; // No role required
  if (!userRole) return false; // User has no role
  
  const userLevel = roleHierarchy[userRole];
  const requiredLevel = roleHierarchy[requiredRole];
  
  return userLevel >= requiredLevel;
};

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, userRole, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      router.push({
        pathname: '/login',
        query: { returnUrl: router.asPath },
      });
      return;
    }

    // Authenticated but role still loading (async fetch)
    if (userRole === null) {
      setIsAuthorized(null);
      return;
    }

    // Check role-based access
    const hasAccess = hasRequiredRole(userRole, requiredRole);
    
    if (!hasAccess) {
      setIsAuthorized(false);
    } else {
      setIsAuthorized(true);
    }
  }, [isAuthenticated, isLoading, userRole, requiredRole, router]);

  // Still loading auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Role is still being fetched (authenticated but role not loaded yet)
  if (userRole === null && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Access denied - show unauthorized page
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 rounded-full p-4">
              <ShieldX className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. 
            {requiredRole && ` This area requires ${requiredRole} privileges or higher.`}
          </p>
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Return to Dashboard
            </Link>
            <div>
              <Link
                href="/api/auth/logout"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Or switch accounts
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
}
