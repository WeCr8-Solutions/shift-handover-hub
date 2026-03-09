import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database, Json } from "@/integrations/supabase/types";
import { useActivityLog } from "@/hooks/useActivityLog";

type AppRole = Database["public"]["Enums"]["app_role"];

// Auto-refresh interval for admin data (30 seconds)
const ADMIN_REFRESH_INTERVAL = 30000;
// Realtime debounce to avoid too frequent refreshes
const REALTIME_DEBOUNCE_MS = 1000;

export interface UserWithRole {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  roles: AppRole[];
  organization?: {
    id: string;
    name: string;
    role: string;
  } | null;
  teams?: {
    id: string;
    name: string;
    role: string;
  }[];
}

export interface OrganizationWithUsers {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string | null;
  subscription_status: string | null;
  users: UserWithRole[];
}

export interface TeamWithStats {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
  member_count: number;
  station_count: number;
}

export interface StationWithTeam {
  id: string;
  station_id: string;
  name: string;
  work_center: string;
  work_center_type: string;
  is_active: boolean;
  team_id: string | null;
  team_name: string | null;
  created_at: string;
}

export interface SystemStats {
  totalUsers: number;
  totalOrganizations: number;
  totalTeams: number;
  totalStations: number;
  totalHandoffs: number;
  activeStations: number;
  handoffsToday: number;
  handoffsThisWeek: number;
}

export interface OrganizationWithStats {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string | null;
  subscription_status: string | null;
  created_at: string;
  owner_id: string | null;
  owner_name: string | null;
  owner_email: string | null;
  member_count: number;
  team_count: number;
  station_count: number;
}

export function useAdminAccess() {
  const { user } = useAuth();
  // Platform-level roles (from user_roles table)
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [isEngineering, setIsEngineering] = useState(false);
  const [isProgramming, setIsProgramming] = useState(false);
  // Organization-level roles (from organization_members table)
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [isOrgOwner, setIsOrgOwner] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsSupervisor(false);
        setIsDeveloper(false);
        setIsEngineering(false);
        setIsProgramming(false);
        setIsOrgAdmin(false);
        setIsOrgOwner(false);
        setOrganizationId(null);
        setLoading(false);
        return;
      }

      // Fetch platform roles and org membership in parallel
      const [rolesResult, orgMembershipResult] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id),
        supabase
          .from("organization_members")
          .select("organization_id, role")
          .eq("user_id", user.id)
          .maybeSingle()
      ]);

      // Set platform-level roles
      if (rolesResult.data) {
        const roleList = rolesResult.data.map((r) => r.role);
        setIsAdmin(roleList.includes("admin"));
        setIsSupervisor(roleList.includes("supervisor"));
        setIsDeveloper(roleList.includes("developer"));
        setIsEngineering(roleList.includes("engineering"));
        setIsProgramming(roleList.includes("programming"));
      }

      // Set organization-level roles
      if (orgMembershipResult.data) {
        const orgRole = orgMembershipResult.data.role;
        setOrganizationId(orgMembershipResult.data.organization_id);
        setIsOrgOwner(orgRole === "owner");
        setIsOrgAdmin(orgRole === "owner" || orgRole === "admin");
      } else {
        setOrganizationId(null);
        setIsOrgOwner(false);
        setIsOrgAdmin(false);
      }

      setLoading(false);
    };

    checkAccess();
  }, [user]);

  // Computed access levels combining platform and org roles
  const hasPlatformAdminAccess = isAdmin; // Global platform admin
  const hasOrgAdminAccess = isOrgAdmin || isAdmin; // Org owner/admin OR platform admin
  const hasOrgSupervisorAccess = isSupervisor || hasOrgAdminAccess; // Supervisor OR org admin OR platform admin
  
  // Narrow access: can manage dimensions/routing tolerances (engineering, programming, supervisor, admin)
  const hasDimensionAccess = isEngineering || isProgramming || hasOrgSupervisorAccess;

  // SDK/Developer platform access (global tools, not org-scoped)
  const hasPlatformAccess = isAdmin || isDeveloper;

  return { 
    // Platform roles
    isAdmin, 
    isSupervisor, 
    isDeveloper,
    isEngineering,
    isProgramming,
    // Organization roles
    isOrgAdmin,
    isOrgOwner,
    organizationId,
    // Combined access checks
    hasPlatformAdminAccess, // Only platform admins
    hasPlatformAccess, // SDK-level tools (admin + developer)
    hasOrgAdminAccess, // Org admins + platform admins
    hasOrgSupervisorAccess, // Supervisors + org admins + platform admins
    hasDimensionAccess, // Engineering + programming + supervisors + admins (dimensions only)
    hasAdminAccess: hasOrgSupervisorAccess, // Legacy: anyone with supervisor+ access
    hasTestingAccess: isDeveloper || isAdmin, // Developers and platform admins
    loading 
  };
}

export function useAllUsers(options?: { organizationId?: string | null }) {
  const orgId = options?.organizationId ?? null;
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { logActivity } = useActivityLog();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    // Fetch all data in parallel — scope org members query if orgId provided
    const orgMembersQuery = orgId
      ? supabase.from("organization_members").select("*").eq("organization_id", orgId)
      : supabase.from("organization_members").select("*");

    const orgsQuery = orgId
      ? supabase.from("organizations").select("*").eq("id", orgId)
      : supabase.from("organizations").select("*");

    const [profilesResult, rolesResult, orgMembersResult, orgsResult, teamMembersResult, teamsResult] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      orgMembersQuery,
      orgsQuery,
      supabase.from("team_members").select("*"),
      supabase.from("teams").select("id, name"),
    ]);

    if (profilesResult.error) {
      console.error("Error fetching profiles:", profilesResult.error);
      setLoading(false);
      return;
    }

    const profiles = profilesResult.data || [];
    const allRoles = rolesResult.data || [];
    const orgMembers = orgMembersResult.data || [];
    const allOrgs = orgsResult.data || [];
    const teamMembers = teamMembersResult.data || [];
    const allTeams = teamsResult.data || [];

    // If org-scoped, only include profiles that are members of this org
    const orgMemberUserIds = orgId ? new Set(orgMembers.map(om => om.user_id)) : null;
    const scopedProfiles = orgMemberUserIds
      ? profiles.filter(p => orgMemberUserIds.has(p.user_id))
      : profiles;

    // Build users with roles, org membership, and team membership
    const usersWithRoles: UserWithRole[] = scopedProfiles.map((profile) => {
      const userOrgMembership = orgMembers.find((om) => om.user_id === profile.user_id);
      const userOrg = userOrgMembership 
        ? allOrgs.find((o) => o.id === userOrgMembership.organization_id)
        : null;
      
      const userTeamMemberships = teamMembers.filter((tm) => tm.user_id === profile.user_id);
      const userTeams = userTeamMemberships.map((tm) => {
        const team = allTeams.find((t) => t.id === tm.team_id);
        return team ? { id: team.id, name: team.name, role: tm.role } : null;
      }).filter(Boolean) as { id: string; name: string; role: string }[];

      return {
        id: profile.id,
        user_id: profile.user_id,
        email: profile.email,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        roles: allRoles.filter((r) => r.user_id === profile.user_id).map((r) => r.role),
        organization: userOrg ? {
          id: userOrg.id,
          name: userOrg.name,
          role: userOrgMembership?.role || 'member',
        } : null,
        teams: userTeams,
      };
    });

    // Group users by organization
    const orgMap = new Map<string, OrganizationWithUsers>();
    
    if (!orgId) {
      // Platform view: add "No Organization" bucket
      orgMap.set("no-org", {
        id: "no-org",
        name: "No Organization",
        slug: "no-org",
        subscription_tier: null,
        subscription_status: null,
        users: [],
      });
    }

    // Add all organizations
    allOrgs.forEach((org) => {
      orgMap.set(org.id, {
        id: org.id,
        name: org.name,
        slug: org.slug,
        subscription_tier: org.subscription_tier,
        subscription_status: org.subscription_status,
        users: [],
      });
    });

    // Assign users to organizations
    usersWithRoles.forEach((user) => {
      const userOrgId = user.organization?.id || "no-org";
      const org = orgMap.get(userOrgId);
      if (org) {
        org.users.push(user);
      }
    });

    // Convert to array and sort by user count
    const orgArray = Array.from(orgMap.values())
      .filter((org) => org.users.length > 0)
      .sort((a, b) => b.users.length - a.users.length);

    setUsers(usersWithRoles);
    setOrganizations(orgArray);
    setLastUpdated(new Date());
    setLoading(false);
  }, [orgId]);

  // Debounced refresh for realtime events
  const debouncedRefresh = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchUsers();
    }, REALTIME_DEBOUNCE_MS);
  }, [fetchUsers]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Auto-refresh interval for admins to keep data live
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsers();
    }, ADMIN_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchUsers]);

  // Realtime subscriptions for live updates
  useEffect(() => {
    const channel = supabase
      .channel("admin-users-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => debouncedRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles" },
        () => debouncedRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "organization_members" },
        () => debouncedRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "organizations" },
        () => debouncedRefresh()
      )
      .subscribe();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [debouncedRefresh]);

  const updateUserRole = async (
    userId: string,
    role: AppRole,
    action: "add" | "remove",
    targetUserEmail?: string
  ) => {
    if (action === "add") {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) return { error };
    } else {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) return { error };
    }

    // Log the role change
    await logActivity(
      "user_role_changed",
      `${action === "add" ? "Added" : "Removed"} '${role}' role ${action === "add" ? "to" : "from"} user`,
      { target_user_id: userId, target_email: targetUserEmail, role, action }
    );

    await fetchUsers();
    return { error: null };
  };

  return { users, organizations, loading, lastUpdated, fetchUsers, updateUserRole };
}

export function useAllTeams() {
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { logActivity } = useActivityLog();

  const fetchTeams = useCallback(async () => {
    setLoading(true);

    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: false });

    if (teamsError) {
      console.error("Error fetching teams:", teamsError);
      setLoading(false);
      return;
    }

    // Get member counts
    const { data: membersData } = await supabase
      .from("team_members")
      .select("team_id");

    // Get station counts
    const { data: stationsData } = await supabase
      .from("stations")
      .select("team_id");

    const teamsWithStats: TeamWithStats[] = (teamsData || []).map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      created_at: team.created_at,
      created_by: team.created_by,
      member_count: (membersData || []).filter((m) => m.team_id === team.id).length,
      station_count: (stationsData || []).filter((s) => s.team_id === team.id).length,
    }));

    setTeams(teamsWithStats);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const deleteTeam = async (teamId: string, teamName?: string) => {
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    if (error) return { error };
    
    await logActivity(
      "team_deleted",
      `Deleted team: ${teamName || teamId}`,
      { team_id: teamId, team_name: teamName }
    );
    
    await fetchTeams();
    return { error: null };
  };

  return { teams, loading, fetchTeams, deleteTeam };
}

export function useAllStations() {
  const [stations, setStations] = useState<StationWithTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const { logActivity } = useActivityLog();

  const fetchStations = useCallback(async () => {
    setLoading(true);

    const { data: stationsData, error: stationsError } = await supabase
      .from("stations")
      .select("*")
      .order("created_at", { ascending: false });

    if (stationsError) {
      console.error("Error fetching stations:", stationsError);
      setLoading(false);
      return;
    }

    // Get team names
    const { data: teamsData } = await supabase.from("teams").select("id, name");

    const stationsWithTeam: StationWithTeam[] = (stationsData || []).map((station) => ({
      id: station.id,
      station_id: station.station_id,
      name: station.name,
      work_center: station.work_center,
      work_center_type: station.work_center_type,
      is_active: station.is_active,
      team_id: station.team_id,
      team_name: teamsData?.find((t) => t.id === station.team_id)?.name || null,
      created_at: station.created_at,
    }));

    setStations(stationsWithTeam);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const createStation = async (station: {
    station_id: string;
    name: string;
    work_center: string;
    work_center_type: string;
    team_id: string | null;
    organization_id: string;
  }) => {
    const { error } = await supabase.from("stations").insert(station);
    if (error) return { error };
    
    await logActivity(
      "station_created",
      `Created station: ${station.name} (${station.station_id})`,
      { station_id: station.station_id, name: station.name, work_center: station.work_center }
    );
    
    await fetchStations();
    return { error: null };
  };

  const updateStation = async (
    id: string,
    updates: Partial<{
      name: string;
      work_center: string;
      work_center_type: string;
      is_active: boolean;
      team_id: string | null;
    }>,
    stationName?: string
  ) => {
    const { error } = await supabase.from("stations").update(updates).eq("id", id);
    if (error) return { error };
    
    await logActivity(
      "station_updated",
      `Updated station: ${stationName || id}`,
      { station_id: id, updates }
    );
    
    await fetchStations();
    return { error: null };
  };

  const deleteStation = async (id: string, stationName?: string) => {
    const { error } = await supabase.from("stations").delete().eq("id", id);
    if (error) return { error };
    
    await logActivity(
      "station_deleted",
      `Deleted station: ${stationName || id}`,
      { station_id: id, station_name: stationName }
    );
    
    await fetchStations();
    return { error: null };
  };

  return { stations, loading, fetchStations, createStation, updateStation, deleteStation };
}

export function useSystemStats() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalOrganizations: 0,
    totalTeams: 0,
    totalStations: 0,
    totalHandoffs: 0,
    activeStations: 0,
    handoffsToday: 0,
    handoffsThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);

    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const [
      { count: userCount },
      { count: orgCount },
      { count: teamCount },
      { count: stationCount },
      { count: handoffCount },
      { count: activeCount },
      { count: todayCount },
      { count: weekCount },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("organizations").select("*", { count: "exact", head: true }),
      supabase.from("teams").select("*", { count: "exact", head: true }),
      supabase.from("stations").select("*", { count: "exact", head: true }),
      supabase.from("handoff_records").select("*", { count: "exact", head: true }),
      supabase.from("stations").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("handoff_records").select("*", { count: "exact", head: true }).eq("date", today),
      supabase.from("handoff_records").select("*", { count: "exact", head: true }).gte("date", weekAgo),
    ]);

    setStats({
      totalUsers: userCount || 0,
      totalOrganizations: orgCount || 0,
      totalTeams: teamCount || 0,
      totalStations: stationCount || 0,
      totalHandoffs: handoffCount || 0,
      activeStations: activeCount || 0,
      handoffsToday: todayCount || 0,
      handoffsThisWeek: weekCount || 0,
    });

    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  // Debounced refresh for realtime events
  const debouncedRefresh = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchStats();
    }, REALTIME_DEBOUNCE_MS);
  }, [fetchStats]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
    }, ADMIN_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchStats]);

  // Realtime subscriptions for live stats
  useEffect(() => {
    const channel = supabase
      .channel("admin-stats-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => debouncedRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "organizations" },
        () => debouncedRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        () => debouncedRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stations" },
        () => debouncedRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "handoff_records" },
        () => debouncedRefresh()
      )
      .subscribe();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [debouncedRefresh]);

  return { stats, loading, lastUpdated, fetchStats };
}

export function useAllOrganizations() {
  const [organizations, setOrganizations] = useState<OrganizationWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { logActivity } = useActivityLog();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);

    // Fetch all data in parallel
    const [orgsResult, orgMembersResult, teamsResult, stationsResult, profilesResult] = await Promise.all([
      supabase.from("organizations").select("*").order("created_at", { ascending: false }),
      supabase.from("organization_members").select("*"),
      supabase.from("teams").select("id, organization_id"),
      supabase.from("stations").select("id, team_id"),
      supabase.from("profiles").select("user_id, display_name, email"),
    ]);

    if (orgsResult.error) {
      console.error("Error fetching organizations:", orgsResult.error);
      setLoading(false);
      return;
    }

    const orgs = orgsResult.data || [];
    const orgMembers = orgMembersResult.data || [];
    const teams = teamsResult.data || [];
    const stations = stationsResult.data || [];
    const profiles = profilesResult.data || [];

    // Build organizations with stats
    const orgsWithStats: OrganizationWithStats[] = orgs.map((org) => {
      // Find owner
      const ownerMembership = orgMembers.find((m) => m.organization_id === org.id && m.role === "owner");
      const ownerProfile = ownerMembership 
        ? profiles.find((p) => p.user_id === ownerMembership.user_id)
        : null;

      // Count members
      const memberCount = orgMembers.filter((m) => m.organization_id === org.id).length;

      // Count teams belonging to this org
      const orgTeams = teams.filter((t) => t.organization_id === org.id);
      const teamCount = orgTeams.length;

      // Count stations belonging to teams in this org
      const orgTeamIds = orgTeams.map((t) => t.id);
      const stationCount = stations.filter((s) => s.team_id && orgTeamIds.includes(s.team_id)).length;

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        subscription_tier: org.subscription_tier,
        subscription_status: org.subscription_status,
        created_at: org.created_at,
        owner_id: ownerMembership?.user_id || null,
        owner_name: ownerProfile?.display_name || null,
        owner_email: ownerProfile?.email || null,
        member_count: memberCount,
        team_count: teamCount,
        station_count: stationCount,
      };
    });

    setOrganizations(orgsWithStats);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  // Debounced refresh for realtime events
  const debouncedRefresh = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchOrganizations();
    }, REALTIME_DEBOUNCE_MS);
  }, [fetchOrganizations]);

  // Initial fetch
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrganizations();
    }, ADMIN_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchOrganizations]);

  // Realtime subscriptions for live organization updates
  useEffect(() => {
    const channel = supabase
      .channel("admin-orgs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "organizations" },
        () => debouncedRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "organization_members" },
        () => debouncedRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => debouncedRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        () => debouncedRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stations" },
        () => debouncedRefresh()
      )
      .subscribe();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [debouncedRefresh]);

  const deleteOrganization = async (orgId: string, orgName?: string) => {
    const { error } = await supabase.from("organizations").delete().eq("id", orgId);
    if (error) return { error };
    
    // Using team_deleted as closest activity type for organization deletion
    await logActivity(
      "team_deleted",
      `Deleted organization: ${orgName || orgId}`,
      { organization_id: orgId, organization_name: orgName, entity_type: "organization" }
    );
    
    await fetchOrganizations();
    return { error: null };
  };

  return { organizations, loading, lastUpdated, fetchOrganizations, deleteOrganization };
}
