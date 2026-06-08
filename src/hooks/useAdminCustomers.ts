/**
 * Platform-admin "all customers" launchpad data.
 * Joins organizations + onboarding_engagements + subscriptions and
 * classifies each org's setup path so admins can triage from one place.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SetupPath =
  | "concierge"
  | "concierge_unpaid"
  | "complimentary"
  | "self_serve";

export interface AdminCustomerRow {
  organization_id: string;
  organization_name: string;
  slug: string;
  itar: boolean;
  subscription_status: string | null;
  subscription_tier: string | null;
  trial_ends_at: string | null;
  created_at: string;
  onboarding_status: string | null;
  engagement_id: string | null;
  engagement_status: string | null;
  engagement_percent: number | null;
  payment_status: string | null;
  setup_path: SetupPath;
}

export function classifySetupPath(row: {
  engagement_id: string | null;
  payment_status: string | null;
  subscription_status: string | null;
}): SetupPath {
  if (row.engagement_id) {
    if (row.payment_status && ["paid", "waived"].includes(row.payment_status)) {
      return "concierge";
    }
    return "concierge_unpaid";
  }
  if (row.subscription_status === "complimentary") return "complimentary";
  return "self_serve";
}

export function useAdminCustomers() {
  return useQuery({
    queryKey: ["admin-customers"],
    queryFn: async (): Promise<AdminCustomerRow[]> => {
      const { data: orgs, error: orgErr } = await supabase
        .from("organizations")
        .select(
          "id, name, slug, requires_us_person_declaration, subscription_status, subscription_tier, trial_ends_at, created_at, onboarding_status, onboarding_engagement_id"
        )
        .order("created_at", { ascending: false });
      if (orgErr) throw orgErr;

      const { data: eng, error: engErr } = await supabase
        .from("onboarding_engagements" as any)
        .select("id, organization_id, status, percent_complete, payment_status");
      if (engErr) throw engErr;

      const engByOrg = new Map<string, any>();
      (eng ?? []).forEach((e: any) => engByOrg.set(e.organization_id, e));

      return (orgs ?? []).map((o: any) => {
        const e = engByOrg.get(o.id);
        const engagement_id = e?.id ?? null;
        const payment_status = e?.payment_status ?? null;
        return {
          organization_id: o.id,
          organization_name: o.name,
          slug: o.slug,
          itar: !!o.requires_us_person_declaration,
          subscription_status: o.subscription_status ?? null,
          subscription_tier: o.subscription_tier ?? null,
          trial_ends_at: o.trial_ends_at ?? null,
          created_at: o.created_at,
          onboarding_status: o.onboarding_status ?? null,
          engagement_id,
          engagement_status: e?.status ?? null,
          engagement_percent: e?.percent_complete ?? null,
          payment_status,
          setup_path: classifySetupPath({
            engagement_id,
            payment_status,
            subscription_status: o.subscription_status ?? null,
          }),
        } as AdminCustomerRow;
      });
    },
  });
}

export function setupPathLabel(p: SetupPath): string {
  switch (p) {
    case "concierge":
      return "Concierge";
    case "concierge_unpaid":
      return "Concierge (unpaid)";
    case "complimentary":
      return "Complimentary";
    case "self_serve":
      return "Self-serve";
  }
}
