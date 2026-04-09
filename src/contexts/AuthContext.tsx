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

      if (error) {
        console.error("Profile fetch error:", error);
        throw error;
      }

      if (data) {
        setUserRole(data.role ?? "client");
        setProfileId(data.id ?? null);
      } else {
        console.warn("No profile found for user:", userId);
        setUserRole("client");
        setProfileId(null);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      // Still set a default role so the app can continue functioning
      setUserRole("client");
      setProfileId(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    let hasFetchedProfile = false;

    // A robust, safe database fetcher with timeout and better error handling
    const fetchProfileSafely = async (userId: string) => {
      if (hasFetchedProfile) return;
      hasFetchedProfile = true;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const { data, error } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("user_id", userId)
          .abortSignal(controller.signal)
          .single();

        clearTimeout(timeoutId);

        if (error) {
          console.error("Profile fetch error:", error);
          throw error;
        }

        if (mounted) {
          setUserRole(data?.role ?? "client");
          setProfileId(data?.id ?? null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        // Even on error, set defaults and continue - don't block the app
        if (mounted) {
          setUserRole("client"); // Safe fallback
          setProfileId(null);
          setLoading(false);
        }
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
    // Use a more conservative timeout to avoid prematurely signing out valid users
    const getSessionWithTimeout = async () => {
      try {
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: any }, error: any }>((_, reject) =>
            setTimeout(() => reject(new Error("getSession timed out - may be due to browser restrictions")), 5000)
          )
        ]);
        return result;
      } catch (err: any) {
        console.warn("getSession timeout caught, attempting to read session manually from storage");
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            const keys = Object.keys(window.localStorage);
            const authKey = keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
            if (authKey) {
              const authData = window.localStorage.getItem(authKey);
              if (authData) {
                const session = JSON.parse(authData);
                if (session && (session.access_token || session.provider_token)) {
                  console.log("Successfully recovered session manually");
                  return { data: { session }, error: null };
                }
              }
            }
          }
        } catch (e) {
          console.warn("Manual session recovery failed", e);
        }
        // If recovery fails, throw the original timeout error
        throw err;
      }
    };

    getSessionWithTimeout()
      .then(async ({ data: { session }, error }) => {
        if (!mounted) return;
        if (error) {
          console.warn("Session check timeout:", error.message);
          // Don't automatically sign out - just mark as no session and continue
          // This prevents valid sessions from being destroyed due to slow getSession calls
          setSession(null);
          setUser(null);
          setUserRole(null);
          setProfileId(null);
          setLoading(false);
          return;
        }
        if (session?.user) {
          fetchProfileSafely(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Session initialization error:", err);
        // On critical errors, still don't auto-signout - let user try to sign in again
        if (mounted) {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setProfileId(null);
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
