import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ActAsMode = "view_only" | "test";

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
  /** 'view_only' for supervisors/org admins, 'test' for SDK admins/developers */
  mode: ActAsMode | null;
  /** Whether the actor can perform actions (only in test mode for devs/admins) */
  canPerformActions: boolean;
  /** Start viewing as another user */
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
  const [mode, setMode] = useState<ActAsMode | null>(null);

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

      // Determine mode: SDK admins/developers get test mode, everyone else view-only
      const { data: platformRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "developer"]);

      const isDevOrAdmin = platformRoles && platformRoles.length > 0;
      const resolvedMode: ActAsMode = isDevOrAdmin ? "test" : "view_only";

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
      setMode(resolvedMode);

      if (resolvedMode === "test") {
        toast.info(`Test mode: acting as ${newTarget.displayName}`, {
          description:
            "You can interact with the app as this user to verify workflows. Actions will be logged.",
        });
      } else {
        toast.info(`Viewing as ${newTarget.displayName}`, {
          description:
            "View-only mode. You can see their perspective but cannot perform actions.",
        });
      }
    },
    [user],
  );

  const stopActAs = useCallback(async () => {
    if (sessionId) {
      await supabase
        .from("act_as_sessions")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    setTarget(null);
    setSessionId(null);
    setMode(null);
    toast.info("Returned to your own view.");
  }, [sessionId]);

  const effectiveUserId = target?.userId ?? user?.id ?? null;
  const canPerformActions = mode === "test";

  return (
    <ActAsContext.Provider
      value={{
        target,
        isActingAs: !!target,
        mode,
        canPerformActions,
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
