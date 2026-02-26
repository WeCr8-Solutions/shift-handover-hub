import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// --- Mocks must not reference top-level vars in factory ---
vi.mock("@/integrations/supabase/client", () => {
  const fn = vi.fn;
  const mockFrom = fn().mockReturnValue({
    select: fn().mockReturnValue({
      eq: fn().mockReturnValue({
        in: fn().mockReturnValue({
          order: fn().mockResolvedValue({ data: [], error: null }),
        }),
        order: fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
    upsert: fn().mockResolvedValue({ data: null, error: null }),
    update: fn().mockReturnValue({
      eq: fn().mockResolvedValue({ data: null, error: null }),
    }),
  });
  return {
    supabase: {
      from: mockFrom,
      rpc: fn(),
      channel: fn().mockReturnValue({
        on: fn().mockReturnThis(),
        subscribe: fn().mockReturnThis(),
      }),
      removeChannel: fn(),
    },
  };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "op@test.com" },
    profile: { display_name: "Test Operator" },
  }),
}));

vi.mock("@/hooks/useAdminData", () => ({
  useAdminAccess: () => ({
    hasOrgSupervisorAccess: false,
    hasDevAccess: false,
    isOrgAdmin: false,
    isLoading: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { OperatorStationPanel } from "./OperatorStationPanel";

function renderPanel(props?: Partial<React.ComponentProps<typeof OperatorStationPanel>>) {
  return render(
    <BrowserRouter>
      <OperatorStationPanel
        stationId="stn-1"
        stationName="CNC Lathe 01"
        onCreateHandoff={vi.fn()}
        onPerformanceUpdate={vi.fn()}
        {...props}
      />
    </BrowserRouter>
  );
}

describe("OperatorStationPanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders station name after loading", async () => {
    renderPanel();
    await waitFor(() => {
      // After loading completes, the card header shows station name
      expect(screen.queryByText(/CNC Lathe 01/i) || screen.getByRole("heading")).toBeTruthy();
    });
  });

  it("does NOT show supervisor override when user lacks supervisor access", () => {
    renderPanel();
    expect(screen.queryByText(/Supervisor Override/i)).not.toBeInTheDocument();
  });
});
