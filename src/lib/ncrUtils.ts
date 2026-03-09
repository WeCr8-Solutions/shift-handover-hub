/**
 * NCR (Non-Conformance Report) utility functions.
 * Pure functions for quantity validation and formatting.
 */

export interface QuantityBreakdown {
  original: number;
  completed: number;
  scrap: number;
  rework: number;
  open: number;
  locked: boolean;
}

/**
 * Validates that qty breakdown adds up correctly.
 * completed + scrap + rework + open must equal original.
 */
export function validateQuantityIntegrity(qty: QuantityBreakdown): {
  valid: boolean;
  error?: string;
} {
  const sum = qty.completed + qty.scrap + qty.rework + qty.open;
  if (sum !== qty.original) {
    return {
      valid: false,
      error: `Quantity mismatch: ${qty.completed} + ${qty.scrap} + ${qty.rework} + ${qty.open} = ${sum}, expected ${qty.original}`,
    };
  }
  return { valid: true };
}

/**
 * Computes qty_open from other fields.
 */
export function computeQtyOpen(
  original: number,
  completed: number,
  scrap: number,
  rework: number,
): number {
  return Math.max(original - completed - scrap - rework, 0);
}

/**
 * Checks if quantity affected is valid for an NCR.
 * Cannot exceed qty_open.
 */
export function validateNcrQuantity(
  quantityAffected: number,
  qtyOpen: number,
): { valid: boolean; error?: string } {
  if (quantityAffected <= 0) {
    return { valid: false, error: "Quantity affected must be greater than 0" };
  }
  if (!Number.isInteger(quantityAffected)) {
    return { valid: false, error: "Quantity affected must be a whole number" };
  }
  if (quantityAffected > qtyOpen) {
    return {
      valid: false,
      error: `Quantity affected (${quantityAffected}) exceeds open quantity (${qtyOpen})`,
    };
  }
  return { valid: true };
}

/**
 * Computes quality metrics from a set of work orders.
 */
export interface QualityMetrics {
  firstPassYieldPct: number;
  scrapRatePct: number;
  reworkRatePct: number;
  totalOriginal: number;
  totalCompleted: number;
  totalScrap: number;
  totalRework: number;
}

export function computeQualityMetrics(
  items: Array<{
    qty_original?: number | null;
    qty_completed?: number | null;
    qty_scrap?: number | null;
    qty_rework?: number | null;
    is_rework?: boolean | null;
  }>,
): QualityMetrics {
  // Exclude rework WOs from primary metrics
  const primaryItems = items.filter((i) => !i.is_rework);

  const totalOriginal = primaryItems.reduce(
    (sum, i) => sum + (i.qty_original ?? 0),
    0,
  );
  const totalCompleted = primaryItems.reduce(
    (sum, i) => sum + (i.qty_completed ?? 0),
    0,
  );
  const totalScrap = primaryItems.reduce(
    (sum, i) => sum + (i.qty_scrap ?? 0),
    0,
  );
  const totalRework = primaryItems.reduce(
    (sum, i) => sum + (i.qty_rework ?? 0),
    0,
  );

  const firstPassYieldPct =
    totalOriginal > 0
      ? ((totalCompleted - totalRework) / totalOriginal) * 100
      : 0;

  const scrapRatePct =
    totalOriginal > 0 ? (totalScrap / totalOriginal) * 100 : 0;

  const reworkRatePct =
    totalOriginal > 0 ? (totalRework / totalOriginal) * 100 : 0;

  return {
    firstPassYieldPct: Math.max(firstPassYieldPct, 0),
    scrapRatePct,
    reworkRatePct,
    totalOriginal,
    totalCompleted,
    totalScrap,
    totalRework,
  };
}

export type NCRBadgeVariant = "default" | "destructive" | "secondary" | "outline";

/**
 * Format NCR disposition for display.
 */
export function formatDisposition(
  disposition: string,
): { label: string; color: NCRBadgeVariant } {
  switch (disposition) {
    case "scrap":
      return { label: "Scrap", color: "destructive" };
    case "rework":
      return { label: "Rework", color: "default" };
    case "use_as_is":
      return { label: "Use As Is", color: "secondary" };
    case "return_to_vendor":
      return { label: "Return to Vendor", color: "outline" };
    default:
      return { label: disposition, color: "outline" };
  }
}

/**
 * Format NCR authorization status for display.
 */
export function formatAuthStatus(
  status: string,
): { label: string; variant: "default" | "destructive" | "secondary" | "outline" } {
  switch (status) {
    case "pending":
      return { label: "Pending", variant: "secondary" };
    case "approved":
      return { label: "Approved", variant: "default" };
    case "rejected":
      return { label: "Rejected", variant: "destructive" };
    default:
      return { label: status, variant: "outline" };
  }
}
