import { useState, useEffect, useCallback } from "react";
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

export function useUserOrganization() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizationRole, setOrganizationRole] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamMembership[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch organization membership
      const { data: orgMembership } = await supabase
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
            subscription_status
          )
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (orgMembership?.organizations) {
        // Handle both array and object cases
        const org = Array.isArray(orgMembership.organizations) 
          ? orgMembership.organizations[0] 
          : orgMembership.organizations;
        setOrganization(org as Organization);
        setOrganizationRole(orgMembership.role);
      }

      // Fetch team memberships
      const { data: teamMemberships } = await supabase
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
        .eq("user_id", user.id);

      if (teamMemberships) {
        const formattedTeams: TeamMembership[] = teamMemberships.map((tm: any) => ({
          id: tm.id,
          team_id: tm.team_id,
          role: tm.role,
          joined_at: tm.joined_at,
          team: Array.isArray(tm.teams) ? tm.teams[0] : tm.teams,
        })).filter(tm => tm.team);
        setTeams(formattedTeams);
      }

      // Fetch user roles (app-level roles like admin, operator, etc.)
      const { data: roles } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (roles) {
        setUserRoles(roles as UserRole[]);
      }
    } catch (error) {
      console.error("Error fetching user organization data:", error);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const primaryRole = userRoles.length > 0 ? userRoles[0].role : "operator";
  const primaryTeam = teams.length > 0 ? teams[0] : null;

  return {
    organization,
    organizationRole,
    teams,
    userRoles,
    primaryRole,
    primaryTeam,
    loading,
    refresh: fetchUserData,
  };
}
