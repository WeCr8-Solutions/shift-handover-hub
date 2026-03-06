import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

/**
 * Library definition of a physical machine tool.
 * Travel / envelope dimensions are in millimeters.
 * Part weight is in kilograms.
 * Typical tolerance is in micrometers (µm).
 */
export interface MachineLibraryEntry {
  id: string;
  manufacturer: string;
  model: string;
  machine_type: string;
  platform_category: string;

  // Machine linear travels (mm)
  max_x_travel: number | null;
  max_y_travel: number | null;
  max_z_travel: number | null;

  // Part / work envelope (mm, kg)
  max_part_weight: number | null; // kilograms
  max_part_envelope_length: number | null; // mm
  max_part_envelope_width: number | null; // mm
  max_part_envelope_height: number | null; // mm

  // Configuration / options
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

  // Typical achievable tolerance in micrometers (µm)
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

    const { data, error } = await supabase
      .from<MachineLibraryEntry>("verified_machine_library" as any)
      .select("*")
      .order("manufacturer", { ascending: true })
      .order("model", { ascending: true });

    if (error) {
      // optional: toast here if you want
      setLibrary([]);
    } else {
      setLibrary(data || []);
    }

    setLoading(false);
  }, []);

  const fetchPurchases = useCallback(async () => {
    if (!organizationId) {
      setPurchases([]);
      return;
    }

    const { data, error } = await supabase
      .from<MachinePurchase>("organization_machine_purchases" as any)
      .select("*")
      .eq("organization_id", organizationId);

    if (error) {
      setPurchases([]);
    } else {
      setPurchases(data || []);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const isPurchased = (libraryId: string) =>
    purchases.some((purchase) => purchase.machine_library_id === libraryId && purchase.is_active);

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
      toast({
        title: "Payment error",
        description: e?.message ?? "Failed to initiate payment",
        variant: "destructive",
      });
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

    const { data, error } = await supabase
      .from<StationAssignment>("station_machine_assignments" as any)
      .select("*")
      .eq("station_id", stationId)
      .maybeSingle();

    if (error || !data) {
      setAssignment(null);
      setLoading(false);
      return;
    }

    const { data: purchase } = await supabase
      .from<Pick<MachinePurchase, "machine_library_id">>("organization_machine_purchases" as any)
      .select("machine_library_id")
      .eq("id", data.purchase_id)
      .single();

    if (purchase) {
      const { data: machine } = await supabase
        .from<MachineLibraryEntry>("verified_machine_library" as any)
        .select("*")
        .eq("id", purchase.machine_library_id)
        .single();

      setAssignment({ ...data, machine: machine ?? undefined });
    } else {
      setAssignment(data);
    }

    setLoading(false);
  }, [stationId]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  const assignMachine = async (purchaseId: string) => {
    if (!stationId || !user || !organizationId) {
      return { error: new Error("Missing station, user, or organization") };
    }

    await supabase
      .from("station_machine_assignments" as any)
      .delete()
      .eq("station_id", stationId);

    const { error } = await supabase.from("station_machine_assignments" as any).insert({
      station_id: stationId,
      purchase_id: purchaseId,
      organization_id: organizationId,
      assigned_by: user.id,
    } as StationAssignment);

    if (!error) {
      await fetchAssignment();
    }

    if (error) {
      toast({
        title: "Assignment error",
        description: error.message,
        variant: "destructive",
      });
    }

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

  return {
    assignment,
    loading,
    assignMachine,
    unassignMachine,
    refreshAssignment: fetchAssignment,
  };
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
