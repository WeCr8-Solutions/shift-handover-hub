/**
 * src/connectors/sap/index.ts
 *
 * Barrel export for the SAP connector layer.
 * This directory is the ONLY place that may import from `@sap-cloud-sdk/*`
 * (Phase 2). Components MUST NOT import from this directory directly —
 * read from hooks, which call this barrel.
 */

export { callSapSync, getSapProductionOrders, testSapConnection } from "./client";
export { normalizeProductionOrder } from "./normalize";

export type {
  SapOrderKind,
  SapInstanceType,
  SapProductionOrderRaw,
  NormalizedSapOrder,
  SapOrgConfig,
  SapSyncRequest,
  SapSyncResponse,
} from "./types";
