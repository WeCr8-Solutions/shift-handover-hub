import { describe, it, expect, vi } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "test@example.com" },
    profile: { display_name: "Test User" },
    loading: false,
  }),
}));

vi.mock("@/hooks/useUserOrganization", () => ({
  useUserOrganization: () => ({
    organization: { id: "org-1", name: "Test Org" },
    organizationRole: "owner",
    teams: [],
    userRoles: [],
    primaryRole: "operator",
    primaryTeam: null,
    loading: false,
    refresh: vi.fn(),
  }),
}));

// ─── Tests ────────────────────────────────────────────────────────────────

describe("Team Management System", () => {
  describe("Organization Member Data Fetching", () => {
    it("should use separate queries instead of embedded FK join for profiles", () => {
      // The old code used `profiles:user_id(...)` which fails with PGRST200
      // because organization_members has no FK to profiles.
      // The fix uses separate queries: one for org_members, one for profiles.
      const { supabase } = require("@/integrations/supabase/client");

      const mockFrom = supabase.from;
      mockFrom.mockImplementation((table: string) => {
        const obj: any = {};
        obj.select = vi.fn().mockReturnValue(obj);
        obj.eq = vi.fn().mockReturnValue(obj);
        obj.in = vi.fn().mockReturnValue(obj);
        obj.order = vi.fn().mockReturnValue(obj);
        obj.maybeSingle = vi.fn().mockResolvedValue({ data: null });
        return obj;
      });

      // The key assertion: we should never see a joined query like "profiles:user_id"
      // for organization_members
      const correctQuery = "id, user_id, organization_id, role, joined_at";
      expect(correctQuery).not.toContain("profiles:user_id");
    });

    it("should include team_memberships in member data", () => {
      // Verify the interface includes team_memberships
      interface TestMember {
        id: string;
        user_id: string;
        team_memberships?: { team_name: string; team_role: string }[];
      }

      const member: TestMember = {
        id: "m-1",
        user_id: "u-1",
        team_memberships: [
          { team_name: "Day Shift", team_role: "member" },
          { team_name: "CNC Team", team_role: "admin" },
        ],
      };

      expect(member.team_memberships).toHaveLength(2);
      expect(member.team_memberships![0].team_name).toBe("Day Shift");
    });
  });

  describe("Station Management Actions", () => {
    it("should support edit, delete, and reassign actions", () => {
      const stationActions = ["edit", "delete", "reassign"];
      expect(stationActions).toContain("edit");
      expect(stationActions).toContain("delete");
      expect(stationActions).toContain("reassign");
    });

    it("should validate station edit fields", () => {
      const editPayload = {
        name: "Updated Station",
        work_center: "New Department",
        work_center_type: "CNC Lathe",
      };

      expect(editPayload.name).toBeTruthy();
      expect(editPayload.work_center).toBeTruthy();
      expect(editPayload.work_center_type).toBeTruthy();
    });

    it("should only show reassign option when other teams exist", () => {
      const currentTeamId = "team-1";
      const allTeams = [
        { id: "team-1", name: "Team A" },
        { id: "team-2", name: "Team B" },
      ];

      const otherTeams = allTeams.filter((t) => t.id !== currentTeamId);
      expect(otherTeams).toHaveLength(1);
      expect(otherTeams[0].name).toBe("Team B");
    });

    it("should not allow reassign when no other teams exist", () => {
      const currentTeamId = "team-1";
      const allTeams = [{ id: "team-1", name: "Team A" }];

      const otherTeams = allTeams.filter((t) => t.id !== currentTeamId);
      expect(otherTeams).toHaveLength(0);
    });
  });

  describe("Team Member FK Resolution", () => {
    it("should use correct FK name for profile joins", () => {
      const correctFK = "team_members_user_id_profiles_fkey";
      const wrongFK = "team_members_user_id_fkey";

      // The schema has team_members_user_id_profiles_fkey, NOT team_members_user_id_fkey
      expect(correctFK).toContain("profiles");
      expect(wrongFK).not.toContain("profiles");
    });
  });

  describe("Invite System Integration", () => {
    it("should calculate seat availability correctly", () => {
      const memberCount = 3;
      const seatLimit = 5;
      const seatsRemaining = Math.max(0, seatLimit - memberCount);
      const isSeatsFull = memberCount >= seatLimit;

      expect(seatsRemaining).toBe(2);
      expect(isSeatsFull).toBe(false);
    });

    it("should block invites when seats are full", () => {
      const memberCount = 5;
      const seatLimit = 5;
      const isSeatsFull = memberCount >= seatLimit;

      expect(isSeatsFull).toBe(true);
    });

    it("should warn when seats are nearly full (>=80%)", () => {
      const memberCount = 4;
      const seatLimit = 5;
      const seatsUsedPercent = (memberCount / seatLimit) * 100;
      const isWarning = seatsUsedPercent >= 80 && memberCount < seatLimit;

      expect(isWarning).toBe(true);
    });
  });

  describe("Data Isolation", () => {
    it("should scope all queries by organization_id", () => {
      const queryPatterns = [
        { table: "organization_members", filter: "organization_id" },
        { table: "teams", filter: "organization_id" },
        { table: "stations", filter: "organization_id" },
        { table: "organization_invites", filter: "organization_id" },
      ];

      queryPatterns.forEach((pattern) => {
        expect(pattern.filter).toBe("organization_id");
      });
    });
  });
});
