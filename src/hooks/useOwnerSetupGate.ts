/**
 * src/hooks/useOwnerSetupGate.ts
 *
 * Determines whether the current owner/admin must complete the post-claim
 * setup wizard before reaching the dashboard or unlocking team invites.
 *
 * Returns:
 *   - loading: still resolving
 *   - isOwnerAdmin: this user is owner or admin of the active org
 *   - activationState: 'claimed' | 'in_setup' | 'open_for_operations'
 *   - coreComplete: all 5 required steps marked done in user_onboarding.owner_setup_steps
 *   - exploreOnly: user clicked "Skip & explore" — dashboard renders read-only
 *   - mustRedirect: shorthand for "send this user to /welcome"
 *   - inviteUnlocked: shorthand for "team invites + work order creation allowed"
 *   - markStep / openForOperations / setExploreOnly: writers
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";

export const OWNER_SETUP_STEPS = [
  "profile",
  "organization",
  "data_source",
  "shop_floor",
  "concierge_review", // optional — auto-skipped when no engagement
  "billing",
] as const;
export type OwnerSetupStepId = (typeof OWNER_SETUP_STEPS)[number];

export const REQUIRED_OWNER_STEPS: OwnerSetupStepId[] = [
  "profile",
  "organization",
  "data_source",
  "shop_floor",
  "billing",
];

type ActivationState = "claimed" | "in_setup" | "open_for_operations";

interface State {
  loading: boolean;
  isOwnerAdmin: boolean;
  activationState: ActivationState;
  steps: Record<OwnerSetupStepId, boolean>;
  exploreOnly: boolean;
}

const EMPTY_STEPS: Record<OwnerSetupStepId, boolean> = {
  profile: false,
  organization: false,
  data_source: false,
  shop_floor: false,
  concierge_review: false,
  billing: false,
};

export function useOwnerSetupGate() {
  const { user } = useAuth();
  const { organization, organizationRole, loading: orgLoading } = useOrganization();
  const [state, setState] = useState<State>({
    loading: true,
    isOwnerAdmin: false,
    activationState: "open_for_operations",
    steps: EMPTY_STEPS,
    exploreOnly: false,
  });

  const refresh = useCallback(async () => {
    if (!user || !organization) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const isOwnerAdmin = organizationRole === "owner" || organizationRole === "admin";

    const [orgRes, onboardingRes] = await Promise.all([
      (supabase.from("organizations") as any)
        .select("activation_state")
        .eq("id", organization.id)
        .maybeSingle(),
      (supabase.from("user_onboarding") as any)
        .select("owner_setup_steps, explore_only")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const activationState: ActivationState =
      (orgRes.data?.activation_state as ActivationState) ?? "claimed";
    const allSteps = (onboardingRes.data?.owner_setup_steps ?? {}) as Record<
      string,
      Record<string, boolean>
    >;
    const orgSteps = allSteps[organization.id] ?? {};
    const steps: Record<OwnerSetupStepId, boolean> = { ...EMPTY_STEPS };
    for (const k of OWNER_SETUP_STEPS) steps[k] = Boolean(orgSteps[k]);

    setState({
      loading: false,
      isOwnerAdmin,
      activationState,
      steps,
      exploreOnly: Boolean(onboardingRes.data?.explore_only),
    });
  }, [user, organization, organizationRole]);

  useEffect(() => {
    if (orgLoading) return;
    refresh();
  }, [orgLoading, refresh]);

  const coreComplete = REQUIRED_OWNER_STEPS.every((k) => state.steps[k]);
  const isOpenForOperations = state.activationState === "open_for_operations";
  const mustRedirect =
    !state.loading &&
    state.isOwnerAdmin &&
    !isOpenForOperations &&
    !state.exploreOnly;
  const inviteUnlocked = isOpenForOperations || !state.isOwnerAdmin;

  const markStep = useCallback(
    async (step: OwnerSetupStepId, done = true) => {
      if (!organization) return { ok: false };
      const { data, error } = await supabase.rpc(
        "record_owner_setup_step" as any,
        { p_organization_id: organization.id, p_step: step, p_done: done } as any,
      );
      if (error) return { ok: false, error: error.message };
      await refresh();
      return (data as any) ?? { ok: true };
    },
    [organization, refresh],
  );

  const openForOperations = useCallback(async () => {
    if (!organization) return { ok: false };
    const { data, error } = await supabase.rpc(
      "mark_org_open_for_operations" as any,
      { p_organization_id: organization.id } as any,
    );
    if (error) return { ok: false, error: error.message };
    await refresh();
    return (data as any) ?? { ok: true };
  }, [organization, refresh]);

  const setExploreOnly = useCallback(
    async (v: boolean) => {
      if (!user) return;
      await (supabase.from("user_onboarding") as any)
        .update({ explore_only: v })
        .eq("user_id", user.id);
      await refresh();
    },
    [user, refresh],
  );

  return {
    ...state,
    coreComplete,
    isOpenForOperations,
    mustRedirect,
    inviteUnlocked,
    markStep,
    openForOperations,
    setExploreOnly,
    refresh,
  };
}
