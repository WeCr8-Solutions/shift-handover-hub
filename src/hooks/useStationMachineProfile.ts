import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface MachineLibraryEntry {
  id: string;
  manufacturer: string;
  model: string;
  machine_type: string;
  platform_category: string;
  max_x_travel: number | null;
  max_y_travel: number | null;
  max_z_travel: number | null;
  max_part_weight: number | null;
  max_part_envelope_length: number | null;
  max_part_envelope_width: number | null;
  max_part_envelope_height: number | null;
  five_axis_simultaneous: boolean;
  fourth_axis: boolean;
  live_tooling: boolean;
  y_axis_turn: boolean;
  sub_spindle: boolean;
  probing: boolean;
  through_spindle_coolant: boolean;
  pallet_pool: boolean;
  bar_feeder: boolean;
  material_capability: string[];
  typical_tolerance: number | null;
  hard_constraints: any[];
  is_verified: boolean;
}

export interface MachinePurchase {
  id: string;
  organization_id: string;
  machine_library_id: string;
  purchased_by: string;
  stripe_payment_id: string | null;
  purchased_at: string;
  is_active: boolean;
}

export interface StationAssignment {
  id: string;
  station_id: string;
  purchase_id: string;
  organization_id: string;
  assigned_by: string;
  assigned_at: string;
}

export function useMachineLibrary(organizationId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [library, setLibrary] = useState<MachineLibraryEntry[]>([]);
  const [purchases, setPurchases] = useState<MachinePurchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("verified_machine_library" as any)
      .select("*")
      .order("manufacturer", { ascending: true })
      .order("model", { ascending: true });
    setLibrary((data as any[]) || []);
    setLoading(false);
  }, []);

  const fetchPurchases = useCallback(async () => {
    if (!organizationId) {
      setPurchases([]);
      return;
    }
    const { data } = await supabase
      .from("organization_machine_purchases" as any)
      .select("*")
      .eq("organization_id", organizationId);
    setPurchases((data as any[]) || []);
  }, [organizationId]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);
  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const isPurchased = (libraryId: string) => purchases.some((p) => p.machine_library_id === libraryId && p.is_active);

  const purchaseMachine = async (libraryId: string) => {
    if (!user || !organizationId) return;
    try {
      const { data, error } = await supabase.functions.invoke("activate-station-context", {
        body: { machine_library_id: libraryId, organization_id: organizationId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (e: any) {
      toast({ title: "Payment Error", description: e.message || "Failed to initiate payment", variant: "destructive" });
    }
  };

  const verifyPurchase = async (libraryId: string) => {
    if (!organizationId) return false;
    try {
      const { data, error } = await supabase.functions.invoke("verify-station-context-payment", {
        body: { machine_library_id: libraryId, organization_id: organizationId },
      });
      if (error) throw error;
      if (data?.activated) {
        await fetchPurchases();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return {
    library,
    purchases,
    loading,
    isPurchased,
    purchaseMachine,
    verifyPurchase,
    refreshPurchases: fetchPurchases,
  };
}

export function useStationMachineAssignment(stationId: string | null, organizationId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<(StationAssignment & { machine?: MachineLibraryEntry }) | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAssignment = useCallback(async () => {
    if (!stationId) {
      setAssignment(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("station_machine_assignments" as any)
      .select("*")
      .eq("station_id", stationId)
      .maybeSingle();

    if (data) {
      // Fetch the library entry via the purchase
      const { data: purchase } = await supabase
        .from("organization_machine_purchases" as any)
        .select("machine_library_id")
        .eq("id", (data as any).purchase_id)
        .single();

      if (purchase) {
        const { data: machine } = await supabase
          .from("verified_machine_library" as any)
          .select("*")
          .eq("id", (purchase as any).machine_library_id)
          .single();

        setAssignment({ ...(data as any), machine: machine as any });
      } else {
        setAssignment(data as any);
      }
    } else {
      setAssignment(null);
    }
    setLoading(false);
  }, [stationId]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  const assignMachine = async (purchaseId: string) => {
    if (!stationId || !user || !organizationId) return { error: new Error("Missing data") };
    // Upsert - remove existing assignment first
    await supabase
      .from("station_machine_assignments" as any)
      .delete()
      .eq("station_id", stationId);
    const { error } = await supabase.from("station_machine_assignments" as any).insert({
      station_id: stationId,
      purchase_id: purchaseId,
      organization_id: organizationId,
      assigned_by: user.id,
    } as any);
    if (!error) await fetchAssignment();
    return { error };
  };

  const unassignMachine = async () => {
    if (!stationId) return;
    await supabase
      .from("station_machine_assignments" as any)
      .delete()
      .eq("station_id", stationId);
    setAssignment(null);
  };

  return { assignment, loading, assignMachine, unassignMachine, refreshAssignment: fetchAssignment };
}

// Keep these exports for backward compatibility
export const MANUFACTURERS = [
  "DMG MORI",
  "HAAS",
  "Mazak",
  "Okuma",
  "Doosan",
  "Hermle",
  "Makino",
  "Hurco",
  "Toyoda",
  "Matsuura",
  "Kitamura",
  "Brother",
  "Nakamura-Tome",
  "Star",
  "Citizen",
  "Tsugami",
  "Hardinge",
  "Flow",
  "OMAX",
  "Trumpf",
  "Amada",
  "Sodick",
  "Mitsubishi",
  "GF Machining",
  "Hexagon",
  "Zeiss",
  "Okamoto",
  "Studer",
  "Other",
] as const;

export const MACHINE_TYPES = [
  "3-Axis Vertical Mill",
  "4-Axis Mill",
  "5-Axis Mill (Trunnion)",
  "5-Axis Mill (Table/Table)",
  "Horizontal Mill",
  "Turn Center (2-Axis)",
  "Turn/Mill (Y-Axis)",
  "Swiss",
  "CMM",
  "Laser",
  "Waterjet",
  "EDM Wire",
  "EDM Sinker",
  "Surface Grinder",
  "Cylindrical Grinder",
  "Other",
] as const;
