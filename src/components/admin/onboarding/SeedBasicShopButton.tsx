import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { woToast } from "@/lib/woToast";

/**
 * One-click button that seeds a sensible default shop layout for the org:
 * Production team + 5 departments (Office, CNC Ops, Welding & Assembly,
 * Shipping & Receiving, Quality / Inspection) + 6 baseline stations +
 * one CNC station per registered piece of equipment.
 * Idempotent — safe to click multiple times.
 */
export function SeedBasicShopButton({
  organizationId,
  engagementId,
  variant = "outline",
  size = "sm",
}: {
  organizationId: string;
  engagementId?: string | null;
  variant?: "outline" | "default" | "secondary";
  size?: "sm" | "default";
}) {
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  async function run() {
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("seed_basic_shop_scaffold" as any, {
        p_org_id: organizationId,
        p_engagement_id: engagementId ?? null,
      });
      if (error) throw error;
      const r = data as { departments?: number; stations_total?: number; equipment_linked?: number };
      woToast.success(
        `Shop scaffold ready — ${r?.departments ?? 5} departments, ${r?.stations_total ?? "?"} stations, ${r?.equipment_linked ?? 0} machines linked`,
      );
      qc.invalidateQueries({ queryKey: ["onboarding-readiness"] });
      qc.invalidateQueries({ queryKey: ["onboarding-checklist"] });
      qc.invalidateQueries({ queryKey: ["onboarding-engagement"] });
      qc.invalidateQueries({ queryKey: ["onboarding-engagements"] });
    } catch (e: any) {
      woToast.error(e?.message ?? "Failed to seed shop scaffold");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant={variant} size={size} onClick={run} disabled={busy} className="gap-2">
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
      Seed basic shop
    </Button>
  );
}
