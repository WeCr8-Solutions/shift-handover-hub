import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface StationMachineProfile {
  id: string;
  station_id: string;
  organization_id: string;
  manufacturer: string;
  model: string | null;
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
  context_active: boolean;
  stripe_payment_id: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

export const MANUFACTURERS = [
  "DMG MORI", "HAAS", "Mazak", "Okuma", "Doosan",
  "Hermle", "Makino", "Hurco", "Toyoda", "Matsuura",
  "Kitamura", "Brother", "Mori Seiki", "Nakamura-Tome",
  "Star", "Citizen", "Tsugami", "Other",
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

export const PLATFORM_CATEGORIES = [
  "HAAS Platform",
  "FANUC Platform",
  "Siemens Platform",
  "Heidenhain Platform",
  "Mazatrol Platform",
  "Mitsubishi Platform",
  "Okuma OSP Platform",
  "Other",
] as const;

export const MATERIALS = [
  "Aluminum", "Steel", "Stainless Steel", "Titanium",
  "Inconel", "Plastics", "Brass", "Copper", "Tool Steel",
  "Cast Iron", "Carbon Fiber", "Other",
] as const;

export function useStationMachineProfile(stationId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<StationMachineProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!stationId || !user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("station_machine_profiles" as any)
      .select("*")
      .eq("station_id", stationId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as any);
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, [stationId, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveProfile = async (
    profileData: Omit<StationMachineProfile, "id" | "created_at" | "updated_at" | "context_active" | "stripe_payment_id" | "activated_at" | "organization_id">
  ) => {
    if (!user) return { error: new Error("Not authenticated") };

    if (profile) {
      const { error } = await supabase
        .from("station_machine_profiles" as any)
        .update(profileData as any)
        .eq("id", profile.id);
      if (!error) await fetchProfile();
      return { error };
    } else {
      const { error } = await supabase
        .from("station_machine_profiles" as any)
        .insert(profileData as any);
      if (!error) await fetchProfile();
      return { error };
    }
  };

  const activateContext = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase.functions.invoke("activate-station-context", {
        body: { station_id: stationId, profile_id: profile.id },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (e: any) {
      toast({
        title: "Payment Error",
        description: e.message || "Failed to initiate payment",
        variant: "destructive",
      });
    }
  };

  const verifyPayment = async () => {
    if (!profile) return false;
    try {
      const { data, error } = await supabase.functions.invoke("verify-station-context-payment", {
        body: { profile_id: profile.id },
      });
      if (error) throw error;
      if (data?.activated) {
        await fetchProfile();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return { profile, loading, saveProfile, activateContext, verifyPayment, refreshProfile: fetchProfile };
}
