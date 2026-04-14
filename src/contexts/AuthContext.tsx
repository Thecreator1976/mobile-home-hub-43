import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "agent" | "viewer" | "super_admin" | "tenant_admin";

interface UserOrganization {
  id: string;
  name: string;
  slug: string;
  is_paid: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  userOrganization: UserOrganization | null;
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
  isLoading: boolean;
  sessionExpired: boolean;
  setSessionExpired: React.Dispatch<React.SetStateAction<boolean>>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const clearSupabaseLocalStorage = () => {
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
  console.log("Cleared Supabase localStorage keys:", keysToRemove);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [userOrganization, setUserOrganization] = useState<UserOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const isSuperAdmin = userRole === "super_admin";
  const isTenantAdmin = userRole === "tenant_admin";

  const resetAppAuthState = () => {
    setUser(null);
    setSession(null);
    setUserRole(null);
    setUserOrganization(null);
  };

  const clearAuthState = async (expired = false) => {
    console.log("Clearing auth state, expired:", expired);
    clearSupabaseLocalStorage();
    resetAppAuthState();

    if (expired) {
      setSessionExpired(true);
    }

    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      console.log("SignOut during cleanup:", error);
    }
  };

  const fetchUserRoleAndOrg = async (userId: string) => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleError) {
        throw roleError;
      }

      const resolvedRole = (roleData?.role as AppRole | undefined) ?? "viewer";

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      let resolvedOrganization: UserOrganization | null = null;

      if (profileData?.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("id, name, slug, is_paid")
          .eq("id", profileData.organization_id)
          .maybeSingle();

        if (orgError) {
          throw orgError;
        }

        if (orgData) {
          resolvedOrganization = {
            id: orgData.id,
            name: orgData.name,
            slug: orgData.slug,
            is_paid: orgData.is_paid ?? false,
          };
        }
      }

      return {
        role: resolvedRole,
        organization: resolvedOrganization,
      };
    } catch (error) {
      console.error("Error fetching user role/org:", error);

      return {
        role: "viewer" as AppRole,
        organization: null,
      };
    }
  };

  useEffect(() => {
    let isMounted = true;

    const applySessionState = async (
      currentSession: Session | null,
      options?: { expired?: boolean }
    ) => {
      if (!isMounted) return;

      setIsLoading(true);

      if (!currentSession?.user) {
        resetAppAuthState();

        if (options?.expired) {
          setSessionExpired(true);
        }

        if (isMounted) {
          setIsLoading(false);
        }

        return;
      }

      setSession(currentSession);
      setUser(currentSession.user);

      const resolved = await fetchUserRoleAndOrg(currentSession.user.id);

      if (!isMounted) return;

      setUserRole(resolved.role);
      setUserOrganization(resolved.organization);
      setIsLoading(false);
    };

    const initializeAuth = async () => {
      try {
        const {
          data: { session: existingSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error, clearing auth state:", error);
          await clearAuthState(true);

          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        await applySessionState(existingSession);
      } catch (error) {
        console.error("Unexpected session error:", error);
        await clearAuthState(true);

        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event);

      if (event === "TOKEN_REFRESHED" && !currentSession) {
        console.warn("Token refresh failed, clearing auth state");
        await clearAuthState(true);

        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      if (event === "SIGNED_OUT") {
        if (!isMounted) return;
        resetAppAuthState();
        setIsLoading(false);
        return;
      }

      await applySessionState(currentSession);
    });

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    setIsLoading(true);

    try {
      await supabase.auth.signOut();
    } finally {
      resetAppAuthState();
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        userOrganization,
        isSuperAdmin,
        isTenantAdmin,
        isLoading,
        sessionExpired,
        setSessionExpired,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
