import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";

interface Features {
  handoff_hub: boolean;
  work_orders: boolean;
  analytics: boolean;
  api_access: boolean;
  bulk_upload: boolean;
  erp_connector: boolean;
  erp_tier?: string;
  [key: string]: boolean | string | undefined;
}

interface Limits {
  users: number;
  work_orders_per_month: number;
  stations: number;
  [key: string]: number;
}

interface Entitlements {
  plan: string;
  features: Features;
  limits: Limits;
}

const DEFAULT_ENTITLEMENTS: Entitlements = {
  plan: "free",
  features: {
    handoff_hub: true,
    work_orders: true,
    analytics: false,
    api_access: false,
    bulk_upload: false,
    erp_connector: false,
  },
  limits: {
    users: 1,
    work_orders_per_month: 50,
    stations: 5,
  },
};

export function useEntitlements() {
  const { organization } = useUserOrganization();
  const [entitlements, setEntitlements] = useState<Entitlements>(DEFAULT_ENTITLEMENTS);
  const [loading, setLoading] = useState(true);

  const fetchEntitlements = useCallback(async () => {
    if (!organization?.id) {
      setEntitlements(DEFAULT_ENTITLEMENTS);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("entitlements")
        .select("*")
        .eq("organization_id", organization.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching entitlements:", error);
        setEntitlements(DEFAULT_ENTITLEMENTS);
      } else if (data) {
        setEntitlements({
          plan: data.plan,
          features: (data.features as Features) || DEFAULT_ENTITLEMENTS.features,
          limits: (data.limits as Limits) || DEFAULT_ENTITLEMENTS.limits,
        });
      } else {
        setEntitlements(DEFAULT_ENTITLEMENTS);
      }
    } catch (error) {
      console.error("Error fetching entitlements:", error);
      setEntitlements(DEFAULT_ENTITLEMENTS);
    }

    setLoading(false);
  }, [organization?.id]);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  const canAccess = useCallback(
    (feature: string): boolean => {
      const val = entitlements.features[feature];
      return typeof val === 'boolean' ? val : false;
    },
    [entitlements.features]
  );

  const isWithinLimit = useCallback(
    (limitKey: keyof Limits, currentCount: number): boolean => {
      const limit = entitlements.limits[limitKey];
      if (limit === undefined) return true;
      return currentCount < limit;
    },
    [entitlements.limits]
  );

  const getLimit = useCallback(
    (limitKey: keyof Limits): number => {
      return entitlements.limits[limitKey] ?? 0;
    },
    [entitlements.limits]
  );

  const getRemainingQuota = useCallback(
    (limitKey: keyof Limits, currentCount: number): number => {
      const limit = entitlements.limits[limitKey];
      if (limit === undefined) return Infinity;
      return Math.max(0, limit - currentCount);
    },
    [entitlements.limits]
  );

  return {
    entitlements,
    loading,
    refresh: fetchEntitlements,
    canAccess,
    isWithinLimit,
    getLimit,
    getRemainingQuota,
    plan: entitlements.plan,
    features: entitlements.features,
    limits: entitlements.limits,
  };
}
