import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getTrafficSource } from "@/lib/utm";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  /** True once the initial session has been restored from storage. Never resets to false. */
  isReady: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isReadyRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as Profile);
    }
  };

  const logActivity = useCallback(
    async (
      userId: string,
      activityType: "login" | "logout" | "signup",
      description: string,
      email?: string,
      displayName?: string
    ) => {
      try {
        await supabase.from("activity_logs").insert({
          user_id: userId,
          user_email: email || null,
          user_display_name: displayName || null,
          activity_type: activityType,
          description,
        });
      } catch (error) {
        console.error("Failed to log activity:", error);
      }
    },
    []
  );

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
          
          // Log login event
          if (event === "SIGNED_IN") {
            logActivity(
              session.user.id,
              "login",
              "User signed in",
              session.user.email,
              session.user.user_metadata?.display_name
            );
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session (initial restoration from storage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
      // Mark as ready — this only happens once and never resets
      if (!isReadyRef.current) {
        isReadyRef.current = true;
        setIsReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [logActivity]);

  // F-7: Periodic session heartbeat — detects revoked/deleted users between token refreshes.
  // Runs every 5 minutes and on tab visibility change. On 401/invalid, force sign-out.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (cancelled) return;
        if (error || !data?.user) {
          console.warn("Session heartbeat: user no longer valid, signing out", error);
          setUser(null);
          setSession(null);
          setProfile(null);
          await supabase.auth.signOut({ scope: "local" }).catch(() => {});
        }
      } catch (e) {
        console.warn("Session heartbeat failed (network):", e);
      }
    };

    const interval = setInterval(checkSession, 5 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void checkSession();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user]);

  const signUp = async (email: string, password: string, displayName: string) => {
    const redirectUrl = `${window.location.origin}/setup?verified=1`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });
    
    // Log signup event and fire GA4 conversion
    if (!error && data.user) {
      await logActivity(
        data.user.id,
        "signup",
        "New user account created",
        email,
        displayName
      );

      // Fire GA4 sign_up conversion event
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "sign_up", {
          method: "email",
          user_id: data.user.id,
          source: getTrafficSource(),
        });
      }
    }
    
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
    // Log logout before signing out (fire-and-forget, don't block on failure)
    if (user) {
      logActivity(
        user.id,
        "logout",
        "User signed out",
        user.email,
        profile?.display_name
      ).catch(() => {});
    }
    
    // Clear sensitive localStorage data on logout to prevent data exposure
    const sensitiveKeys = [
      "handoff-form-draft",
      "selectedTeamId",
    ];
    sensitiveKeys.forEach(key => localStorage.removeItem(key));
    
    // Clear local state first so UI updates immediately
    setUser(null);
    setSession(null);
    setProfile(null);

    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (e) {
      // Session may already be expired/invalid — that's fine, we've cleared local state
      console.warn("Sign out request failed (session may already be expired):", e);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isReady,
        signUp,
        signIn,
        signOut,
        refreshProfile,
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
