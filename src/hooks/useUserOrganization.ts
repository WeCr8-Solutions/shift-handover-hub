import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  requires_us_person_declaration?: boolean | null;
}

interface OrganizationMembership {
  id: string;
  organization_id: string;
  role: string;
  joined_at: string;
  organization: Organization;
}

interface TeamMembership {
  id: string;
  team_id: string;
  role: string;
  joined_at: string;
  team: {
    id: string;
    name: string;
    description: string | null;
  };
}

interface UserRole {
  id: string;
  role: string;
  created_at: string;
}

interface UserOrgData {
  organization: Organization | null;
  organizationRole: string | null;
  teams: TeamMembership[];
  userRoles: UserRole[];
}

async function fetchUserOrgData(userId: string): Promise<UserOrgData> {
  const [orgMembershipResult, teamMembershipsResult, rolesResult] = await Promise.all([
    supabase
      .from("organization_members")
      .select(`
        id,
        organization_id,
        role,
        joined_at,
        organizations:organization_id (
          id,
          name,
          slug,
          description,
          logo_url,
          subscription_tier,
          subscription_status,
          trial_ends_at,
          requires_us_person_declaration
        )
      `)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("team_members")
      .select(`
        id,
        team_id,
        role,
        joined_at,
        teams:team_id (
          id,
          name,
          description
        )
      `)
      .eq("user_id", userId),
    supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId),
  ]);

  let organization: Organization | null = null;
  let organizationRole: string | null = null;

  const orgMembership = orgMembershipResult.data;
  if (orgMembership?.organizations) {
    const org = Array.isArray(orgMembership.organizations)
      ? orgMembership.organizations[0]
      : orgMembership.organizations;
    organization = org as Organization;
    organizationRole = orgMembership.role;
  }

  let teams: TeamMembership[] = [];
  const teamMemberships = teamMembershipsResult.data;
  if (teamMemberships) {
    teams = teamMemberships
      .map((tm: any) => ({
        id: tm.id,
        team_id: tm.team_id,
        role: tm.role,
        joined_at: tm.joined_at,
        team: Array.isArray(tm.teams) ? tm.teams[0] : tm.teams,
      }))
      .filter((tm) => tm.team);
  }

  const userRoles: UserRole[] = (rolesResult.data as UserRole[]) || [];

  return { organization, organizationRole, teams, userRoles };
}

export function useUserOrganization() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["user-org", user?.id || "none"],
    queryFn: () => fetchUserOrgData(user!.id),
    enabled: !!user,
    staleTime: 5 * 60_000, // 5min — org data rarely changes
    gcTime: 10 * 60_000,
  });

  const organization = data?.organization ?? null;
  const organizationRole = data?.organizationRole ?? null;
  const teams = data?.teams ?? [];
  const userRoles = data?.userRoles ?? [];
  const primaryRole = userRoles.length > 0 ? userRoles[0].role : "operator";
  const primaryTeam = teams.length > 0 ? teams[0] : null;

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["user-org", user?.id || "none"] });
  }, [queryClient, user?.id]);

  return {
    organization,
    organizationRole,
    teams,
    userRoles,
    primaryRole,
    primaryTeam,
    loading: isLoading,
    refresh,
  };
}
