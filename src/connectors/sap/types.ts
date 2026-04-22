/**
 * src/connectors/sap/types.ts
 *
 * Local SAP type contracts. Phase 0: defined locally to avoid pulling in
 * @sap-cloud-sdk/* until the edge function actually needs it.
 *
 * Phase 2: replace selected types with re-exports from
 *   `@sap-cloud-sdk/odata-v2` generated clients (e.g. ProductionOrder).
 */

/** SAP S/4HANA standard order types we surface in JobLine. */
export type SapOrderKind = "production" | "planned" | "process" | "service" | "maintenance";

/** SAP environment flavors — affects auth strategy and base URL. */
export type SapInstanceType =
  | "s4hana_cloud"      // OAuth 2.0, BTP destination
  | "s4hana_onprem"     // Basic auth + Cloud Connector
  | "ecc"               // Basic auth + Cloud Connector
  | "sandbox";          // api.sap.com — APIKey header only

/** Subset of API_PRODUCTION_ORDER_2_SRV fields JobLine cares about. */
export interface SapProductionOrderRaw {
  ManufacturingOrder: string;
  ManufacturingOrderType?: string;
  ProductionPlant?: string;
  Material?: string;
  MaterialDescription?: string;
  TotalQuantity?: string;
  TotalConfirmedYieldQty?: string;
  ProductionUnit?: string;
  MfgOrderScheduledStartDate?: string;
  MfgOrderScheduledEndDate?: string;
  ScheduledBasicEndDate?: string;
  OrderIsReleased?: boolean;
  OrderIsTechnicallyCompleted?: boolean;
  OrderIsClosed?: boolean;
  ProductionVersion?: string;
}

/** Normalized shape consumed by JobLine queue/work-order surfaces. */
export interface NormalizedSapOrder {
  id: string;                      // SAP order number
  kind: SapOrderKind;
  workOrder: string;
  partNumber: string | null;
  description: string | null;
  plant: string | null;
  status: "planned" | "released" | "in_progress" | "completed" | "closed";
  totalQty: number | null;
  completedQty: number | null;
  unit: string | null;
  scheduledStart: string | null;   // ISO
  scheduledEnd: string | null;     // ISO
  source: "sap";
  raw: SapProductionOrderRaw;
}

/** Per-org connection config — stored encrypted server-side. */
export interface SapOrgConfig {
  organization_id: string;
  instance_type: SapInstanceType;
  base_url: string;
  oauth_token_url: string | null;
  client_id_encrypted: string | null;
  client_secret_encrypted: string | null;
  api_key_encrypted: string | null;     // sandbox / APIKey scenarios
  default_plant: string | null;
  enabled: boolean;
  last_tested_at: string | null;
  status: "untested" | "ok" | "error";
}

/** Edge function request envelope. */
export interface SapSyncRequest {
  organization_id: string;
  resource: "production_orders" | "planned_orders" | "inspection_lots" | "material_stock" | "test_connection";
  plant?: string;
  filter?: string;
  top?: number;
}

export interface SapSyncResponse<T = unknown> {
  ok: boolean;
  resource: string;
  count: number;
  data: T[];
  error?: { code: string; message: string };
}
