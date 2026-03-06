import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getSafeErrorMessage } from "@/lib/errorHandling";

export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  profile?: {
    display_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export function useTeams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = useCallback(async () => {
    if (!user) {
      setTeams([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTeams(data as Team[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const createTeam = async (name: string, description?: string, organizationId?: string) => {
    if (!user) return { error: new Error("Not authenticated"), safeMessage: "Please sign in to continue." };

    // Organization ID is required for RLS compliance
    if (!organizationId) {
      return { error: new Error("Organization required to create a team"), safeMessage: "Please set up an organization first." };
    }

    // First create the team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({
        name,
        description,
        created_by: user.id,
        organization_id: organizationId,
      })
      .select()
      .single();

    if (teamError) {
      return { error: teamError, safeMessage: getSafeErrorMessage(teamError) };
    }

    // Then add the creator as owner
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: "owner",
        organization_id: organizationId,
      });

    if (memberError) {
      return { error: memberError, safeMessage: getSafeErrorMessage(memberError) };
    }

    await fetchTeams();
    return { data: team, error: null, safeMessage: null };
  };

  const updateTeam = async (teamId: string, updates: { name?: string; description?: string }) => {
    const { error } = await supabase
      .from("teams")
      .update(updates)
      .eq("id", teamId);

    if (!error) {
      await fetchTeams();
    }
    return { error };
  };

  const deleteTeam = async (teamId: string) => {
    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId);

    if (!error) {
      await fetchTeams();
    }
    return { error };
  };

  return {
    teams,
    loading,
    createTeam,
    updateTeam,
    deleteTeam,
    refreshTeams: fetchTeams,
  };
}

export function useTeamMembers(teamId: string | null) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!teamId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("team_members")
      .select(`
        *,
        profile:profiles!team_members_user_id_profiles_fkey(display_name, email, avatar_url)
      `)
      .eq("team_id", teamId)
      .order("joined_at", { ascending: true });

    if (!error && data) {
      // Transform the data to match our interface
      const transformedData = data.map((member: any) => ({
        ...member,
        profile: member.profile ? {
          display_name: member.profile.display_name,
          email: member.profile.email,
          avatar_url: member.profile.avatar_url,
        } : undefined,
      }));
      setMembers(transformedData);
    }
    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = async (email: string, role: "admin" | "member" = "member") => {
    if (!teamId) return { error: new Error("No team selected") };

    // First find the user by email
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (profileError || !profiles) {
      return { 
        error: new Error("User not found with that email"), 
        safeMessage: "No user found with that email. They may need to sign up first, or you can generate an invite code for them." 
      };
    }

    // Get org_id from team
    const { data: teamData } = await supabase
      .from("teams")
      .select("organization_id")
      .eq("id", teamId)
      .single();

    // Add them to the team
    const { error } = await supabase
      .from("team_members")
      .insert({
        team_id: teamId,
        user_id: profiles.user_id,
        role,
        organization_id: teamData?.organization_id || "",
      });

    if (!error) {
      await fetchMembers();
    }
    return { error };
  };

  const updateMemberRole = async (memberId: string, role: "admin" | "member") => {
    const { error } = await supabase
      .from("team_members")
      .update({ role })
      .eq("id", memberId);

    if (!error) {
      await fetchMembers();
    }
    return { error };
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId);

    if (!error) {
      await fetchMembers();
    }
    return { error };
  };

  return {
    members,
    loading,
    addMember,
    updateMemberRole,
    removeMember,
    refreshMembers: fetchMembers,
  };
}
