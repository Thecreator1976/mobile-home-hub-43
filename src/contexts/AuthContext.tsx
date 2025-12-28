import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "agent" | "viewer" | "super_admin" | "tenant_admin";

interface UserOrganization {
  id: string;
  name: string;
  slug: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  userOrganization: UserOrganization | null;
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [userOrganization, setUserOrganization] = useState<UserOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isSuperAdmin = userRole === "super_admin";
  const isTenantAdmin = userRole === "tenant_admin";

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        setSession(session);
        setUser(session?.user ?? null);

        // Defer role and org fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoleAndOrg(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setUserOrganization(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRoleAndOrg(session.user.id);
      }
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
        // Fetch organization details
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("id, name, slug")
          .eq("id", profileData.organization_id)
          .single();

        if (orgError || !orgData) {
          setUserOrganization(null);
        } else {
          setUserOrganization({
            id: orgData.id,
            name: orgData.name,
            slug: orgData.slug,
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
