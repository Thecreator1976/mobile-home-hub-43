import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to clear all Supabase auth tokens from localStorage
const clearSupabaseLocalStorage = () => {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
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

  // Clears all auth state and localStorage tokens
  const clearAuthState = async (expired: boolean = false) => {
    console.log("Clearing auth state, expired:", expired);
    clearSupabaseLocalStorage();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setUserOrganization(null);
    if (expired) {
      setSessionExpired(true);
    }
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      // Ignore signOut errors during cleanup
      console.log("SignOut during cleanup:", e);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event);
        
        // Handle token refresh failures - session exists but refresh failed
        if (event === 'TOKEN_REFRESHED' && !currentSession) {
          console.warn("Token refresh failed, clearing auth state");
          await clearAuthState(true);
          return;
        }

        // Handle sign out events
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setUserOrganization(null);
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Defer role and org fetch to avoid deadlock
        if (currentSession?.user) {
          setTimeout(() => {
            fetchUserRoleAndOrg(currentSession.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setUserOrganization(null);
        }
      }
    );

    // THEN check for existing session with error handling
    supabase.auth.getSession().then(async ({ data: { session: existingSession }, error }) => {
      if (error) {
        console.error("Session error, clearing auth state:", error);
        await clearAuthState(true);
        setIsLoading(false);
        return;
      }
      
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        fetchUserRoleAndOrg(existingSession.user.id);
      }
      setIsLoading(false);
    }).catch(async (error) => {
      console.error("Unexpected session error:", error);
      await clearAuthState(true);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoleAndOrg = async (userId: string) => {
    try {
      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (roleError) {
        console.error("Error fetching user role:", roleError);
        setUserRole("viewer");
      } else {
        setUserRole(roleData?.role as AppRole);
      }

      // Fetch organization via profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("user_id", userId)
        .single();

      if (profileError || !profileData?.organization_id) {
        setUserOrganization(null);
      } else {
        // Fetch organization details including is_paid
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("id, name, slug, is_paid")
          .eq("id", profileData.organization_id)
          .single();

        if (orgError || !orgData) {
          setUserOrganization(null);
        } else {
          setUserOrganization({
            id: orgData.id,
            name: orgData.name,
            slug: orgData.slug,
            is_paid: orgData.is_paid ?? false,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user role/org:", error);
      setUserRole("viewer");
      setUserOrganization(null);
    }
  };

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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setUserOrganization(null);
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
        signUp,
        signIn,
        signOut,
                sessionExpired,
                setSessionExpired,
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
