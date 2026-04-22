/**
 * src/connectors/sap/normalize.ts
 *
 * SAP OData → JobLine domain mapping. Pure functions — no I/O.
 * Keeping normalization isolated lets us swap the SAP Cloud SDK in Phase 2
 * without touching any UI code.
 */

import type { NormalizedSapOrder, SapProductionOrderRaw } from "./types";

export function normalizeProductionOrder(raw: SapProductionOrderRaw): NormalizedSapOrder {
  const total = raw.TotalQuantity ? Number(raw.TotalQuantity) : null;
  const completed = raw.TotalConfirmedYieldQty ? Number(raw.TotalConfirmedYieldQty) : null;

  let status: NormalizedSapOrder["status"] = "planned";
  if (raw.OrderIsClosed) status = "closed";
  else if (raw.OrderIsTechnicallyCompleted) status = "completed";
  else if (raw.OrderIsReleased) {
    status = completed && total && completed > 0 && completed < total ? "in_progress" : "released";
  }

  return {
    id: raw.ManufacturingOrder,
    kind: "production",
    workOrder: raw.ManufacturingOrder,
    partNumber: raw.Material ?? null,
    description: raw.MaterialDescription ?? null,
    plant: raw.ProductionPlant ?? null,
    status,
    totalQty: Number.isFinite(total as number) ? (total as number) : null,
    completedQty: Number.isFinite(completed as number) ? (completed as number) : null,
    unit: raw.ProductionUnit ?? null,
    scheduledStart: raw.MfgOrderScheduledStartDate ?? null,
    scheduledEnd: raw.MfgOrderScheduledEndDate ?? raw.ScheduledBasicEndDate ?? null,
    source: "sap",
    raw,
  };
}
