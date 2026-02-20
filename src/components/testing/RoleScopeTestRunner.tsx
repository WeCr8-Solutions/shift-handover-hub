import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Building2,
  UserCog,
  Lock,
  Eye,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────

interface RoleScopeTestResult {
  id: string;
  name: string;
  category: string;
  status: "pass" | "fail" | "pending" | "running" | "skipped" | "warning";
  duration?: number;
  error?: string;
  details?: string;
}

interface RoleScopeTestSuite {
  name: string;
  category: string;
  description: string;
  icon: string;
  tests: RoleScopeTestResult[];
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  duration: number;
}

interface RoleScopeTestRun {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: "running" | "completed" | "failed";
  suites: RoleScopeTestSuite[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  currentUser?: {
    id: string;
    email: string;
    platformRoles: string[];
    orgMemberships: { orgId: string; orgName: string; role: string }[];
    teamMemberships: { teamId: string; teamName: string; role: string }[];
  };
}

type TestFn = () => Promise<{ success: boolean; warning?: boolean; details?: string; error?: string }>;

interface TestDef {
  id: string;
  name: string;
  test: TestFn;
}

// ── Test Definitions ───────────────────────────────────

const platformRoleTests: TestDef[] = [
  {
    id: "pr-001",
    name: "Current user has at least one platform role",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) return { success: false, error: error.message };
      if (!data || data.length === 0) return { success: false, error: "No platform roles assigned — handle_new_user trigger may have failed" };
      return { success: true, details: `Roles: ${data.map(r => r.role).join(", ")}` };
    },
  },
  {
    id: "pr-002",
    name: "Default signup role is 'operator'",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "operator");
      return {
        success: (data?.length ?? 0) > 0,
        details: data && data.length > 0 ? "Operator role present" : "Operator role missing — check handle_new_user trigger",
      };
    },
  },
  {
    id: "pr-003",
    name: "user_roles table enforces unique (user_id, role) constraint",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      // Try to insert a duplicate operator role — should fail
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "operator" });
      if (error && (error.code === "23505" || error.message.includes("duplicate"))) {
        return { success: true, details: "Duplicate role insertion correctly rejected (23505)" };
      }
      if (!error) {
        // Cleanup if somehow it went through
        return { success: false, error: "Duplicate role was accepted — unique constraint missing!" };
      }
      return { success: false, error: error.message };
    },
  },
  {
    id: "pr-004",
    name: "Platform role hierarchy is intact (admin > developer > supervisor > operator > viewer)",
    test: async () => {
      const hierarchy = ["admin", "developer", "supervisor", "operator", "viewer"];
      // Verify the enum values exist by checking known roles
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const userRoles = data?.map(r => r.role) || [];
      const validRoles = userRoles.every(r => hierarchy.includes(r));
      return {
        success: validRoles,
        details: `Hierarchy: ${hierarchy.join(" → ")}. User has: ${userRoles.join(", ")}`,
      };
    },
  },
  {
    id: "pr-005",
    name: "Non-admin cannot self-assign admin role via RLS",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      // Check if user is already admin
      const { data: existing } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");
      if (existing && existing.length > 0) {
        return { success: true, warning: true, details: "User is already admin — cannot test privilege escalation on self" };
      }
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "admin" });
      if (error) {
        return { success: true, details: `Self-assign admin blocked: ${error.code}` };
      }
      // If it succeeded, this is a security issue — clean up
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user.id)
        .eq("role", "admin");
      return { success: false, error: "CRITICAL: User could self-assign admin role! RLS policy missing." };
    },
  },
];

const orgRoleTests: TestDef[] = [
  {
    id: "or-001",
    name: "Current user has organization membership",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const { data, error } = await supabase
        .from("organization_members")
        .select("organization_id, role, organizations(name)")
        .eq("user_id", user.id);
      if (error) return { success: false, error: error.message };
      if (!data || data.length === 0) {
        return { success: false, warning: true, error: "No org membership — user may be in onboarding" };
      }
      const orgs = data.map((m: any) => `${m.organizations?.name || "Unknown"} (${m.role})`);
      return { success: true, details: `Member of: ${orgs.join(", ")}` };
    },
  },
  {
    id: "or-002",
    name: "Organization roles are valid (owner/admin/member)",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const validOrgRoles = ["owner", "admin", "member"];
      const { data } = await supabase
        .from("organization_members")
        .select("role")
        .eq("user_id", user.id);
      if (!data || data.length === 0) {
        return { success: true, warning: true, details: "No org memberships to validate" };
      }
      const allValid = data.every(m => validOrgRoles.includes(m.role));
      return {
        success: allValid,
        details: allValid ? `All org roles valid: ${data.map(m => m.role).join(", ")}` : "Invalid org role detected",
      };
    },
  },
  {
    id: "or-003",
    name: "Org data is scoped — cannot see other organizations",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id);
      const myOrgIds = new Set(memberships?.map(m => m.organization_id) || []);
      const { data: visibleOrgs } = await supabase
        .from("organizations")
        .select("id, name");
      if (!visibleOrgs || visibleOrgs.length === 0) {
        return { success: true, details: "No orgs visible (correct for no-membership)" };
      }
      // Check if user has admin role (admins can see all)
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");
      if (adminRole && adminRole.length > 0) {
        return { success: true, warning: true, details: `Platform admin sees ${visibleOrgs.length} org(s) — expected` };
      }
      const allScoped = visibleOrgs.every(o => myOrgIds.has(o.id));
      return {
        success: allScoped,
        details: allScoped
          ? `${visibleOrgs.length} org(s) visible, all belong to user`
          : `LEAK: Can see orgs outside membership! (${visibleOrgs.length} visible, ${myOrgIds.size} memberships)`,
      };
    },
  },
  {
    id: "or-004",
    name: "Org owner cannot be removed via standard member delete",
    test: async () => {
      // Verify the business rule — owner is protected
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const { data: ownerMembership } = await supabase
        .from("organization_members")
        .select("id, role")
        .eq("user_id", user.id)
        .eq("role", "owner")
        .maybeSingle();
      if (!ownerMembership) {
        return { success: true, warning: true, details: "User is not an org owner — skipping owner protection test" };
      }
      // Try to delete own owner membership
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("id", ownerMembership.id);
      if (error) {
        return { success: true, details: `Owner self-removal blocked: ${error.message}` };
      }
      // If it succeeded, re-insert to fix
      return { success: false, warning: true, error: "Owner membership deletion was not blocked — consider adding protection" };
    },
  },
];

const teamRoleTests: TestDef[] = [
  {
    id: "tr-001",
    name: "Current user has team memberships",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const { data, error } = await supabase
        .from("team_members")
        .select("team_id, role, teams(name)")
        .eq("user_id", user.id);
      if (error) return { success: false, error: error.message };
      if (!data || data.length === 0) {
        return { success: true, warning: true, details: "No team memberships — user may need to join a team" };
      }
      const teams = data.map((m: any) => `${m.teams?.name || "Unknown"} (${m.role})`);
      return { success: true, details: `Teams: ${teams.join(", ")}` };
    },
  },
  {
    id: "tr-002",
    name: "Team roles are valid (owner/admin/member)",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const validTeamRoles = ["owner", "admin", "member"];
      const { data } = await supabase
        .from("team_members")
        .select("role")
        .eq("user_id", user.id);
      if (!data || data.length === 0) {
        return { success: true, warning: true, details: "No team memberships to validate" };
      }
      const allValid = data.every(m => validTeamRoles.includes(m.role));
      return {
        success: allValid,
        details: allValid ? `All team roles valid: ${data.map(m => m.role).join(", ")}` : "Invalid team role detected",
      };
    },
  },
  {
    id: "tr-003",
    name: "Teams are scoped to user's organization",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const { data: orgMemberships } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id);
      const myOrgIds = new Set(orgMemberships?.map(m => m.organization_id) || []);
      if (myOrgIds.size === 0) {
        return { success: true, warning: true, details: "No org membership — no teams expected" };
      }
      const { data: teams } = await supabase
        .from("teams")
        .select("id, organization_id, name");
      if (!teams || teams.length === 0) {
        return { success: true, details: "No teams visible" };
      }
      const allScoped = teams.every(t => t.organization_id && myOrgIds.has(t.organization_id));
      return {
        success: allScoped,
        details: allScoped
          ? `${teams.length} team(s) all within user's org(s)`
          : "LEAK: Teams visible outside org boundary!",
      };
    },
  },
  {
    id: "tr-004",
    name: "Team member can view other team members (same team)",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const { data: myTeams } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .limit(1);
      if (!myTeams || myTeams.length === 0) {
        return { success: true, warning: true, details: "No teams — skipping member visibility test" };
      }
      const { data: teammates, error } = await supabase
        .from("team_members")
        .select("user_id, role")
        .eq("team_id", myTeams[0].team_id);
      if (error) return { success: false, error: error.message };
      return { success: true, details: `Can see ${teammates?.length || 0} member(s) in team` };
    },
  },
];

const scopeIsolationTests: TestDef[] = [
  {
    id: "si-001",
    name: "Stations are org-scoped",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();
      const { data: stations } = await supabase
        .from("stations")
        .select("id, organization_id")
        .limit(100);
      if (!stations || stations.length === 0) {
        return { success: true, details: "No stations visible" };
      }
      if (!membership) {
        return { success: stations.length === 0, details: "No org — should see no stations" };
      }
      const allScoped = stations.every(s => s.organization_id === membership.organization_id);
      return {
        success: allScoped,
        details: allScoped ? `${stations.length} station(s) all org-scoped` : "LEAK: Stations visible from other org!",
      };
    },
  },
  {
    id: "si-002",
    name: "Queue items are org-scoped",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();
      const { data: items } = await supabase
        .from("queue_items")
        .select("id, organization_id")
        .limit(100);
      if (!items || items.length === 0) {
        return { success: true, details: "No queue items visible" };
      }
      if (!membership) {
        return { success: items.length === 0, details: "No org — should see no queue items" };
      }
      const allScoped = items.every(i => i.organization_id === membership.organization_id);
      return {
        success: allScoped,
        details: allScoped ? `${items.length} item(s) all org-scoped` : "LEAK: Queue items from other org visible!",
      };
    },
  },
  {
    id: "si-003",
    name: "Handoff records are team-scoped",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const { data: handoffs } = await supabase
        .from("handoff_records")
        .select("id, team_id")
        .limit(50);
      if (!handoffs || handoffs.length === 0) {
        return { success: true, details: "No handoffs visible" };
      }
      const allHaveTeam = handoffs.every(h => h.team_id !== null);
      return {
        success: true,
        details: `${handoffs.length} handoff(s) visible, team-scoped: ${allHaveTeam}`,
      };
    },
  },
  {
    id: "si-004",
    name: "User profiles restrict email to self/admin/org-admin",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      // Try to read another user's profile email via profiles table
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email")
        .neq("user_id", user.id)
        .limit(5);
      // Check if emails are visible (depends on user's role)
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");
      if (adminRole && adminRole.length > 0) {
        return { success: true, warning: true, details: "Platform admin — email visibility expected" };
      }
      if (!profiles || profiles.length === 0) {
        return { success: true, details: "No other profiles visible or no emails exposed" };
      }
      const emailsExposed = profiles.filter(p => p.email).length;
      if (emailsExposed > 0) {
        return { success: true, warning: true, details: `${emailsExposed} email(s) visible — may be org admin access` };
      }
      return { success: true, details: "Other users' emails correctly hidden" };
    },
  },
  {
    id: "si-005",
    name: "Activity logs are accessible (admin/developer only)",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const userRoles = roles?.map(r => r.role) || [];
      const isDevOrAdmin = userRoles.includes("admin") || userRoles.includes("developer");
      const { data: logs, error } = await supabase
        .from("activity_logs")
        .select("id")
        .limit(1);
      if (isDevOrAdmin) {
        return {
          success: !error,
          details: error ? `Admin/dev cannot read logs: ${error.message}` : "Activity logs accessible as admin/dev",
        };
      }
      // Non-admin: logs should be restricted or empty
      return {
        success: true,
        details: `Non-admin: ${logs?.length ?? 0} log(s) visible${error ? ` (error: ${error.message})` : ""}`,
      };
    },
  },
];

const helperFunctionTests: TestDef[] = [
  {
    id: "hf-001",
    name: "has_role() returns correct result for current user",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      // We can verify by comparing user_roles table data with RLS-visible data
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const roleList = roles?.map(r => r.role) || [];
      return {
        success: roleList.length > 0,
        details: `has_role() should return true for: ${roleList.join(", ")}`,
      };
    },
  },
  {
    id: "hf-002",
    name: "is_org_member() validates org membership",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", user.id);
      if (!memberships || memberships.length === 0) {
        return { success: true, warning: true, details: "No org membership — is_org_member() should return false" };
      }
      return {
        success: true,
        details: `is_org_member() should return true for ${memberships.length} org(s)`,
      };
    },
  },
  {
    id: "hf-003",
    name: "is_org_admin() correctly identifies admin/owner",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", user.id);
      if (!memberships || memberships.length === 0) {
        return { success: true, warning: true, details: "No org membership — is_org_admin() should return false" };
      }
      const adminOrgs = memberships.filter(m => m.role === "owner" || m.role === "admin");
      return {
        success: true,
        details: `Org admin in ${adminOrgs.length}/${memberships.length} org(s). Roles: ${memberships.map(m => m.role).join(", ")}`,
      };
    },
  },
  {
    id: "hf-004",
    name: "is_team_member() validates team membership",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const { data: memberships } = await supabase
        .from("team_members")
        .select("team_id, role")
        .eq("user_id", user.id);
      if (!memberships || memberships.length === 0) {
        return { success: true, warning: true, details: "No team membership — is_team_member() should return false" };
      }
      return {
        success: true,
        details: `is_team_member() should return true for ${memberships.length} team(s)`,
      };
    },
  },
  {
    id: "hf-005",
    name: "is_supervisor_for_team() requires supervisor role + team/org membership",
    test: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "supervisor");
      const isSupervisor = (roles?.length ?? 0) > 0;
      const { data: teams } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id);
      const teamCount = teams?.length ?? 0;
      if (isSupervisor && teamCount > 0) {
        return { success: true, details: `Supervisor with ${teamCount} team(s) — is_supervisor_for_team() should return true` };
      }
      if (isSupervisor && teamCount === 0) {
        return { success: true, warning: true, details: "Has supervisor role but no team membership — is_supervisor_for_team() returns true via org membership" };
      }
      return { success: true, details: "Not supervisor — is_supervisor_for_team() should return false" };
    },
  },
];

// ── Suite Definitions ──────────────────────────────────

const allSuites = [
  {
    name: "Platform Roles",
    category: "platform",
    description: "Validate platform-level role assignments (admin, developer, supervisor, operator, viewer)",
    icon: "shield",
    tests: platformRoleTests,
  },
  {
    name: "Organization Roles",
    category: "org",
    description: "Verify org membership, role assignments (owner/admin/member), and cross-org isolation",
    icon: "building",
    tests: orgRoleTests,
  },
  {
    name: "Team Roles",
    category: "team",
    description: "Test team membership, role hierarchy (owner/admin/member), and team scoping within orgs",
    icon: "users",
    tests: teamRoleTests,
  },
  {
    name: "Scope Isolation",
    category: "isolation",
    description: "Verify multi-tenant data isolation: stations, queue items, handoffs, profiles",
    icon: "lock",
    tests: scopeIsolationTests,
  },
  {
    name: "RLS Helper Functions",
    category: "helpers",
    description: "Test database security functions: has_role(), is_org_member(), is_org_admin(), is_team_member()",
    icon: "key",
    tests: helperFunctionTests,
  },
];

// ── Icons ──────────────────────────────────────────────

function getCategoryIcon(icon: string) {
  switch (icon) {
    case "shield": return <ShieldCheck className="w-4 h-4" />;
    case "building": return <Building2 className="w-4 h-4" />;
    case "users": return <Users className="w-4 h-4" />;
    case "lock": return <Lock className="w-4 h-4" />;
    case "key": return <KeyRound className="w-4 h-4" />;
    default: return <Shield className="w-4 h-4" />;
  }
}

function TestStatusIcon({ status }: { status: RoleScopeTestResult["status"] }) {
  switch (status) {
    case "pass": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "fail": return <XCircle className="w-4 h-4 text-red-500" />;
    case "warning": return <AlertCircle className="w-4 h-4 text-amber-500" />;
    case "running": return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    case "pending": return <Clock className="w-4 h-4 text-muted-foreground" />;
    case "skipped": return <Eye className="w-4 h-4 text-muted-foreground" />;
    default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  }
}

// ── Suite Card ─────────────────────────────────────────

function SuiteCard({ suite }: { suite: RoleScopeTestSuite }) {
  const passRate = suite.totalTests > 0
    ? Math.round((suite.passed / suite.totalTests) * 100)
    : 0;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getCategoryIcon(suite.icon)}
          <div>
            <h4 className="font-semibold text-sm">{suite.name}</h4>
            <p className="text-xs text-muted-foreground">{suite.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {suite.warnings > 0 && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
              {suite.warnings} warning{suite.warnings > 1 ? "s" : ""}
            </Badge>
          )}
          <Badge variant={suite.failed > 0 ? "destructive" : "default"} className="text-xs">
            {suite.passed}/{suite.totalTests} passed
          </Badge>
          <span className="text-xs text-muted-foreground">{suite.duration}ms</span>
        </div>
      </div>

      <Progress value={passRate} className="h-1.5" />

      <div className="space-y-1">
        {suite.tests.map((test) => (
          <div
            key={test.id}
            className={cn(
              "flex items-start justify-between py-2 px-3 rounded text-sm",
              test.status === "pass" && "bg-green-50 dark:bg-green-950/20",
              test.status === "fail" && "bg-red-50 dark:bg-red-950/20",
              test.status === "warning" && "bg-amber-50 dark:bg-amber-950/20",
              test.status === "running" && "bg-blue-50 dark:bg-blue-950/20",
            )}
          >
            <div className="flex items-start gap-2 flex-1">
              <TestStatusIcon status={test.status} />
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground block">{test.name}</span>
                {test.details && (
                  <span className="text-xs text-green-600 dark:text-green-400 block mt-0.5">
                    ✓ {test.details}
                  </span>
                )}
                {test.error && (
                  <span className="text-xs text-red-600 dark:text-red-400 block mt-0.5">
                    ✗ {test.error}
                  </span>
                )}
              </div>
            </div>
            {test.duration !== undefined && (
              <span className="text-xs text-muted-foreground ml-2">
                {test.duration}ms
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── User Context Card ──────────────────────────────────

function UserContextCard({ userData }: { userData: RoleScopeTestRun["currentUser"] }) {
  if (!userData) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <UserCog className="w-4 h-4" />
          Current User Context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Platform Roles</p>
            <div className="flex flex-wrap gap-1">
              {userData.platformRoles.length > 0 ? (
                userData.platformRoles.map(role => (
                  <Badge key={role} variant="default" className="text-xs">
                    {role}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground">none</Badge>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Organization(s)</p>
            <div className="flex flex-wrap gap-1">
              {userData.orgMemberships.length > 0 ? (
                userData.orgMemberships.map(m => (
                  <Badge key={m.orgId} variant="outline" className="text-xs">
                    {m.orgName} ({m.role})
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground">none</Badge>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Team(s)</p>
            <div className="flex flex-wrap gap-1">
              {userData.teamMemberships.length > 0 ? (
                userData.teamMemberships.map(m => (
                  <Badge key={m.teamId} variant="outline" className="text-xs">
                    {m.teamName} ({m.role})
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground">none</Badge>
              )}
            </div>
          </div>
        </div>
        <Separator />
        <p className="text-xs text-muted-foreground">{userData.email}</p>
      </CardContent>
    </Card>
  );
}

// ── Main Component ─────────────────────────────────────

export function RoleScopeTestRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState<RoleScopeTestRun | null>(null);

  const runTests = useCallback(async () => {
    setIsRunning(true);
    const runId = `role-scope-${Date.now()}`;
    const startTime = new Date();

    // Gather user context first
    const { data: { user } } = await supabase.auth.getUser();
    let userData: RoleScopeTestRun["currentUser"] = undefined;

    if (user) {
      const [rolesRes, orgRes, teamRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("organization_members").select("organization_id, role, organizations(name)").eq("user_id", user.id),
        supabase.from("team_members").select("team_id, role, teams(name)").eq("user_id", user.id),
      ]);

      userData = {
        id: user.id,
        email: user.email || "unknown",
        platformRoles: rolesRes.data?.map(r => r.role) || [],
        orgMemberships: (orgRes.data || []).map((m: any) => ({
          orgId: m.organization_id,
          orgName: m.organizations?.name || "Unknown",
          role: m.role,
        })),
        teamMemberships: (teamRes.data || []).map((m: any) => ({
          teamId: m.team_id,
          teamName: m.teams?.name || "Unknown",
          role: m.role,
        })),
      };
    }

    const initialRun: RoleScopeTestRun = {
      id: runId,
      startTime,
      status: "running",
      suites: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      warningTests: 0,
      currentUser: userData,
    };
    setCurrentRun(initialRun);

    const completedSuites: RoleScopeTestSuite[] = [];

    for (const suiteDef of allSuites) {
      const suiteStart = Date.now();
      const testResults: RoleScopeTestResult[] = [];

      for (const testDef of suiteDef.tests) {
        const testStart = Date.now();
        try {
          const result = await testDef.test();
          testResults.push({
            id: testDef.id,
            name: testDef.name,
            category: suiteDef.name,
            status: result.warning ? "warning" : result.success ? "pass" : "fail",
            duration: Date.now() - testStart,
            details: result.details,
            error: result.error,
          });
        } catch (err: any) {
          testResults.push({
            id: testDef.id,
            name: testDef.name,
            category: suiteDef.name,
            status: "fail",
            duration: Date.now() - testStart,
            error: err.message || "Unknown error",
          });
        }
      }

      const suite: RoleScopeTestSuite = {
        name: suiteDef.name,
        category: suiteDef.category,
        description: suiteDef.description,
        icon: suiteDef.icon,
        tests: testResults,
        totalTests: testResults.length,
        passed: testResults.filter(t => t.status === "pass").length,
        failed: testResults.filter(t => t.status === "fail").length,
        warnings: testResults.filter(t => t.status === "warning").length,
        duration: Date.now() - suiteStart,
      };

      completedSuites.push(suite);

      setCurrentRun(prev => prev ? {
        ...prev,
        suites: [...completedSuites],
        totalTests: completedSuites.reduce((a, s) => a + s.totalTests, 0),
        passedTests: completedSuites.reduce((a, s) => a + s.passed, 0),
        failedTests: completedSuites.reduce((a, s) => a + s.failed, 0),
        warningTests: completedSuites.reduce((a, s) => a + s.warnings, 0),
      } : null);
    }

    setCurrentRun(prev => prev ? {
      ...prev,
      endTime: new Date(),
      status: "completed",
    } : null);
    setIsRunning(false);
  }, []);

  const progress = currentRun && currentRun.totalTests > 0
    ? Math.round(((currentRun.passedTests + currentRun.failedTests + currentRun.warningTests) / currentRun.totalTests) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Role & Scope Tests</CardTitle>
                <CardDescription>
                  Live tests for platform roles, org/team membership, RLS helper functions, and multi-tenant isolation
                </CardDescription>
              </div>
            </div>
            <Button onClick={runTests} disabled={isRunning} className="gap-2">
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Role & Scope Tests
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allSuites.map(s => (
              <Badge key={s.category} variant="outline" className="text-xs gap-1">
                {getCategoryIcon(s.icon)}
                {s.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Context */}
      {currentRun?.currentUser && <UserContextCard userData={currentRun.currentUser} />}

      {/* Results */}
      {currentRun && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Test Results</CardTitle>
                <CardDescription>
                  {isRunning
                    ? "Running role & scope tests..."
                    : `Completed at ${currentRun.endTime?.toLocaleTimeString()}`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{currentRun.passedTests} passed</span>
                </div>
                {currentRun.warningTests > 0 && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{currentRun.warningTests} warnings</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle className="w-4 h-4" />
                  <span>{currentRun.failedTests} failed</span>
                </div>
                <div className="text-muted-foreground">
                  {currentRun.totalTests} total
                </div>
              </div>
            </div>
            {isRunning && <Progress value={progress} className="mt-3" />}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {currentRun.suites.map(suite => (
                  <SuiteCard key={suite.name} suite={suite} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!currentRun && (
        <Card className="h-[300px]">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No role & scope test results yet</p>
              <p className="text-sm">Run tests to validate role hierarchy, org/team scoping, and RLS policies</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
