/**
 * Concierge org profile quick-edit + setup steps + branding hooks.
 * Wraps the live tables with admin-friendly mutations.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OrgProfileRow {
  id: string;
  name: string;
  slug: string;
  billing_email: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  requires_us_person_declaration: boolean;
  mfa_required: boolean;
  ai_enabled: boolean;
  trial_ends_at: string | null;
  description: string | null;
}

const ORG_PROFILE_PATCH_KEYS: (keyof OrgProfileRow)[] = [
  "name","slug","billing_email","subscription_tier","subscription_status",
  "mfa_required","ai_enabled","description",
];

export function useOrgProfile(orgId: string | null | undefined) {
  const qc = useQueryClient();
  const queryKey = ["concierge-org-profile", orgId];

  const query = useQuery<OrgProfileRow | null>({
    queryKey,
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await (supabase as any)
        .from("organizations")
        .select("id,name,slug,billing_email,subscription_tier,subscription_status,requires_us_person_declaration,mfa_required,ai_enabled,trial_ends_at,description")
        .eq("id", orgId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as OrgProfileRow | null;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<OrgProfileRow>) => {
      if (!orgId) throw new Error("Missing organization");
      const cleaned: Record<string, any> = {};
      for (const k of ORG_PROFILE_PATCH_KEYS) {
        if (k in patch) cleaned[k as string] = (patch as any)[k];
      }
      const { error } = await (supabase as any).from("organizations").update(cleaned).eq("id", orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Organization updated");
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["engagement"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  return { query, update };
}


export interface SetupStepRow {
  step: string;
  completed: boolean;
  completed_at: string;
  completed_by: string | null;
}

const KNOWN_SETUP_STEPS = [
  "org_profile","equipment","stations","users_roles",
  "routing","quality","training","documents","review",
];

export function useOrgSetupSteps(orgId: string | null | undefined) {
  const qc = useQueryClient();
  const queryKey = ["concierge-org-setup-steps", orgId];

  const query = useQuery({
    queryKey,
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return { rows: [], map: new Map<string, SetupStepRow>() };
      const { data, error } = await (supabase as any)
        .from("organization_setup_steps")
        .select("step, completed, completed_at, completed_by")
        .eq("organization_id", orgId);
      if (error) throw error;
      const rows = (data ?? []) as SetupStepRow[];
      return { rows, map: new Map(rows.map((r) => [r.step, r])) };
    },
  });

  const set = useMutation({
    mutationFn: async (input: { step: string; completed: boolean }) => {
      if (!orgId) throw new Error("Missing organization");
      const { error } = await (supabase as any).rpc("concierge_set_setup_step", {
        _org_id: orgId, _step: input.step, _completed: input.completed,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Setup step updated");
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["production-readiness", orgId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  return { query, set, knownSteps: KNOWN_SETUP_STEPS };
}


export interface BrandingRow {
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  login_background_url: string | null;
  company_tagline: string | null;
  support_email: string | null;
  support_phone: string | null;
  custom_css: string | null;
  email_header_html: string | null;
  email_footer_html: string | null;
}

export function useOrgBranding(orgId: string | null | undefined) {
  const qc = useQueryClient();
  const queryKey = ["concierge-org-branding", orgId];

  const query = useQuery<BrandingRow | null>({
    queryKey,
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await (supabase as any)
        .from("organization_branding")
        .select("primary_color,secondary_color,accent_color,logo_light_url,logo_dark_url,favicon_url,login_background_url,company_tagline,support_email,support_phone,custom_css,email_header_html,email_footer_html")
        .eq("organization_id", orgId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as BrandingRow | null;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<BrandingRow>) => {
      if (!orgId) throw new Error("Missing organization");
      const { error } = await (supabase as any).rpc("concierge_upsert_branding", {
        _org_id: orgId, _patch: patch,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Branding updated");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  return { query, update };
}
