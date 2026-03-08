import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock supabase
const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
    from: (...args: any[]) => mockFrom(...args),
  },
}));

import ShopFloorDisplay from "./ShopFloorDisplay";

function renderWithRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/display/:displayId" element={<ShopFloorDisplay />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ShopFloorDisplay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows error when no token provided", () => {
    renderWithRoute("/display/abc123");
    expect(screen.getByText("Display Unavailable")).toBeInTheDocument();
    expect(screen.getByText("No display token provided")).toBeInTheDocument();
  });

  it("shows loading state while validating token", () => {
    mockRpc.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithRoute("/display/abc123?token=test-token");
    expect(screen.getByText("Connecting display…")).toBeInTheDocument();
  });

  it("shows error for invalid token response", async () => {
    mockRpc.mockResolvedValue({
      data: { valid: false, reason: "Token expired" },
      error: null,
    });
    renderWithRoute("/display/abc123?token=bad-token");
    
    expect(await screen.findByText("Display Unavailable")).toBeInTheDocument();
    expect(await screen.findByText("Token expired")).toBeInTheDocument();
  });

  it("shows error on RPC failure", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "RPC error" },
    });
    renderWithRoute("/display/abc123?token=test-token");
    
    expect(await screen.findByText("Display Unavailable")).toBeInTheDocument();
    expect(await screen.findByText("Failed to validate display token")).toBeInTheDocument();
  });

  it("renders supervisor display when token valid with supervisor mode", async () => {
    const selectChain = {
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: [] }),
        }),
      }),
    };
    const queueChain = {
      eq: vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      }),
    };

    mockRpc.mockResolvedValue({
      data: {
        valid: true,
        display_id: "d1",
        organization_id: "org-1",
        display_name: "Mill Area TV",
        display_mode: "supervisor",
        team_ids: [],
        refresh_interval_seconds: 30,
        dark_mode: "auto",
      },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "stations") return { select: vi.fn().mockReturnValue(selectChain) };
      if (table === "queue_items") return { select: vi.fn().mockReturnValue(queueChain) };
      return { select: vi.fn().mockReturnValue(selectChain) };
    });

    renderWithRoute("/display/d1?token=valid-token");
    
    expect(await screen.findByText("Mill Area TV")).toBeInTheDocument();
    expect(screen.getByText("SUPERVISOR")).toBeInTheDocument();
  });

  it("renders operator display when token valid with operator mode", async () => {
    const selectChain = {
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: [] }),
        }),
      }),
    };
    const queueChain = {
      eq: vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      }),
    };

    mockRpc.mockResolvedValue({
      data: {
        valid: true,
        display_id: "d2",
        organization_id: "org-1",
        display_name: "Assembly Board",
        display_mode: "operator",
        team_ids: [],
        refresh_interval_seconds: 30,
        dark_mode: "auto",
      },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "stations") return { select: vi.fn().mockReturnValue(selectChain) };
      if (table === "queue_items") return { select: vi.fn().mockReturnValue(queueChain) };
      return { select: vi.fn().mockReturnValue(selectChain) };
    });

    renderWithRoute("/display/d2?token=valid-token");
    
    expect(await screen.findByText("Assembly Board")).toBeInTheDocument();
    expect(screen.getByText("OPERATOR")).toBeInTheDocument();
  });
});
