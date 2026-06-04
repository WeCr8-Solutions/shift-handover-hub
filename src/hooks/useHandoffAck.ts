import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";

export interface PendingAckHandoff {
  id: string;
  work_order: string;
  part_number: string;
  outgoing_operator_name: string;
  shift: string;
  station_id: string | null;
  machine_id: string;
  process_notes_for_next_shift: string | null;
  handoff_summary: string;
  created_at: string;
}

/**
 * Returns the most-recent unacknowledged handoff(s) for the current user's
 * active stations, plus an `acknowledge` action that stamps the row.
 */
export function useHandoffAck(stationIds: string[]) {
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const [pending, setPending] = useState<PendingAckHandoff[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !organization?.id || stationIds.length === 0) {
      setPending([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Last 24h, station match, not yet acknowledged, not authored by me.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("handoff_records")
      .select(
        "id, work_order, part_number, outgoing_operator_name, shift, station_id, machine_id, process_notes_for_next_shift, handoff_summary, created_at, acknowledged_at, outgoing_operator_id",
      )
      .eq("organization_id", organization.id)
      .in("station_id", stationIds)
      .gte("created_at", since)
      .is("acknowledged_at", null)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("handoff ack fetch error", error);
      setPending([]);
    } else {
      setPending(
        ((data ?? []) as any[])
          .filter((r) => r.outgoing_operator_id !== user.id)
          .map((r) => ({
            id: r.id,
            work_order: r.work_order,
            part_number: r.part_number,
            outgoing_operator_name: r.outgoing_operator_name,
            shift: r.shift,
            station_id: r.station_id,
            machine_id: r.machine_id,
            process_notes_for_next_shift: r.process_notes_for_next_shift,
            handoff_summary: r.handoff_summary,
            created_at: r.created_at,
          })),
      );
    }
    setLoading(false);
  }, [user, organization?.id, stationIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refresh();
  }, [refresh]);

  const acknowledge = useCallback(
    async (handoffId: string) => {
      if (!user) return { error: "Not authenticated" };
      const { error } = await supabase
        .from("handoff_records")
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id,
          acknowledged_by_name:
            (user.user_metadata as any)?.full_name ||
            user.email ||
            "Operator",
        } as any)
        .eq("id", handoffId);
      if (!error) {
        setPending((prev) => prev.filter((p) => p.id !== handoffId));
      }
      return { error: error?.message ?? null };
    },
    [user],
  );

  return { pending, loading, refresh, acknowledge };
}
