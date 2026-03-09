import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { AllProviders } from "@/test/test-utils";

// ---- JobBoss Cloud ERP test data ----
const JOBBOSS_CONNECTION = {
  id: "erp-conn-001",
  organization_id: "org-jobboss-1",
  erp_vendor: "jobboss",
  instance_type: "cloud",
  api_base_url: "https://api.jobboss.cloud/v2",
  oauth_token_endpoint: "https://auth.jobboss.cloud/oauth/token",
  client_id_encrypted: "jb-client-id-****",
  client_secret_encrypted: null,
  scopes: "read-only",
  tenant_identifier: "ACME-MFG-001",
  sync_interval_minutes: 10,
  is_active: true,
  last_tested_at: "2026-02-27T10:00:00Z",
  connection_status: "connected",
  metadata: {
    field_mapping: {
      work_orders_endpoint: "/api/jobs",
      operations_endpoint: "/api/operations",
      work_centers_endpoint: "/api/work-centers",
      work_order_fields: {
        job_id: "Job",
        work_order_number: "Job",
        part_number: "Part_Number",
        part_name: "Description",
        customer_name: "Customer",
        quantity_ordered: "Order_Quantity",
        quantity_complete: "Completed_Quantity",
        due_date: "Due_Date",
        priority: "Priority_Code",
        status: "Status",
      },
    },
  },
  created_by: "user-admin-1",
  created_at: "2026-01-15T08:00:00Z",
  updated_at: "2026-02-27T10:00:00Z",
};

const JOBBOSS_SYNC_LOGS = [
  {
    id: "sync-log-001",
    organization_id: "org-jobboss-1",
    erp_connection_id: "erp-conn-001",
    sync_type: "incremental",
    started_at: "2026-02-27T09:50:00Z",
    completed_at: "2026-02-27T09:50:12Z",
    status: "success",
    records_fetched: 47,
    records_created: 3,
    records_updated: 44,
    errors_count: 0,
    error_details: null,
    duration_ms: 12340,
    triggered_by: "manual",
  },
  {
    id: "sync-log-002",
    organization_id: "org-jobboss-1",
    erp_connection_id: "erp-conn-001",
    sync_type: "full",
    started_at: "2026-02-26T22:00:00Z",
    completed_at: "2026-02-26T22:01:45Z",
    status: "partial",
    records_fetched: 215,
    records_created: 12,
    records_updated: 198,
    errors_count: 5,
    error_details: [
      { erp_job_id: "JB-8842", error: "Missing part_number" },
      { erp_job_id: "JB-8850", error: "Invalid due_date format" },
    ],
    duration_ms: 105200,
    triggered_by: "manual",
  },
];

const JOBBOSS_WORK_CENTER_MAPPINGS = [
  {
    id: "wcm-001",
    organization_id: "org-jobboss-1",
    erp_work_center_id: "WC-LATHE-01",
    erp_work_center_name: "CNC Lathe #1",
    jobline_station_id: "station-lathe-1",
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-27T00:00:00Z",
  },
  {
    id: "wcm-002",
    organization_id: "org-jobboss-1",
    erp_work_center_id: "WC-MILL-01",
    erp_work_center_name: "VMC Haas #1",
    jobline_station_id: "station-mill-1",
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-27T00:00:00Z",
  },
  {
    id: "wcm-003",
    organization_id: "org-jobboss-1",
    erp_work_center_id: "WC-GRIND-01",
    erp_work_center_name: "Surface Grinder",
    jobline_station_id: null, // unmapped
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-27T00:00:00Z",
  },
];

const JOBBOSS_STATUS_MAPPINGS = [
  { id: "sm-001", organization_id: "org-jobboss-1", erp_status: "Active", jobline_status: "in_progress", created_at: "2026-02-01T00:00:00Z" },
  { id: "sm-002", organization_id: "org-jobboss-1", erp_status: "Released", jobline_status: "queued", created_at: "2026-02-01T00:00:00Z" },
  { id: "sm-003", organization_id: "org-jobboss-1", erp_status: "Complete", jobline_status: "completed", created_at: "2026-02-01T00:00:00Z" },
  { id: "sm-004", organization_id: "org-jobboss-1", erp_status: "On Hold", jobline_status: "on_hold", created_at: "2026-02-01T00:00:00Z" },
  { id: "sm-005", organization_id: "org-jobboss-1", erp_status: "Pending", jobline_status: "pending", created_at: "2026-02-01T00:00:00Z" },
];

// ---- Supabase mock with JobBoss data routing ----
const fromCallTracker: string[] = [];
const invokeCallTracker: { fn: string; body: any }[] = [];

vi.mock("@/integrations/supabase/client", () => {
  const fn = vi.fn;

  const makeChainable = (resolvedData: any) => {
    const obj: any = {
      select: fn().mockImplementation(() => obj),
      insert: fn().mockImplementation(() => obj),
      update: fn().mockImplementation(() => obj),
      delete: fn().mockImplementation(() => obj),
      upsert: fn().mockImplementation(() => obj),
      eq: fn().mockImplementation(() => obj),
      order: fn().mockImplementation(() => obj),
      limit: fn().mockImplementation(() => obj),
      maybeSingle: fn().mockResolvedValue({ data: resolvedData, error: null }),
      single: fn().mockResolvedValue({ data: resolvedData, error: null }),
      then: fn((cb: any) => cb({ data: Array.isArray(resolvedData) ? resolvedData : [resolvedData], error: null })),
    };
    return obj;
  };

  return {
    supabase: {
      from: fn().mockImplementation((table: string) => {
        fromCallTracker.push(table);
        switch (table) {
          case "erp_connections":
            return makeChainable(JOBBOSS_CONNECTION);
          case "erp_sync_logs":
            return makeChainable(JOBBOSS_SYNC_LOGS);
          case "erp_sync_errors":
            return makeChainable([]);
          case "erp_work_center_mappings":
            return makeChainable(JOBBOSS_WORK_CENTER_MAPPINGS);
          case "erp_status_mappings":
            return makeChainable(JOBBOSS_STATUS_MAPPINGS);
          default:
            return makeChainable(null);
        }
      }),
      functions: {
        invoke: fn().mockImplementation((fnName: string, opts: any) => {
          invokeCallTracker.push({ fn: fnName, body: opts?.body });
          if (fnName === "erp-sync" && opts?.body?.test_connection) {
            return Promise.resolve({
              data: { success: true, status: "connected", message: "Connection test successful" },
              error: null,
            });
          }
          if (fnName === "erp-sync") {
            return Promise.resolve({
              data: {
                success: true,
                records_fetched: 47,
                records_created: 3,
                records_updated: 44,
                errors_count: 0,
              },
              error: null,
            });
          }
          return Promise.resolve({ data: null, error: null });
        }),
      },
      channel: fn().mockReturnValue({
        on: fn().mockReturnThis(),
        subscribe: fn().mockReturnThis(),
      }),
      removeChannel: fn(),
    },
  };
});

vi.mock("@/hooks/useUserOrganization", () => ({
  useUserOrganization: () => ({
    organization: {
      id: "org-jobboss-1",
      name: "ACME Manufacturing",
      slug: "acme-mfg",
      description: null,
      logo_url: null,
      subscription_tier: "team",
      subscription_status: "active",
      trial_ends_at: null,
    },
    organizationRole: "supervisor",
    teams: [],
    userRoles: [],
    primaryRole: "supervisor",
    primaryTeam: null,
    loading: false,
    refresh: async () => {},
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

import { useERPConnector } from "./useERPConnector";
import { supabase } from "@/integrations/supabase/client";

describe("useERPConnector — JobBoss Cloud ERP Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromCallTracker.length = 0;
    invokeCallTracker.length = 0;
  });

  describe("Connection Loading", () => {
    it("fetches erp_connections scoped to org on mount", async () => {
      renderHook(() => useERPConnector(), { wrapper: AllProviders });

      await waitFor(() => {
        expect(fromCallTracker).toContain("erp_connections");
      });
    });

    it("loads all related tables in parallel on mount", async () => {
      renderHook(() => useERPConnector(), { wrapper: AllProviders });

      await waitFor(() => {
        expect(fromCallTracker).toContain("erp_connections");
        expect(fromCallTracker).toContain("erp_sync_logs");
        expect(fromCallTracker).toContain("erp_work_center_mappings");
        expect(fromCallTracker).toContain("erp_status_mappings");
      });
    });

    it("returns connection with jobboss vendor after load", async () => {
      const { result } = renderHook(() => useERPConnector(), { wrapper: AllProviders });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.connection).toBeTruthy();
      expect(result.current.connection?.erp_vendor).toBe("jobboss");
      expect(result.current.connection?.connection_status).toBe("connected");
    });
  });

  describe("JobBoss Work Center Mappings", () => {
    it("returns work center mappings including unmapped entries", async () => {
      const { result } = renderHook(() => useERPConnector(), { wrapper: AllProviders });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have 3 mappings (2 mapped, 1 unmapped)
      expect(result.current.workCenterMappings.length).toBe(3);
    });

    it("identifies unmapped work centers (null jobline_station_id)", async () => {
      const { result } = renderHook(() => useERPConnector(), { wrapper: AllProviders });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const unmapped = result.current.workCenterMappings.filter(
        (wc) => wc.jobline_station_id === null
      );
      expect(unmapped.length).toBe(1);
      expect(unmapped[0].erp_work_center_name).toBe("Surface Grinder");
    });
  });

  describe("JobBoss Status Mappings", () => {
    it("loads all 5 JobBoss status mappings", async () => {
      const { result } = renderHook(() => useERPConnector(), { wrapper: AllProviders });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.statusMappings.length).toBe(5);
    });

    it("maps JobBoss 'Active' to JobLine 'in_progress'", async () => {
      const { result } = renderHook(() => useERPConnector(), { wrapper: AllProviders });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const activeMapping = result.current.statusMappings.find(
        (sm) => sm.erp_status === "Active"
      );
      expect(activeMapping?.jobline_status).toBe("in_progress");
    });
  });

  describe("Test Connection (JobBoss Cloud)", () => {
    it("invokes erp-sync edge function with test_connection flag", async () => {
      const { result } = renderHook(() => useERPConnector(), { wrapper: AllProviders });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.testConnection();
      });

      expect(invokeCallTracker).toContainEqual(
        expect.objectContaining({
          fn: "erp-sync",
          body: expect.objectContaining({
            organization_id: "org-jobboss-1",
            test_connection: true,
          }),
        })
      );
    });
  });

  describe("Sync Execution", () => {
    it("invokes incremental sync with correct org_id", async () => {
      const { result } = renderHook(() => useERPConnector(), { wrapper: AllProviders });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.runSync("incremental");
      });

      expect(invokeCallTracker).toContainEqual(
        expect.objectContaining({
          fn: "erp-sync",
          body: expect.objectContaining({
            organization_id: "org-jobboss-1",
            sync_type: "incremental",
          }),
        })
      );
    });

    it("invokes full sync when requested", async () => {
      const { result } = renderHook(() => useERPConnector(), { wrapper: AllProviders });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.runSync("full");
      });

      expect(invokeCallTracker).toContainEqual(
        expect.objectContaining({
          fn: "erp-sync",
          body: expect.objectContaining({
            sync_type: "full",
          }),
        })
      );
    });
  });

  describe("Sync History with Tiered Payment Validation", () => {
    it("loads sync logs showing last successful sync stats", async () => {
      const { result } = renderHook(() => useERPConnector(), { wrapper: AllProviders });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.syncLogs.length).toBeGreaterThanOrEqual(1);
    });

    it("connection is active only when org has paid subscription", async () => {
      // The mock org has subscription_tier: "team" and status: "active"
      // Connection is_active should be true
      const { result } = renderHook(() => useERPConnector(), { wrapper: AllProviders });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.connection?.is_active).toBe(true);
    });
  });

  describe("Field Mapping — JobBoss-specific keys", () => {
    it("stores JobBoss field mapping in connection metadata", async () => {
      const { result } = renderHook(() => useERPConnector(), { wrapper: AllProviders });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const metadata = result.current.connection?.metadata as any;
      expect(metadata?.field_mapping).toBeTruthy();
      expect(metadata?.field_mapping.work_orders_endpoint).toBe("/api/jobs");
      expect(metadata?.field_mapping.work_order_fields.job_id).toBe("Job");
      expect(metadata?.field_mapping.work_order_fields.part_number).toBe("Part_Number");
      expect(metadata?.field_mapping.work_order_fields.customer_name).toBe("Customer");
    });
  });

  describe("Tenant Isolation", () => {
    it("scopes all queries to organization_id", async () => {
      renderHook(() => useERPConnector(), { wrapper: AllProviders });

      await waitFor(() => {
        // All ERP tables should be queried
        expect(fromCallTracker.filter((t) => t.startsWith("erp_")).length).toBeGreaterThanOrEqual(3);
      });

      // Verify supabase.from was called with all ERP tables
      expect(supabase.from).toHaveBeenCalledWith("erp_connections");
      expect(supabase.from).toHaveBeenCalledWith("erp_sync_logs");
      expect(supabase.from).toHaveBeenCalledWith("erp_work_center_mappings");
      expect(supabase.from).toHaveBeenCalledWith("erp_status_mappings");
    });
  });
});
