import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: string | null;
  profileId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  profileId: null,
  loading: true,
  signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Hard absolute timeout — no matter what happens, loading ends after 10s.
  // This prevents the infinite spinner if Supabase keys are undefined or network is dead.
  useEffect(() => {
    const hardTimeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) console.warn("[AuthContext] Hard timeout hit — forcing loading:false");
        return false;
      });
    }, 10000);
    return () => clearTimeout(hardTimeout);
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setUserRole(data?.role ?? "client");
      setProfileId(data?.id ?? null);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setUserRole("client"); // default safe fallback
      setProfileId(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    let hasFetchedProfile = false;

    // A robust, safe database fetcher with a manual timeout
    const fetchProfileSafely = async (userId: string) => {
      if (hasFetchedProfile) return;
      hasFetchedProfile = true;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second max wait for DB
        
        const { data, error } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("user_id", userId)
          .abortSignal(controller.signal)
          .single();
          
        clearTimeout(timeoutId);

        if (error) throw error;
        if (mounted) {
          setUserRole(data?.role ?? "client");
          setProfileId(data?.id ?? null);
        }
      } catch (err) {
        console.error("Failed to fetch profile quickly:", err);
        if (mounted) {
          setUserRole("client"); // MUST fallback to client, never null
          setProfileId(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfileSafely(session.user.id);
        } else {
          setUserRole(null);
          setProfileId(null);
          setLoading(false);
        }
      }
    );

    // React 18 StrictMode can cancel the INITIAL_SESSION event, so we must manually check.
    // Also handles stale tokens from DB restarts by signing out cleanly.
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) {
        // Stale/invalid token – clear it so the user gets a clean login page
        console.warn("Stale session detected, clearing:", error.message);
        await supabase.auth.signOut();
        if (mounted) setLoading(false);
        return;
      }
      if (session?.user) {
        fetchProfileSafely(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, userRole, profileId, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
