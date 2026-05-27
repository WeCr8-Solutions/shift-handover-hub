import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------- Supabase mock: chainable, per-table seed ----------

type RowSet = Record<string, any[]>;
const seed: RowSet = {};
const lastFilters: Record<string, any[]> = {};

function makeBuilder(table: string) {
  lastFilters[table] = [];
  const rec = (op: string, ...args: any[]) => lastFilters[table].push({ op, args });
  const builder: any = {
    select: (..._a: any[]) => (rec("select", ..._a), builder),
    eq: (..._a: any[]) => (rec("eq", ..._a), builder),
    gte: (..._a: any[]) => (rec("gte", ..._a), builder),
    lte: (..._a: any[]) => (rec("lte", ..._a), builder),
    order: (..._a: any[]) => (rec("order", ..._a), builder),
    limit: (..._a: any[]) => (rec("limit", ..._a), builder),
    then: (resolve: any) => resolve({ data: seed[table] ?? [], error: null }),
  };
  return builder;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (t: string) => makeBuilder(t) },
}));

import { fetchAuditBundle } from "./useAuditExportBundle";

// ---------- Seed data ----------

beforeEach(() => {
  for (const k of Object.keys(seed)) delete seed[k];
  for (const k of Object.keys(lastFilters)) delete lastFilters[k];

  seed.queue_items = [
    {
      id: "wo-1",
      work_order: "WO-1001",
      part_number: "PN-A",
      title: "Bracket",
      status: "completed",
      priority: "normal",
      quantity: 10,
      station_id: "st-1",
      team_id: "team-1",
      started_at: "2026-04-10T08:00:00Z",
      completed_at: "2026-04-12T10:00:00Z",
      created_at: "2026-04-09T08:00:00Z",
      updated_at: "2026-04-12T10:00:00Z",
    },
  ];
  seed.work_order_routing = [
    {
      id: "r-1",
      queue_item_id: "wo-1",
      step_order: 1,
      operation_number: "10",
      work_center: "MILL-1",
      work_center_type: "milling",
      station_id: "st-1",
      status: "completed",
      operator_name: "Alice",
    },
  ];
  seed.handoff_records = [
    {
      id: "h-1",
      date: "2026-04-11",
      shift: "Day",
      station_id: "st-1",
      team_id: "team-1",
      work_order: "WO-1001",
      part_number: "PN-A",
      operation_number: "10",
      outgoing_operator_name: "Alice",
      incoming_operator_name: "Bob",
      supervisor_name: "Sup",
      primary_state: "running",
      state_reason: null,
      delay_code: "None",
      created_at: "2026-04-11T16:00:00Z",
    },
  ];
  seed.downtime_events = [
    {
      id: "d-1",
      station_id: "st-1",
      team_id: "team-1",
      downtime_type: "unplanned",
      reason_code: "TOOL",
      description: "Broken insert",
      started_at: "2026-04-11T09:00:00Z",
      ended_at: "2026-04-11T09:30:00Z",
      duration_minutes: 30,
      reported_by_name: "Alice",
      resolved_by_name: "Sup",
      work_order_id: "wo-1",
    },
  ];
  seed.ncr_reports = [
    {
      id: "n-1",
      ncr_number: "NCR-1",
      work_order_number: "WO-1001",
      part_number: "PN-A",
      serial_or_lot: "LOT-7",
      operation_number: "10",
      defect_type: "dimensional",
      disposition: "rework",
      description: "Bore +.0005",
      authorized_by_name: "QA",
      authorized_at: "2026-04-13T12:00:00Z",
      authorization_status: "approved",
      quantity_affected: 1,
      created_at: "2026-04-12T15:00:00Z",
    },
  ];
  seed.quality_inspections = [
    {
      id: "q-1",
      queue_item_id: "wo-1",
      checkpoint_id: "cp-1",
      station_id: "st-1",
      inspector_name: "QA",
      status: "passed",
      notes: "ok",
      defects_found: 0,
      completed_at: "2026-04-12T11:00:00Z",
      created_at: "2026-04-12T11:00:00Z",
    },
  ];
  seed.queue_item_history = [
    {
      id: "qh-1",
      queue_item_id: "wo-1",
      user_name: "Alice",
      action: "status_change",
      old_value: { status: "in_progress" },
      new_value: { status: "completed" },
      created_at: "2026-04-12T10:01:00Z",
    },
  ];
  seed.operator_station_sessions = [
    {
      id: "s-1",
      station_id: "st-1",
      user_id: "user-1",
      shift: "Day",
      checked_in_at: "2026-04-11T07:00:00Z",
      checked_out_at: "2026-04-11T15:00:00Z",
      is_active: false,
    },
  ];
});

describe("fetchAuditBundle", () => {
  const baseArgs = {
    organization_id: "org-1",
    organization_name: "Acme",
    date_from: "2026-04-01",
    date_to: "2026-04-30",
    month: "2026-04",
    standard: "AS9100" as const,
    generated_by: "qa@acme.test",
  };

  it("returns a fully-populated bundle for every record type", async () => {
    const bundle = await fetchAuditBundle({
      ...baseArgs,
      record_types: [
        "work_orders",
        "routing",
        "handoffs",
        "downtime",
        "ncrs",
        "quality",
        "queue_changes",
        "station_sessions",
      ],
    });

    expect(bundle.meta).toMatchObject({
      organization_id: "org-1",
      organization_name: "Acme",
      month: "2026-04",
      standard: "AS9100",
      generated_by: "qa@acme.test",
    });
    expect(bundle.data.work_orders).toHaveLength(1);
    expect(bundle.data.routing).toHaveLength(1);
    expect(bundle.data.handoffs).toHaveLength(1);
    expect(bundle.data.downtime).toHaveLength(1);
    expect(bundle.data.ncrs).toHaveLength(1);
    expect(bundle.data.quality).toHaveLength(1);
    expect(bundle.data.queue_changes).toHaveLength(1);
    expect(bundle.data.station_sessions).toHaveLength(1);
  });

  it("only fetches selected record types", async () => {
    const bundle = await fetchAuditBundle({ ...baseArgs, record_types: ["work_orders", "ncrs"] });
    expect(Object.keys(bundle.data).sort()).toEqual(["ncrs", "work_orders"]);
    // Tables not requested should not have been queried.
    expect(lastFilters.handoff_records).toBeUndefined();
    expect(lastFilters.downtime_events).toBeUndefined();
  });

  it("scopes every table to the active organization", async () => {
    await fetchAuditBundle({ ...baseArgs, record_types: ["work_orders", "handoffs", "ncrs"] });
    for (const t of ["queue_items", "handoff_records", "ncr_reports"]) {
      const ops = lastFilters[t];
      const orgEq = ops.find(
        (o) => o.op === "eq" && o.args[0] === "organization_id" && o.args[1] === "org-1"
      );
      expect(orgEq, `missing organization_id scoping on ${t}`).toBeTruthy();
    }
  });

  it("applies station + team filters when provided", async () => {
    await fetchAuditBundle({
      ...baseArgs,
      record_types: ["handoffs", "downtime"],
      station_id: "st-1",
      team_id: "team-1",
    });
    for (const t of ["handoff_records", "downtime_events"]) {
      const ops = lastFilters[t];
      expect(ops.some((o) => o.op === "eq" && o.args[0] === "station_id" && o.args[1] === "st-1")).toBe(
        true
      );
      expect(ops.some((o) => o.op === "eq" && o.args[0] === "team_id" && o.args[1] === "team-1")).toBe(
        true
      );
    }
  });

  it("filters work_orders by item_type=work_order", async () => {
    await fetchAuditBundle({ ...baseArgs, record_types: ["work_orders"] });
    const ops = lastFilters.queue_items;
    expect(
      ops.some((o) => o.op === "eq" && o.args[0] === "item_type" && o.args[1] === "work_order")
    ).toBe(true);
  });

  it("applies the date range to every record type", async () => {
    await fetchAuditBundle({ ...baseArgs, record_types: ["work_orders", "handoffs"] });
    expect(
      lastFilters.queue_items.some((o) => o.op === "gte" && o.args[1] === "2026-04-01")
    ).toBe(true);
    expect(
      lastFilters.queue_items.some(
        (o) => o.op === "lte" && String(o.args[1]).startsWith("2026-04-30")
      )
    ).toBe(true);
    expect(lastFilters.handoff_records.some((o) => o.op === "gte" && o.args[1] === "2026-04-01")).toBe(
      true
    );
    expect(lastFilters.handoff_records.some((o) => o.op === "lte" && o.args[1] === "2026-04-30")).toBe(
      true
    );
  });
});
