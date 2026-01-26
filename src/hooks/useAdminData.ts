import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type TeamRole = Database["public"]["Enums"]["team_role"];

export interface UserWithRole {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  roles: AppRole[];
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
  totalTeams: number;
  totalStations: number;
  totalHandoffs: number;
  activeStations: number;
  handoffsToday: number;
  handoffsThisWeek: number;
}

export function useAdminAccess() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsSupervisor(false);
        setLoading(false);
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (roles) {
        const roleList = roles.map((r) => r.role);
        setIsAdmin(roleList.includes("admin"));
        setIsSupervisor(roleList.includes("supervisor"));
      }
      setLoading(false);
    };

    checkAccess();
  }, [user]);

  return { isAdmin, isSupervisor, hasAdminAccess: isAdmin || isSupervisor, loading };
}

export function useAllUsers() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      setLoading(false);
      return;
    }

    // Fetch all user roles
    const { data: allRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*");

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      setLoading(false);
      return;
    }

    // Combine profiles with their roles
    const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => ({
      id: profile.id,
      user_id: profile.user_id,
      email: profile.email,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      roles: (allRoles || [])
        .filter((r) => r.user_id === profile.user_id)
        .map((r) => r.role),
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserRole = async (
    userId: string,
    role: AppRole,
    action: "add" | "remove"
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

    await fetchUsers();
    return { error: null };
  };

  return { users, loading, fetchUsers, updateUserRole };
}

export function useAllTeams() {
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [loading, setLoading] = useState(true);

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

  const deleteTeam = async (teamId: string) => {
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    if (error) return { error };
    await fetchTeams();
    return { error: null };
  };

  return { teams, loading, fetchTeams, deleteTeam };
}

export function useAllStations() {
  const [stations, setStations] = useState<StationWithTeam[]>([]);
  const [loading, setLoading] = useState(true);

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
  }) => {
    const { error } = await supabase.from("stations").insert(station);
    if (error) return { error };
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
    }>
  ) => {
    const { error } = await supabase.from("stations").update(updates).eq("id", id);
    if (error) return { error };
    await fetchStations();
    return { error: null };
  };

  const deleteStation = async (id: string) => {
    const { error } = await supabase.from("stations").delete().eq("id", id);
    if (error) return { error };
    await fetchStations();
    return { error: null };
  };

  return { stations, loading, fetchStations, createStation, updateStation, deleteStation };
}

export function useSystemStats() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalTeams: 0,
    totalStations: 0,
    totalHandoffs: 0,
    activeStations: 0,
    handoffsToday: 0,
    handoffsThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);

    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const [
      { count: userCount },
      { count: teamCount },
      { count: stationCount },
      { count: handoffCount },
      { count: activeCount },
      { count: todayCount },
      { count: weekCount },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("teams").select("*", { count: "exact", head: true }),
      supabase.from("stations").select("*", { count: "exact", head: true }),
      supabase.from("handoff_records").select("*", { count: "exact", head: true }),
      supabase.from("stations").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("handoff_records").select("*", { count: "exact", head: true }).eq("date", today),
      supabase.from("handoff_records").select("*", { count: "exact", head: true }).gte("date", weekAgo),
    ]);

    setStats({
      totalUsers: userCount || 0,
      totalTeams: teamCount || 0,
      totalStations: stationCount || 0,
      totalHandoffs: handoffCount || 0,
      activeStations: activeCount || 0,
      handoffsToday: todayCount || 0,
      handoffsThisWeek: weekCount || 0,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, fetchStats };
}
