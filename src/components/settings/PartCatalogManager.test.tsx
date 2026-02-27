import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { PartCatalogManager } from "./PartCatalogManager";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

vi.mock("@/hooks/useUserOrganization", () => ({
  useUserOrganization: () => ({
    organization: { id: "test-org-id", name: "Test Org" },
    loading: false,
  }),
}));

describe("PartCatalogManager", () => {
  it("renders Part Catalog title", () => {
    render(<PartCatalogManager />);
    expect(screen.getByText("Part Catalog")).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<PartCatalogManager />);
    expect(screen.getByText(/Manage reusable part profiles/)).toBeInTheDocument();
  });

  it("renders Add Part button", () => {
    render(<PartCatalogManager />);
    expect(screen.getByText("Add Part")).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<PartCatalogManager />);
    expect(screen.getByPlaceholderText(/Search by part number/)).toBeInTheDocument();
  });

  it("shows empty state when no entries", async () => {
    render(<PartCatalogManager />);
    // After loading completes, should show empty state
    const emptyText = await screen.findByText("No parts in catalog yet");
    expect(emptyText).toBeInTheDocument();
  });
});
