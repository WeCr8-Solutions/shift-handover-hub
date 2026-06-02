/**
 * useTravelerSettings — per-organization printable Work Order Traveler template.
 * Loads (or seeds) the row from `organization_traveler_settings` for the active org.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";
import { useMemo } from "react";

export type PaperSize = "letter" | "a4";
export type PriorityColor = "red" | "orange" | "yellow" | "white" | "blue" | "green" | "pink";

export interface TravelerSettings {
  id: string;
  organization_id: string;
  logo_path: string | null;
  company_name_line: string | null;
  footer_text: string | null;
  paper_size: PaperSize;
  show_routing: boolean;
  show_serials: boolean;
  show_signoff: boolean;
  priority_color_map: Record<string, PriorityColor>;
}

const DEFAULTS = {
  paper_size: "letter" as PaperSize,
  show_routing: true,
  show_serials: true,
  show_signoff: true,
  priority_color_map: { critical: "red", urgent: "orange", high: "yellow", normal: "white", low: "blue" } as Record<string, PriorityColor>,
};

export function useTravelerSettings() {
  const { organization } = useOrgContext();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const query = useQuery({
    enabled: !!orgId,
    queryKey: ["traveler-settings", orgId],
    queryFn: async (): Promise<TravelerSettings | null> => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from("organization_traveler_settings" as any)
        .select("*")
        .eq("organization_id", orgId)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return (data as any) ?? null;
    },
  });

  const upsert = useMutation({
    mutationFn: async (patch: Partial<Omit<TravelerSettings, "id" | "organization_id">>) => {
      if (!orgId) throw new Error("No active organization");
      const payload = { organization_id: orgId, ...DEFAULTS, ...(query.data ?? {}), ...patch };
      const { data, error } = await supabase
        .from("organization_traveler_settings" as any)
        .upsert(payload, { onConflict: "organization_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["traveler-settings", orgId] }),
  });

  // Resolve a signed URL for the logo so the print page can render it.
  const logoUrl = useResolvedLogoUrl(query.data?.logo_path ?? null);

  const settings: TravelerSettings = useMemo(
    () => ({
      id: query.data?.id ?? "",
      organization_id: orgId ?? "",
      logo_path: query.data?.logo_path ?? null,
      company_name_line: query.data?.company_name_line ?? organization?.name ?? null,
      footer_text: query.data?.footer_text ?? null,
      paper_size: (query.data?.paper_size as PaperSize) ?? DEFAULTS.paper_size,
      show_routing: query.data?.show_routing ?? DEFAULTS.show_routing,
      show_serials: query.data?.show_serials ?? DEFAULTS.show_serials,
      show_signoff: query.data?.show_signoff ?? DEFAULTS.show_signoff,
      priority_color_map: { ...DEFAULTS.priority_color_map, ...(query.data?.priority_color_map ?? {}) },
    }),
    [query.data, orgId, organization?.name],
  );

  return { settings, logoUrl, isLoading: query.isLoading, upsert };
}

function useResolvedLogoUrl(path: string | null) {
  const q = useQuery({
    enabled: !!path,
    queryKey: ["traveler-logo-url", path],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      if (!path) return null;
      const { data } = await supabase.storage.from("traveler-branding").createSignedUrl(path, 60 * 60);
      return data?.signedUrl ?? null;
    },
  });
  return q.data ?? null;
}
