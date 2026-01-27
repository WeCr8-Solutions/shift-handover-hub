import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  joined_at: string;
  profile?: {
    display_name: string;
    email: string;
    avatar_url: string | null;
  };
  app_roles?: AppRole[];
}

export function useOrganizationMembers(organizationId: string | null) {
  const { user } = useAuth();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!organizationId || !user) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Check if current user is org admin
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .maybeSingle();

    setIsOrgAdmin(membership?.role === "owner" || membership?.role === "admin");

    // Fetch all org members with their profiles
    const { data: orgMembers, error } = await supabase
      .from("organization_members")
      .select(`
        id,
        user_id,
        organization_id,
        role,
        joined_at,
        profiles:user_id (
          display_name,
          email,
          avatar_url
        )
      `)
      .eq("organization_id", organizationId)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error fetching org members:", error);
      setLoading(false);
      return;
    }

    // Fetch app roles for all members
    const userIds = orgMembers?.map((m: any) => m.user_id) || [];
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    // Combine data
    const membersWithRoles: OrganizationMember[] = (orgMembers || []).map((m: any) => ({
      id: m.id,
      user_id: m.user_id,
      organization_id: m.organization_id,
      role: m.role,
      joined_at: m.joined_at,
      profile: m.profiles ? {
        display_name: m.profiles.display_name,
        email: m.profiles.email,
        avatar_url: m.profiles.avatar_url,
      } : undefined,
      app_roles: userRoles
        ?.filter((r) => r.user_id === m.user_id)
        .map((r) => r.role as AppRole) || [],
    }));

    setMembers(membersWithRoles);
    setLoading(false);
  }, [organizationId, user]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = async (email: string, orgRole: "admin" | "member" = "member") => {
    if (!organizationId) return { error: new Error("No organization selected") };

    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (profileError || !profile) {
      return { error: new Error("User not found with that email. They must sign up first.") };
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", profile.user_id)
      .maybeSingle();

    if (existing) {
      return { error: new Error("User is already a member of this organization.") };
    }

    // Add to organization
    const { error } = await supabase
      .from("organization_members")
      .insert({
        organization_id: organizationId,
        user_id: profile.user_id,
        role: orgRole,
      });

    if (!error) {
      await fetchMembers();
    }
    return { error };
  };

  const updateMemberOrgRole = async (memberId: string, newRole: "admin" | "member") => {
    const { error } = await supabase
      .from("organization_members")
      .update({ role: newRole })
      .eq("id", memberId);

    if (!error) {
      await fetchMembers();
    }
    return { error };
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", memberId);

    if (!error) {
      await fetchMembers();
    }
    return { error };
  };

  const assignAppRole = async (userId: string, role: AppRole) => {
    // Only allow supervisor and operator roles to be assigned by org admins
    if (!["supervisor", "operator"].includes(role)) {
      return { error: new Error("You can only assign supervisor or operator roles.") };
    }

    // Check if user already has this role
    const { data: existing } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", role)
      .maybeSingle();

    if (existing) {
      return { error: new Error("User already has this role.") };
    }

    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role });

    if (!error) {
      await fetchMembers();
    }
    return { error };
  };

  const removeAppRole = async (userId: string, role: AppRole) => {
    // Only allow supervisor and operator roles to be removed by org admins
    if (!["supervisor", "operator"].includes(role)) {
      return { error: new Error("You can only remove supervisor or operator roles.") };
    }

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);

    if (!error) {
      await fetchMembers();
    }
    return { error };
  };

  return {
    members,
    loading,
    isOrgAdmin,
    addMember,
    updateMemberOrgRole,
    removeMember,
    assignAppRole,
    removeAppRole,
    refreshMembers: fetchMembers,
  };
}
