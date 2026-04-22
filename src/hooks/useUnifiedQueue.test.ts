import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

const { mockInvoke, mockFrom, modeState } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
  mockFrom: vi.fn(),
  modeState: {
    mode: "jobboss_read_through",
    vendor: "jobboss",
    isReadThrough: true,
    isItar: true,
    loading: false,
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
    functions: {
      invoke: mockInvoke,
    },
  },
}));

vi.mock("@/contexts/OrgContext", () => ({
  useOrgContext: () => ({
    organization: { id: "org-1" },
  }),
}));

vi.mock("@/hooks/useDataSourceMode", () => ({
  useDataSourceMode: () => modeState,
}));

import { useUnifiedQueue } from "./useUnifiedQueue";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useUnifiedQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    modeState.mode = "jobboss_read_through";
    modeState.vendor = "jobboss";
    modeState.isReadThrough = true;
    modeState.isItar = true;
    modeState.loading = false;
  });

  it("maps JobBOSS read-through work orders from erp-sync", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: {
        success: true,
        read_only: true,
        data: [
          {
            erp_job_id: "JB-1001",
            work_order_number: "WO-1001",
            part_number: "PN-42",
            part_name: "Valve Body",
            quantity_ordered: 24,
            quantity_complete: 6,
            due_date: "2026-04-30",
            priority: "high",
            status: "Released",
          },
        ],
      },
      error: null,
    });

    const { result } = renderHook(() => useUnifiedQueue(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    expect(mockInvoke).toHaveBeenCalledWith("erp-sync", {
      body: {
        organization_id: "org-1",
        sync_type: "incremental",
        read_only: true,
      },
    });

    expect(result.current.items[0]).toMatchObject({
      id: "jobboss:JB-1001",
      source_system: "jobboss",
      is_read_through: true,
      work_order: "WO-1001",
      title: "Valve Body",
      part_number: "PN-42",
      quantity: 24,
      qty_completed: 6,
      erp_job_id: "JB-1001",
      status: "Released",
      priority: "high",
      due_date: "2026-04-30",
    });
  });

  it("reads native and write-through queue rows from queue_items", async () => {
    modeState.mode = "sap_write_through";
    modeState.vendor = "sap";
    modeState.isReadThrough = false;
    modeState.isItar = false;

    const limit = vi.fn().mockResolvedValue({
      data: [
        {
          id: "queue-1",
          work_order: "WO-2001",
          title: "Native Order",
          part_number: "PN-200",
          status: "in_progress",
          priority: "high",
          due_date: "2026-05-01",
          station_id: "station-1",
          quantity: 12,
          qty_completed: 4,
          erp_job_id: "SAP-2001",
          erp_source: "sap",
        },
      ],
      error: null,
    });
    const order = vi.fn().mockReturnValue({ limit });
    const not = vi.fn().mockReturnValue({ order });
    const eq = vi.fn().mockReturnValue({ not });
    const select = vi.fn().mockReturnValue({ eq });

    mockFrom.mockReturnValue({ select });

    const { result } = renderHook(() => useUnifiedQueue(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    expect(mockFrom).toHaveBeenCalledWith("queue_items");
    expect(mockInvoke).not.toHaveBeenCalled();
    expect(result.current.items[0]).toMatchObject({
      id: "queue-1",
      source_system: "sap",
      is_read_through: false,
      work_order: "WO-2001",
      title: "Native Order",
      part_number: "PN-200",
      status: "in_progress",
      priority: "high",
      due_date: "2026-05-01",
      station_id: "station-1",
      quantity: 12,
      qty_completed: 4,
      erp_job_id: "SAP-2001",
    });
  });

  it("maps SAP read-through work orders from sap-sync", async () => {
    modeState.mode = "sap_read_through";
    modeState.vendor = "sap";
    modeState.isReadThrough = true;
    modeState.isItar = true;

    mockInvoke.mockResolvedValueOnce({
      data: {
        ok: true,
        data: [
          {
            erp_job_id: "SAP-3001",
            work_order: "SO-3001",
            part_number: "PN-300",
            title: "SAP Pump Housing",
            quantity: 18,
            qty_completed: 9,
            due_date: "2026-05-15",
            priority: "urgent",
            status: "released",
          },
        ],
      },
      error: null,
    });

    const { result } = renderHook(() => useUnifiedQueue(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    expect(mockInvoke).toHaveBeenCalledWith("sap-sync", {
      body: {
        organization_id: "org-1",
        resource: "production_orders",
        top: 200,
      },
    });

    expect(result.current.items[0]).toMatchObject({
      id: "sap:SAP-3001",
      source_system: "sap",
      is_read_through: true,
      work_order: "SO-3001",
      title: "SAP Pump Housing",
      part_number: "PN-300",
      status: "released",
      priority: "urgent",
      due_date: "2026-05-15",
      quantity: 18,
      qty_completed: 9,
      erp_job_id: "SAP-3001",
    });
  });
});