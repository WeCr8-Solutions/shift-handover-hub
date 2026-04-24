import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  username: "taylor-operator",
  profileRow: null as any,
  certs: [] as any[],
  skills: [] as any[],
  machines: [] as any[],
  work: [] as any[],
  education: [] as any[],
  miniSite: null as any,
  navigate: vi.fn(),
  socialCounts: { follower_count: 2, following_count: 1, recommendation_count: 1 },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useParams: () => ({ username: state.username }),
    useNavigate: () => state.navigate,
  };
});

vi.mock("@/components/SEOHead", () => ({
  SEOHead: () => null,
}));

vi.mock("@/components/marketing/MarketingNav", () => ({
  MarketingNav: () => <div>MarketingNav</div>,
}));

vi.mock("@/components/marketing/MarketingFooter", () => ({
  MarketingFooter: () => <div>MarketingFooter</div>,
}));

vi.mock("@/components/talent/TalentSocialPanel", () => ({
  TalentSocialPanel: () => <div>TalentSocialPanel</div>,
}));

vi.mock("@/components/talent/PublicProfileQrCard", () => ({
  PublicProfileQrCard: () => <div>PublicProfileQrCard</div>,
}));

vi.mock("@/components/talent/MiniSiteSections", () => ({
  ServicesSection: () => null,
  GallerySection: () => null,
  TestimonialsSection: () => null,
  BusinessHoursSection: () => null,
  LocationMapSection: () => null,
  SaveContactButton: () => <button>Save contact (.vcf)</button>,
}));

vi.mock("@/hooks/useOperatorSocial", () => ({
  usePublicOperatorSocial: () => ({
    counts: state.socialCounts,
  }),
}));

vi.mock("@/hooks/useProfileViewTracker", () => ({
  useProfileViewTracker: () => undefined,
}));

vi.mock("@/lib/talent/publicHost", () => ({
  getPublicTalentUrl: (username: string) => `https://jobline.ai/talent/${username}`,
}));

vi.mock("@/lib/talent/outboundLinks", () => ({
  withJoblineUtm: (url: string) => url,
}));

vi.mock("@/lib/talent/socialDeepLinks", () => ({
  getSocialHref: (href: string) => href,
  openSocialLink: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => {
  const buildQuery = (table: string) => {
    const api: any = {};
    api.select = vi.fn().mockReturnValue(api);
    api.eq = vi.fn().mockReturnValue(api);
    api.order = vi.fn().mockReturnValue(api);
    api.maybeSingle = vi.fn().mockImplementation(() => {
        if (table === "operator_profiles") {
          return Promise.resolve({ data: state.miniSite, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });
    api.then = (resolve: (value: any) => unknown) => {
      const dataMap: Record<string, any> = {
        operator_certifications: state.certs,
        operator_skills: state.skills,
        operator_machine_proficiencies: state.machines,
        operator_work_history: state.work,
        operator_education: state.education,
      };
      return Promise.resolve(resolve({ data: dataMap[table] ?? [], error: null }));
    };
    return api;
  };

  return {
    supabase: {
      rpc: vi.fn().mockImplementation((fnName: string) => {
        if (fnName === "get_public_operator_profile") {
          return Promise.resolve({ data: state.profileRow ? [state.profileRow] : [], error: null });
        }
        return Promise.resolve({ data: [], error: null });
      }),
      from: vi.fn().mockImplementation((table: string) => buildQuery(table)),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    },
  };
});

import PublicOperatorProfile from "./PublicOperatorProfile";

function renderPage() {
  return render(
    <MemoryRouter>
      <PublicOperatorProfile />
    </MemoryRouter>,
  );
}

describe("PublicOperatorProfile", () => {
  beforeEach(() => {
    state.username = "taylor-operator";
    state.navigate.mockReset();
    state.profileRow = null;
    state.certs = [];
    state.skills = [];
    state.machines = [];
    state.work = [];
    state.education = [];
    state.miniSite = null;
    state.socialCounts = { follower_count: 2, following_count: 1, recommendation_count: 1 };
  });

  it("shows the not-found state when the public profile is missing or private", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Profile not found/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/This profile is private, doesn't exist, or hasn't been published yet/i)).toBeInTheDocument();
  });

  it("shows verified OAP and GCA credentials while hiding self-reported certs in verified-only mode", async () => {
    state.profileRow = {
      user_id: "user-1",
      public_username: "taylor-operator",
      display_name: "Taylor Operator",
      headline: "5-axis CNC Machinist",
      bio: "Builds aerospace parts.",
      years_experience: 8,
      location_city: "Wichita",
      location_region: "KS",
      location_country: "USA",
      linkedin_url: null,
      portfolio_url: null,
      twitter_url: null,
      instagram_url: null,
      facebook_url: null,
      youtube_url: null,
      github_url: null,
      website_url: null,
      avatar_url: null,
      banner_url: null,
      resume_pdf_url: null,
      willing_to_relocate: true,
      open_to_work: true,
      preferred_employment_types: null,
      public_published_at: "2026-04-01T00:00:00.000Z",
      show_only_verified_certs: true,
      social_visibility: null,
    };
    state.certs = [
      {
        id: "cert-1",
        name: "OAP Lathe Approval",
        issuer: "JobLine",
        issued_date: "2026-03-01",
        expires_date: null,
        credential_url: "https://jobline.ai/verify/OAP-AAA111-2026",
        attachment_url: null,
        verification_source: "verified_oap",
        linked_cert_id: "OAP-AAA111-2026",
        is_public: true,
      },
      {
        id: "cert-2",
        name: "GCA Fanuc Badge",
        issuer: "JobLine",
        issued_date: "2026-03-02",
        expires_date: null,
        credential_url: "https://jobline.ai/verify/GCA-BBB222-2026",
        attachment_url: null,
        verification_source: "verified_gca",
        linked_cert_id: "GCA-BBB222-2026",
        is_public: true,
      },
      {
        id: "cert-3",
        name: "Forklift License",
        issuer: "External Org",
        issued_date: "2026-01-15",
        expires_date: null,
        credential_url: null,
        attachment_url: null,
        verification_source: "self_reported",
        linked_cert_id: null,
        is_public: true,
      },
    ];
    state.skills = [{ id: "skill-1", skill: "GD&T", proficiency: "advanced", years_used: 5 }];
    state.machines = [{ id: "machine-1", machine_category: "Mill", machine_make: "Haas", machine_model: "VF-2", control_type: "NGC", proficiency: "Expert", years_experience: 6 }];

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Taylor Operator/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/JobLine OAP — Approved/i)).toBeInTheDocument();
    expect(screen.getByText(/G-Code Academy badges/i)).toBeInTheDocument();
    expect(screen.getByText(/OAP Lathe Approval/i)).toBeInTheDocument();
    expect(screen.getByText(/GCA Fanuc Badge/i)).toBeInTheDocument();
    expect(screen.queryByText(/Forklift License/i)).not.toBeInTheDocument();
    expect(screen.getByText(/2 verified credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/Open to work/i)).toBeInTheDocument();
    expect(screen.getByText(/Will relocate/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Machine proficiencies/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Skills/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Employers: contact via Talent Search/i)).toBeInTheDocument();
  });

  it("shows self-reported skills when verified-only mode is off", async () => {
    state.profileRow = {
      user_id: "user-1",
      public_username: "taylor-operator",
      display_name: "Taylor Operator",
      headline: "5-axis CNC Machinist",
      bio: "Builds aerospace parts.",
      years_experience: 8,
      location_city: "Wichita",
      location_region: "KS",
      location_country: "USA",
      linkedin_url: null,
      portfolio_url: null,
      twitter_url: null,
      instagram_url: null,
      facebook_url: null,
      youtube_url: null,
      github_url: null,
      website_url: null,
      avatar_url: null,
      banner_url: null,
      resume_pdf_url: null,
      willing_to_relocate: false,
      open_to_work: true,
      preferred_employment_types: null,
      public_published_at: "2026-04-01T00:00:00.000Z",
      show_only_verified_certs: false,
      social_visibility: null,
    };
    state.skills = [{ id: "skill-1", skill: "GD&T", proficiency: "advanced", years_used: 5 }];

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Taylor Operator/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: /Skills/i })).toBeInTheDocument();
    expect(screen.getByText(/GD&T/i)).toBeInTheDocument();
  });
});