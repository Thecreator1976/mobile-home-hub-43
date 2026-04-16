import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Types
export type UserRole = 'viewer' | 'agent' | 'admin' | 'tenant_admin' | 'super_admin';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string;
  isPaid?: boolean;
  status?: string;
  subscriptionExpiresAt?: string;
}

interface Profile {
  id: string;
  user_id: string;
  name: string;
  is_paid: boolean;
  status: string;
  subscription_expires_at: string | null;
}

interface UserRoleRow {
  id: string;
  user_id: string;
  role: UserRole;
  tenant_id: string | null;
}

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setSessionExpired: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const router = useRouter();
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserData(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserRole(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setIsLoading(false);
        return;
      }
      
      await fetchUserData(session.user);
    } catch (error) {
      console.error('Error checking user:', error);
      setIsLoading(false);
    }
  };

  const fetchUserData = async (supabaseUser: SupabaseUser) => {
    try {
      // 1. Fetch user role - using maybeSingle() instead of single()
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .maybeSingle(); // Returns null if no row exists instead of error

      if (roleError) {
        console.error('Error fetching user role:', roleError);
      }

      // 2. Fetch profile - using maybeSingle() instead of single()
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .maybeSingle(); // Returns null if no row exists instead of error

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // 3. Determine role with proper fallback
      let role: UserRole = 'viewer'; // Default fallback
      if (roleData && roleData.role) {
        role = roleData.role;
      } else {
        console.log(`No role found for user ${supabaseUser.id}, defaulting to 'viewer'`);
      }

      // 4. Build user object
      const userObj: User = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        name: profileData?.name || supabaseUser.user_metadata?.name || '',
        role: role,
        tenantId: roleData?.tenant_id || undefined,
        isPaid: profileData?.is_paid || false,
        status: profileData?.status || 'active',
        subscriptionExpiresAt: profileData?.subscription_expires_at || undefined,
      };

      setUser(userObj);
      setUserRole(role);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await fetchUserData(data.user);
        setSessionExpired(false);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setUserRole(null);
      setSessionExpired(false);
      router.push('/login');
    }
  };

  const value: AuthContextType = {
    user,
    userRole,
    isLoading,
    isAuthenticated: !!user,
    sessionExpired,
    login,
    logout,
    setSessionExpired,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
