import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/test-utils";
import { PartSpecsSection, MATERIAL_TYPES, PART_SHAPES, TOLERANCE_OPTIONS, SURFACE_FINISH_OPTIONS } from "./PartSpecsSection";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

vi.mock("@/hooks/useUserOrganization", () => ({
  useUserOrganization: () => ({
    organization: { id: "test-org-id", name: "Test Org", slug: "test-org", description: null, logo_url: null, subscription_tier: "team", subscription_status: "active", trial_ends_at: null },
    organizationRole: "supervisor",
    teams: [],
    userRoles: [],
    primaryRole: "supervisor",
    primaryTeam: null,
    loading: false,
    refresh: async () => {},
  }),
}));

const emptyData = {
  material_type: "",
  part_length_inches: "",
  part_width_inches: "",
  part_height_inches: "",
  part_weight_lbs: "",
  part_shape: "",
  part_catalog_id: "",
  required_tolerance: "",
  surface_finish: "",
};

describe("PartSpecsSection", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders Part Specifications trigger button", () => {
    render(<PartSpecsSection data={emptyData} onChange={mockOnChange} />);
    expect(screen.getByText("Part Specifications")).toBeInTheDocument();
  });

  it("renders collapsible content when defaultOpen is true", () => {
    render(<PartSpecsSection data={emptyData} onChange={mockOnChange} defaultOpen={true} />);
    expect(screen.getByText("Material Type")).toBeInTheDocument();
    expect(screen.getByText("Part Shape")).toBeInTheDocument();
  });

  it("renders tolerance and surface finish dropdowns when open", () => {
    render(<PartSpecsSection data={emptyData} onChange={mockOnChange} defaultOpen={true} />);
    expect(screen.getByText("Tolerance")).toBeInTheDocument();
    expect(screen.getByText("Surface Finish")).toBeInTheDocument();
  });

  it("renders dimension inputs when open", () => {
    render(<PartSpecsSection data={emptyData} onChange={mockOnChange} defaultOpen={true} />);
    expect(screen.getByText("Length (in)")).toBeInTheDocument();
    expect(screen.getByText("Width (in)")).toBeInTheDocument();
    expect(screen.getByText("Height (in)")).toBeInTheDocument();
    expect(screen.getByText("Weight (lbs)")).toBeInTheDocument();
  });

  it("renders auto-fill from catalog button when open", () => {
    render(<PartSpecsSection data={emptyData} onChange={mockOnChange} defaultOpen={true} />);
    expect(screen.getByText("Auto-fill from Part Catalog")).toBeInTheDocument();
  });

  it("exports correct number of material types", () => {
    expect(MATERIAL_TYPES.length).toBe(11);
    expect(MATERIAL_TYPES).toContain("Aluminum");
    expect(MATERIAL_TYPES).toContain("Titanium");
  });

  it("exports correct number of part shapes", () => {
    expect(PART_SHAPES.length).toBe(5);
    expect(PART_SHAPES.map(s => s.value)).toContain("prismatic");
    expect(PART_SHAPES.map(s => s.value)).toContain("cylindrical");
  });

  it("exports tolerance options", () => {
    expect(TOLERANCE_OPTIONS.length).toBeGreaterThan(0);
    expect(TOLERANCE_OPTIONS).toContain('±0.001"');
  });

  it("exports surface finish options", () => {
    expect(SURFACE_FINISH_OPTIONS.length).toBeGreaterThan(0);
    expect(SURFACE_FINISH_OPTIONS.map(sf => sf.value)).toContain("32Ra");
  });

  it("shows (filled) indicator when specs are present", () => {
    const filledData = { ...emptyData, material_type: "Aluminum" };
    render(<PartSpecsSection data={filledData} onChange={mockOnChange} />);
    expect(screen.getByText("(filled)")).toBeInTheDocument();
  });
});
