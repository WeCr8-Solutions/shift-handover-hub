/**
 * useDataSourceMode
 *
 * Single source of truth for "where does this org's work-order data live?"
 *
 *   - native        → Supabase queue_items (default for orgs with no ERP)
 *   - jobboss_read  → JobBOSS, read-through edge function (no Supabase copy)
 *   - sap_read      → SAP S/4HANA, read-through edge function (no Supabase copy)
 *   - jobboss_write → JobBOSS synced into Supabase queue_items (non-ITAR opt-in)
 *   - sap_write     → SAP synced into Supabase queue_items (non-ITAR opt-in)
 *
 * ITAR/FedRAMP rule (enforced at DB by enforce_itar_read_through trigger):
 *   ITAR-flagged orgs can never be in *_write mode. Edge functions also re-check
 *   via get_erp_persistence_mode() before any queue_items write.
 *
 * UI components should consume this hook to render correct banners, choose
 * between Supabase live-query vs. ERP edge-function fetch, and gate features
 * that only make sense in one mode (e.g. local handoff edits in read_through).
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";

export type DataSourceMode =
  | "native"
  | "jobboss_read"
  | "jobboss_write"
  | "sap_read"
  | "sap_write";

interface State {
  mode: DataSourceMode;
  vendor: "native" | "jobboss" | "sap";
  isReadThrough: boolean;
  isItar: boolean;
  loading: boolean;
}

export function useDataSourceMode(): State {
  const { organization } = useOrgContext();
  const orgId = organization?.id;

  const [state, setState] = useState<State>({
    mode: "native",
    vendor: "native",
    isReadThrough: false,
    isItar: false,
    loading: true,
  });

  useEffect(() => {
    if (!orgId) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    let cancelled = false;
    (async () => {
      const [{ data: conn }, { data: org }] = await Promise.all([
        supabase
          .from("erp_connections_safe" as any)
          .select("erp_vendor, is_active, erp_persistence_mode")
          .eq("organization_id", orgId)
          .maybeSingle(),
        supabase
          .from("organizations")
          .select("requires_us_person_declaration")
          .eq("id", orgId)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      const c = conn as { erp_vendor?: string; is_active?: boolean; erp_persistence_mode?: string } | null;
      const isItar = Boolean((org as any)?.requires_us_person_declaration);

      let mode: DataSourceMode = "native";
      let vendor: State["vendor"] = "native";

      if (c?.is_active && (c.erp_vendor === "jobboss" || c.erp_vendor === "sap")) {
        vendor = c.erp_vendor as "jobboss" | "sap";
        const writeMode = c.erp_persistence_mode === "write_through" && !isItar;
        mode = `${vendor}_${writeMode ? "write" : "read"}` as DataSourceMode;
      }

      setState({
        mode,
        vendor,
        isReadThrough: mode.endsWith("_read"),
        isItar,
        loading: false,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [orgId]);

  return state;
}
