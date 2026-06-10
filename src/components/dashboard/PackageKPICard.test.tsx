import { describe, it, expect } from "vitest";
import { computePackageKPIs } from "./PackageKPICard";
import type { WorkOrderPackage } from "@/hooks/usePackages";

const mk = (p: Partial<WorkOrderPackage>): WorkOrderPackage =>
  ({
    id: crypto.randomUUID(),
    organization_id: "org",
    customer_id: null,
    package_number: "PKG-1",
    title: "t",
    description: null,
    notes: null,
    required_ship_date: null,
    promised_ship_date: null,
    actual_ship_date: null,
    status: "in_progress",
    priority: "normal",
    is_quote: false,
    created_by: null,
    created_at: "",
    updated_at: "",
    ...p,
  }) as WorkOrderPackage;

describe("computePackageKPIs", () => {
  const now = new Date("2026-06-10T12:00:00Z");

  it("returns null on-time rate with no shipments", () => {
    const k = computePackageKPIs([mk({ status: "in_progress" })], now);
    expect(k.onTimeRate).toBeNull();
    expect(k.openCount).toBe(1);
  });

  it("computes on-time vs late shipments", () => {
    const k = computePackageKPIs(
      [
        mk({ status: "shipped", required_ship_date: "2026-06-10", actual_ship_date: "2026-06-09" }),
        mk({ status: "shipped", required_ship_date: "2026-06-10", actual_ship_date: "2026-06-12" }),
        mk({ status: "shipped", required_ship_date: "2026-06-10", actual_ship_date: "2026-06-10" }),
      ],
      now,
    );
    expect(k.shippedCount).toBe(3);
    expect(k.onTimeCount).toBe(2);
    expect(k.onTimeRate).toBe(67);
  });

  it("flags open packages past required ship date as at-risk", () => {
    const k = computePackageKPIs(
      [
        mk({ status: "in_progress", required_ship_date: "2026-06-01" }), // past
        mk({ status: "in_progress", required_ship_date: "2026-06-30" }), // future
        mk({ status: "ready_to_ship", required_ship_date: "2026-06-05" }), // past
        mk({ status: "shipped", required_ship_date: "2026-06-01", actual_ship_date: "2026-06-02" }),
      ],
      now,
    );
    expect(k.openCount).toBe(3);
    expect(k.atRiskCount).toBe(2);
  });

  it("ignores cancelled and closed packages from open + risk", () => {
    const k = computePackageKPIs(
      [
        mk({ status: "cancelled", required_ship_date: "2026-06-01" }),
        mk({ status: "closed", required_ship_date: "2026-06-01" }),
      ],
      now,
    );
    expect(k.openCount).toBe(0);
    expect(k.atRiskCount).toBe(0);
  });
});
