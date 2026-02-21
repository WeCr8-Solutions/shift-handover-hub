import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GlobalUpdate {
  id: string;
  version_number: string | null;
  revision_number: number;
  title: string;
  summary: string | null;
  full_description: string | null;
  category: "feature" | "improvement" | "bug_fix" | "system_notice" | "security" | "maintenance";
  status: "live" | "scheduled" | "investigating" | "resolved" | "deprecated";
  impact_level: "low" | "medium" | "high" | "critical";
  affected_modules: string[];
  how_it_helps_users: string | null;
  issues_addressed: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  is_visible_to_users: boolean;
  requires_acknowledgement: boolean;
}

export interface UpdateAcknowledgement {
  id: string;
  update_id: string;
  user_id: string;
  acknowledged_at: string;
}

export function useGlobalUpdates() {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<GlobalUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [unacknowledgedRequired, setUnacknowledgedRequired] = useState<GlobalUpdate[]>([]);

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("global_updates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.error("Error fetching global updates:", error);
    } else {
      setUpdates((data || []) as unknown as GlobalUpdate[]);
    }
    setLoading(false);
  }, []);

  const fetchAcknowledgements = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("global_update_acknowledgements")
      .select("update_id")
      .eq("user_id", user.id);
    if (data) {
      setAcknowledgedIds(new Set(data.map((a: any) => a.update_id)));
    }
  }, [user]);

  useEffect(() => {
    fetchUpdates();
    fetchAcknowledgements();
  }, [fetchUpdates, fetchAcknowledgements]);

  // Compute unacknowledged required updates
  useEffect(() => {
    const required = updates.filter(
      (u) =>
        u.is_visible_to_users &&
        u.requires_acknowledgement &&
        u.status === "live" &&
        !acknowledgedIds.has(u.id)
    );
    setUnacknowledgedRequired(required);
  }, [updates, acknowledgedIds]);

  const createUpdate = async (data: Partial<GlobalUpdate>) => {
    const { error } = await supabase
      .from("global_updates")
      .insert({ ...data, created_by: user?.id } as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Update created");
    fetchUpdates();
    return true;
  };

  const editUpdate = async (id: string, data: Partial<GlobalUpdate>) => {
    const { error } = await supabase
      .from("global_updates")
      .update(data as any)
      .eq("id", id);
    if (error) { toast.error(error.message); return false; }
    toast.success("Update saved");
    fetchUpdates();
    return true;
  };

  const deleteUpdate = async (id: string) => {
    const { error } = await supabase
      .from("global_updates")
      .delete()
      .eq("id", id);
    if (error) { toast.error(error.message); return false; }
    toast.success("Update deleted");
    fetchUpdates();
    return true;
  };

  const acknowledgeUpdate = async (updateId: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from("global_update_acknowledgements")
      .insert({ update_id: updateId, user_id: user.id } as any);
    if (error && !error.message.includes("duplicate")) {
      toast.error(error.message);
      return false;
    }
    setAcknowledgedIds((prev) => new Set([...prev, updateId]));
    setUnacknowledgedRequired((prev) => prev.filter((u) => u.id !== updateId));
    return true;
  };

  // Count unread visible updates published after user's last ack
  const unreadCount = updates.filter(
    (u) => u.is_visible_to_users && u.status === "live" && !acknowledgedIds.has(u.id)
  ).length;

  // System status derived from active system_notice entries
  const systemStatus = (() => {
    const activeNotices = updates.filter(
      (u) =>
        u.category === "system_notice" &&
        u.is_visible_to_users &&
        ["investigating", "scheduled"].includes(u.status)
    );
    if (activeNotices.some((n) => ["high", "critical"].includes(n.impact_level)))
      return "outage" as const;
    if (activeNotices.some((n) => n.impact_level === "medium"))
      return "degraded" as const;
    return "operational" as const;
  })();

  const suggestNextVersion = useCallback(() => {
    const latest = updates.find((u) => u.version_number);
    if (!latest?.version_number) return "v1.0.0";
    const match = latest.version_number.match(/v?(\d+)\.(\d+)\.(\d+)/);
    if (!match) return "v1.0.0";
    const [, major, minor, patch] = match.map(Number);
    return { patch: `v${major}.${minor}.${patch + 1}`, minor: `v${major}.${minor + 1}.0`, major: `v${major + 1}.0.0` };
  }, [updates]);

  return {
    updates,
    loading,
    fetchUpdates,
    createUpdate,
    editUpdate,
    deleteUpdate,
    acknowledgeUpdate,
    acknowledgedIds,
    unacknowledgedRequired,
    unreadCount,
    systemStatus,
    suggestNextVersion,
  };
}
