import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rows: [] as any[],
  rpc: vi.fn(),
}));

vi.mock("@/components/SEOHead", () => ({
  SEOHead: () => null,
}));

vi.mock("@/components/marketing/MarketingNav", () => ({
  MarketingNav: () => <div>MarketingNav</div>,
}));

vi.mock("@/components/marketing/MarketingFooter", () => ({
  MarketingFooter: () => <div>MarketingFooter</div>,
}));

vi.mock("@/lib/talent/locations", () => ({
  COUNTRIES: [{ code: "US", name: "United States" }],
  getRegionsForCountry: () => [],
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: state.rpc,
  },
}));

import TalentBrowse from "./TalentBrowse";

function renderPage(path = "/talent/browse?verified=1&open=1&skill=GD%26T&sort=verified") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TalentBrowse />
    </MemoryRouter>,
  );
}

describe("TalentBrowse", () => {
  beforeEach(() => {
    state.rows = [];
    state.rpc.mockReset();
    state.rpc.mockImplementation(() => Promise.resolve({ data: state.rows, error: null }));
  });

  it("passes employer-facing filters into the public profile search RPC and renders verified results", async () => {
    state.rows = [
      {
        user_id: "user-1",
        public_username: "taylor-operator",
        display_name: "Taylor Operator",
        headline: "Aerospace CNC Machinist",
        location_city: "Wichita",
        location_region: "KS",
        location_country: "US",
        years_experience: 8,
        open_to_work: true,
        willing_to_relocate: true,
        avatar_url: null,
        public_published_at: "2026-04-01T00:00:00.000Z",
        cert_count: 3,
        verified_cert_count: 2,
        top_skills: ["GD&T", "Setup"],
        top_machines: ["Haas VF-2"],
      },
    ];

    renderPage();

    await waitFor(() => {
      expect(state.rpc).toHaveBeenCalledWith(
        "list_public_operator_profiles",
        expect.objectContaining({
          _search: null,
          _skill: "GD&T",
          _open_to_work: true,
          _verified_only: true,
          _sort: "verified",
        }),
      );
    });

    expect(screen.getByText(/1 profile found/i)).toBeInTheDocument();
    expect(screen.getByText(/Taylor Operator/i)).toBeInTheDocument();
    expect(screen.getByText(/@taylor-operator/i)).toBeInTheDocument();
    expect(screen.getByText(/^Open$/i)).toBeInTheDocument();
    expect(screen.getByText(/2 verified/i)).toBeInTheDocument();
    expect(screen.getByText(/1 more cert/i)).toBeInTheDocument();
    expect(screen.getByText(/Skill: GD&T/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified only/i)).toBeInTheDocument();
  });
});