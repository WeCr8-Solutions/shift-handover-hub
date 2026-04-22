import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
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
  useDataSourceMode: () => ({
    mode: "jobboss_read_through",
    vendor: "jobboss",
    isReadThrough: true,
    isItar: true,
    loading: false,
  }),
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
});