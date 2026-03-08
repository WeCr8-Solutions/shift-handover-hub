import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";

export interface ShopFloorDisplay {
  id: string;
  organization_id: string;
  display_name: string;
  display_mode: "supervisor" | "operator";
  team_ids: string[];
  display_token: string;
  token_expires_at: string;
  refresh_interval_seconds: number;
  auto_rotate_enabled: boolean;
  auto_rotate_interval_seconds: number;
  dark_mode: "auto" | "always" | "never";
  alert_sound_enabled: boolean;
  is_active: boolean;
  last_seen_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useShopFloorDisplays() {
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const [displays, setDisplays] = useState<ShopFloorDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDisplays = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("shop_floor_displays")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false });
    setDisplays((data || []) as unknown as ShopFloorDisplay[]);
    setLoading(false);
  }, [organization?.id]);

  useEffect(() => {
    fetchDisplays();
  }, [fetchDisplays]);

  const createDisplay = async (input: {
    display_name: string;
    display_mode: "supervisor" | "operator";
    team_ids: string[];
    refresh_interval_seconds?: number;
    auto_rotate_enabled?: boolean;
    auto_rotate_interval_seconds?: number;
    dark_mode?: "auto" | "always" | "never";
    alert_sound_enabled?: boolean;
    token_expiry_days?: number;
  }) => {
    if (!user || !organization?.id) return { error: "Not authenticated or no org" };
    const expiryDays = input.token_expiry_days || 30;
    const { error } = await supabase.from("shop_floor_displays").insert({
      organization_id: organization.id,
      display_name: input.display_name,
      display_mode: input.display_mode,
      team_ids: input.team_ids,
      refresh_interval_seconds: input.refresh_interval_seconds || 30,
      auto_rotate_enabled: input.auto_rotate_enabled || false,
      auto_rotate_interval_seconds: input.auto_rotate_interval_seconds || 30,
      dark_mode: input.dark_mode || "auto",
      alert_sound_enabled: input.alert_sound_enabled || false,
      token_expires_at: new Date(Date.now() + expiryDays * 86400000).toISOString(),
      created_by: user.id,
    });
    if (error) return { error: error.message };
    await fetchDisplays();
    return { error: null };
  };

  const updateDisplay = async (id: string, updates: Partial<ShopFloorDisplay>) => {
    const { error } = await supabase
      .from("shop_floor_displays")
      .update(updates)
      .eq("id", id);
    if (error) return { error: error.message };
    await fetchDisplays();
    return { error: null };
  };

  const deleteDisplay = async (id: string) => {
    const { error } = await supabase
      .from("shop_floor_displays")
      .delete()
      .eq("id", id);
    if (error) return { error: error.message };
    await fetchDisplays();
    return { error: null };
  };

  const regenerateToken = async (id: string, expiryDays = 30) => {
    // Generate a new token client-side
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const newToken = Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
    const { error } = await supabase
      .from("shop_floor_displays")
      .update({
        display_token: newToken,
        token_expires_at: new Date(Date.now() + expiryDays * 86400000).toISOString(),
      })
      .eq("id", id);
    if (error) return { error: error.message };
    await fetchDisplays();
    return { error: null };
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    return updateDisplay(id, { is_active: isActive } as any);
  };

  return {
    displays,
    loading,
    refresh: fetchDisplays,
    createDisplay,
    updateDisplay,
    deleteDisplay,
    regenerateToken,
    toggleActive,
  };
}
