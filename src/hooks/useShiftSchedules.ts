import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";

export interface ShiftSchedule {
  id: string;
  organization_id: string | null;
  team_id: string | null;
  shift_name: string;
  shift_code: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  is_active: boolean;
  color: string;
}

export function useShiftSchedules() {
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShifts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      let query = supabase
        .from("shift_schedules")
        .select("*")
        .order("start_time");

      if (organization?.id) {
        query = query.eq("organization_id", organization.id);
      }

      const { data } = await query;

      if (data) {
        setShifts(data as ShiftSchedule[]);
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }

    setLoading(false);
  }, [user, organization?.id]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const createShift = async (shift: Omit<ShiftSchedule, "id">) => {
    if (!user) return { error: "Not authenticated" };

    const { organization_id: _ignored, ...shiftWithoutOrg } = shift as any;
    const { error } = await supabase.from("shift_schedules").insert({
      organization_id: organization?.id || null,
      ...shiftWithoutOrg,
    });

    if (error) return { error: error.message };
    await fetchShifts();
    return { error: null };
  };

  const updateShift = async (id: string, updates: Partial<ShiftSchedule>) => {
    const { error } = await supabase
      .from("shift_schedules")
      .update(updates)
      .eq("id", id);

    if (error) return { error: error.message };
    await fetchShifts();
    return { error: null };
  };

  const deleteShift = async (id: string) => {
    const { error } = await supabase
      .from("shift_schedules")
      .delete()
      .eq("id", id);

    if (error) return { error: error.message };
    await fetchShifts();
    return { error: null };
  };

  return {
    shifts,
    loading,
    refresh: fetchShifts,
    createShift,
    updateShift,
    deleteShift,
  };
}
