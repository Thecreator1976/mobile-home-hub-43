import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
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
};

async function fetchUserRoleAndOrg(userId: string): Promise<{
  role: AppRole;
  organization: UserOrganization | null;
}> {
  try {
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (roleError) {
      throw roleError;
    }

    const role = (roleData?.role as AppRole | undefined) ?? "viewer";

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profileData?.organization_id) {
      return {
        role,
        organization: null,
      };
    }

    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, slug, is_paid")
      .eq("id", profileData.organization_id)
      .maybeSingle();

    if (orgError) {
      throw orgError;
    }

    return {
      role,
      organization: orgData
        ? {
            id: orgData.id,
            name: orgData.name,
            slug: orgData.slug,
            is_paid: orgData.is_paid ?? false,
          }
        : null,
    };
  } catch (error) {
    console.error("fetchUserRoleAndOrg error:", error);

    return {
      role: "viewer",
      organization: null,
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [userOrganization, setUserOrganization] = useState<UserOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const isSuperAdmin = userRole === "super_admin";
  const isTenantAdmin = userRole === "tenant_admin";

  const resetState = () => {
    setUser(null);
    setSession(null);
    setUserRole(null);
    setUserOrganization(null);
  };

  const handleResolvedSession = async (
    currentSession: Session | null,
    options?: { markExpired?: boolean }
  ) => {
    setIsLoading(true);

    try {
      if (!currentSession?.user) {
        resetState();

        if (options?.markExpired) {
          setSessionExpired(true);
        }

        return;
      }

      setSession(currentSession);
      setUser(currentSession.user);

      const resolved = await fetchUserRoleAndOrg(currentSession.user.id);

      setUserRole(resolved.role);
      setUserOrganization(resolved.organization);
    } catch (error) {
      console.error("handleResolvedSession error:", error);
      resetState();

      if (options?.markExpired) {
        setSessionExpired(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const {
          data: { session: existingSession },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("getSession error:", error);
          clearSupabaseLocalStorage();
          await handleResolvedSession(null, { markExpired: true });
          return;
        }

        await handleResolvedSession(existingSession);
      } catch (error) {
        if (!mounted) return;
        console.error("bootstrap auth error:", error);
        clearSupabaseLocalStorage();
        await handleResolvedSession(null, { markExpired: true });
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;

      if (event === "TOKEN_REFRESHED" && !currentSession) {
        clearSupabaseLocalStorage();
        void handleResolvedSession(null, { markExpired: true });
        return;
      }

      if (event === "SIGNED_OUT") {
        void handleResolvedSession(null);
        return;
      }

      if (
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION" ||
        event === "USER_UPDATED" ||
        event === "TOKEN_REFRESHED"
      ) {
        void handleResolvedSession(currentSession);
      }
    });

    void bootstrap();

    return () => {
      mounted = false;
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
      clearSupabaseLocalStorage();
      resetState();
    } catch (error) {
      console.error("signOut error:", error);
      clearSupabaseLocalStorage();
      resetState();
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo(
    () => ({
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
    }),
    [
      user,
      session,
      userRole,
      userOrganization,
      isSuperAdmin,
      isTenantAdmin,
      isLoading,
      sessionExpired,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
