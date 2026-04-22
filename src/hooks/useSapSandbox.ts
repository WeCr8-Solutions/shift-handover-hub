/**
 * src/hooks/useSapSandbox.ts
 *
 * React Query hooks for the SAP sandbox connector (Phase 1).
 * Components MUST use these hooks — never import from `@/connectors/sap` directly.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { callSapSync, getSapProductionOrders } from "@/connectors/sap";
import type { NormalizedSapOrder } from "@/connectors/sap";

export function useSapTestConnection(organizationId: string | undefined) {
  return useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error("organization_id required");
      const res = await callSapSync({
        organization_id: organizationId,
        resource: "test_connection",
      });
      return res;
    },
  });
}

export function useSapProductionOrders(
  organizationId: string | undefined,
  plant?: string,
  enabled = false
) {
  return useQuery<NormalizedSapOrder[]>({
    queryKey: ["sap", "production_orders", organizationId, plant],
    queryFn: () => getSapProductionOrders(organizationId!, plant),
    enabled: enabled && !!organizationId,
    staleTime: 60_000,
  });
}
