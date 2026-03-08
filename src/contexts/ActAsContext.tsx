import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ActAsTarget {
  userId: string;
  displayName: string;
  email: string;
  organizationId?: string;
  organizationName?: string;
  roles: string[];
  orgRole?: string;
}

interface ActAsContextType {
  /** The user being impersonated, or null when not active */
  target: ActAsTarget | null;
  /** Whether act-as mode is currently active */
  isActingAs: boolean;
  /** Start viewing as another user (view-only) */
  startActAs: (target: ActAsTarget) => Promise<void>;
  /** Exit act-as mode */
  stopActAs: () => Promise<void>;
  /** The effective user ID for data queries (target or real user) */
  effectiveUserId: string | null;
  /** Session ID for the current act-as session */
  sessionId: string | null;
}

const ActAsContext = createContext<ActAsContextType | undefined>(undefined);

const MAX_SESSIONS_PER_HOUR = 10;

export function ActAsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [target, setTarget] = useState<ActAsTarget | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const startActAs = useCallback(
    async (newTarget: ActAsTarget) => {
      if (!user) return;

      // Rate limit: check sessions in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("act_as_sessions")
        .select("id", { count: "exact", head: true })
        .eq("actor_id", user.id)
        .gte("started_at", oneHourAgo);

      if (count != null && count >= MAX_SESSIONS_PER_HOUR) {
        toast.error(`Rate limit reached: max ${MAX_SESSIONS_PER_HOUR} act-as sessions per hour.`);
        return;
      }

      // Create audit session
      const { data, error } = await supabase
        .from("act_as_sessions")
        .insert({
          actor_id: user.id,
          target_user_id: newTarget.userId,
          target_display_name: newTarget.displayName,
          organization_id: newTarget.organizationId || null,
        })
        .select("id")
        .single();

      if (error) {
        toast.error("Permission denied: cannot act as this user.");
        return;
      }

      setSessionId(data.id);
      setTarget(newTarget);
      toast.info(`Now viewing as ${newTarget.displayName}`, {
        description: "This is view-only mode. No actions will be performed as this user.",
      });
    },
    [user],
  );

  const stopActAs = useCallback(async () => {
    // Close the session
    if (sessionId) {
      await supabase
        .from("act_as_sessions")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    setTarget(null);
    setSessionId(null);
    toast.info("Returned to your own view.");
  }, [sessionId]);

  const effectiveUserId = target?.userId ?? user?.id ?? null;

  return (
    <ActAsContext.Provider
      value={{
        target,
        isActingAs: !!target,
        startActAs,
        stopActAs,
        effectiveUserId,
        sessionId,
      }}
    >
      {children}
    </ActAsContext.Provider>
  );
}

export function useActAs() {
  const ctx = useContext(ActAsContext);
  if (!ctx) throw new Error("useActAs must be used within ActAsProvider");
  return ctx;
}
