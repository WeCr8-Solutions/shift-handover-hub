import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

// Org admins can only assign these roles - platform roles (admin, developer) are reserved
const ORG_ASSIGNABLE_ROLES: AppRole[] = ['supervisor', 'operator', 'viewer'];

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
  team_memberships?: { team_name: string; team_role: string }[];
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

    // Fetch all org members (no embedded join — organization_members has no FK to profiles)
    const { data: orgMembers, error } = await supabase
      .from("organization_members")
      .select("id, user_id, organization_id, role, joined_at")
      .eq("organization_id", organizationId)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error fetching org members:", error);
      setLoading(false);
      return;
    }

    const userIds = orgMembers?.map((m: any) => m.user_id) || [];

    // Fetch profiles separately
    const { data: profiles } = userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, display_name, email, avatar_url")
          .in("user_id", userIds)
      : { data: [] };

    const profileMap = new Map(
      (profiles || []).map((p: any) => [p.user_id, p])
    );

    // Fetch app roles for all members
    const { data: userRoles } = userIds.length > 0
      ? await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds)
      : { data: [] };

    // Fetch team memberships for all members
    const { data: teamMemberships } = userIds.length > 0
      ? await supabase
          .from("team_members")
          .select("user_id, team_id, role, teams:team_id(id, name)")
          .in("user_id", userIds)
      : { data: [] };

    const teamMap = new Map<string, { team_name: string; team_role: string }[]>();
    (teamMemberships || []).forEach((tm: any) => {
      const team = Array.isArray(tm.teams) ? tm.teams[0] : tm.teams;
      if (!team) return;
      const existing = teamMap.get(tm.user_id) || [];
      existing.push({ team_name: team.name, team_role: tm.role });
      teamMap.set(tm.user_id, existing);
    });

    // Combine data
    const membersWithRoles: OrganizationMember[] = (orgMembers || []).map((m: any) => {
      const prof = profileMap.get(m.user_id);
      return {
        id: m.id,
        user_id: m.user_id,
        organization_id: m.organization_id,
        role: m.role,
        joined_at: m.joined_at,
        profile: prof ? {
          display_name: prof.display_name,
          email: prof.email,
          avatar_url: prof.avatar_url,
        } : undefined,
        app_roles: (userRoles || [])
          .filter((r: any) => r.user_id === m.user_id)
          .map((r: any) => r.role as AppRole),
        team_memberships: teamMap.get(m.user_id) || [],
      };
    });

    setMembers(membersWithRoles);
    setLoading(false);
  }, [organizationId, user]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = async (email: string, orgRole: "admin" | "member" = "member") => {
    if (!organizationId || !user) return { error: new Error("No organization selected") };

    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    // User doesn't exist - return special response to allow creating an invite
    if (profileError || !profile) {
      return { 
        error: null, 
        userNotFound: true,
        email: email,
      };
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
    return { error, userNotFound: false };
  };

  const createPersonalInvite = async (
    email: string, 
    orgRole: "admin" | "member" = "member",
    appRole?: AppRole
  ) => {
    if (!organizationId || !user) return { error: new Error("No organization selected") };

    // Generate invite code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let inviteCode = "";
    for (let i = 0; i < 8; i++) {
      inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 7 days expiry
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("organization_invites")
      .insert({
        organization_id: organizationId,
        invite_code: inviteCode,
        created_by: user.id,
        org_role: orgRole,
        app_role: appRole || null,
        expires_at: expiresAt,
        max_uses: 1,
        invited_email: email.toLowerCase(),
      })
      .select()
      .single();

    if (error) {
      return { error };
    }

    const inviteLink = `${window.location.origin}/auth?invite=${inviteCode}`;
    
    return { 
      error: null, 
      inviteCreated: {
        code: inviteCode,
        link: inviteLink,
        email: email,
        id: data.id,
      }
    };
  };

  const updateMemberOrgRole = async (
    memberId: string,
    newRole: "owner" | "admin" | "member",
  ) => {
    if (newRole === "owner") {
      const target = members.find((m) => m.id === memberId);
      if (!target) return { error: new Error("Member not found") };
      const { error } = await (supabase as any).rpc("transfer_org_ownership", {
        _organization_id: target.organization_id,
        _to_user_id: target.user_id,
      });
      if (!error) await fetchMembers();
      return { error };
    }

    const { error } = await supabase
      .from("organization_members")
      .update({ role: newRole })
      .eq("id", memberId);

    if (!error) {
      await fetchMembers();
    }
    return { error };
  };

  const transferOwnership = async (organizationId: string, toUserId: string) => {
    const { error } = await (supabase as any).rpc("transfer_org_ownership", {
      _organization_id: organizationId,
      _to_user_id: toUserId,
    });
    if (!error) await fetchMembers();
    return { error };
  };

  const claimOwnership = async (organizationId: string) => {
    const { error } = await (supabase as any).rpc("claim_org_ownership", {
      _organization_id: organizationId,
    });
    if (!error) await fetchMembers();
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
    // Only allow org-assignable roles (supervisor, operator, viewer) by org admins
    if (!ORG_ASSIGNABLE_ROLES.includes(role)) {
      return { error: new Error("You can only assign supervisor, operator, or viewer roles.") };
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
    // Only allow org-assignable roles (supervisor, operator, viewer) to be removed by org admins
    if (!ORG_ASSIGNABLE_ROLES.includes(role)) {
      return { error: new Error("You can only remove supervisor, operator, or viewer roles.") };
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
    createPersonalInvite,
    updateMemberOrgRole,
    removeMember,
    assignAppRole,
    removeAppRole,
    transferOwnership,
    claimOwnership,
    refreshMembers: fetchMembers,
  };
}
