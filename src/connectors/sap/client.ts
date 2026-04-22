/**
 * src/connectors/sap/client.ts
 *
 * Thin browser-side facade. Never talks to SAP directly — always proxies
 * through the `sap-sync` edge function so SAP credentials stay server-side.
 *
 * Phase 0: returns empty results when the function is not yet deployed,
 * so importing this module is always safe.
 */

import { supabase } from "@/integrations/supabase/client";
import type { NormalizedSapOrder, SapSyncRequest, SapSyncResponse } from "./types";
import { normalizeProductionOrder } from "./normalize";

export async function callSapSync<T = unknown>(
  req: SapSyncRequest
): Promise<SapSyncResponse<T>> {
  try {
    const { data, error } = await supabase.functions.invoke<SapSyncResponse<T>>("sap-sync", {
      body: req,
    });
    if (error) {
      return { ok: false, resource: req.resource, count: 0, data: [], error: { code: "invoke_error", message: error.message } };
    }
    return data ?? { ok: false, resource: req.resource, count: 0, data: [], error: { code: "empty_response", message: "No data returned" } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, resource: req.resource, count: 0, data: [], error: { code: "client_exception", message } };
  }
}

export async function getSapProductionOrders(
  organization_id: string,
  plant?: string
): Promise<NormalizedSapOrder[]> {
  const res = await callSapSync<Parameters<typeof normalizeProductionOrder>[0]>({
    organization_id,
    resource: "production_orders",
    plant,
    top: 100,
  });
  if (!res.ok) return [];
  return res.data.map(normalizeProductionOrder);
}

export async function testSapConnection(organization_id: string): Promise<{ ok: boolean; message: string }> {
  const res = await callSapSync({ organization_id, resource: "test_connection" });
  return { ok: res.ok, message: res.error?.message ?? "Connection OK" };
}
