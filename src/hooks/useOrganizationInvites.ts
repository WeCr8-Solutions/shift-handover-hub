import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface OrganizationInvite {
  id: string;
  organization_id: string;
  team_id: string | null;
  invite_code: string;
  created_by: string;
  org_role: string;
  app_role: string | null;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  created_at: string;
  invited_email: string | null;
  team?: {
    name: string;
  };
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function useOrganizationInvites(organizationId: string | null) {
  const { user } = useAuth();
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvites = useCallback(async () => {
    if (!organizationId || !user) {
      setInvites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("organization_invites")
      .select(`*, team:teams(name)`)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const formatted = data.map((inv: any) => ({
        ...inv,
        team: inv.team ? { name: inv.team.name } : undefined,
      }));
      setInvites(formatted);
    }
    setLoading(false);
  }, [organizationId, user]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const createInvite = async (options: {
    teamId?: string;
    orgRole?: "admin" | "member";
    appRole?: "supervisor" | "operator" | "viewer" | null;
    expiresInDays?: number;
    maxUses?: number | null;
    invitedEmail?: string;
  }) => {
    if (!organizationId || !user) {
      return { error: new Error("Not authenticated or no organization") };
    }

    const inviteCode = generateInviteCode();
    const expiresAt = options.expiresInDays
      ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from("organization_invites")
      .insert({
        organization_id: organizationId,
        team_id: options.teamId || null,
        invite_code: inviteCode,
        created_by: user.id,
        org_role: options.orgRole || "member",
        app_role: options.appRole || null,
        expires_at: expiresAt,
        max_uses: options.maxUses || null,
        invited_email: options.invitedEmail || null,
      })
      .select()
      .single();

    if (!error) {
      await fetchInvites();
    }
    return { data, error };
  };

  const deactivateInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from("organization_invites")
      .update({ is_active: false })
      .eq("id", inviteId);

    if (!error) {
      await fetchInvites();
    }
    return { error };
  };

  const deleteInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from("organization_invites")
      .delete()
      .eq("id", inviteId);

    if (!error) {
      await fetchInvites();
    }
    return { error };
  };

  return {
    invites,
    loading,
    createInvite,
    deactivateInvite,
    deleteInvite,
    refreshInvites: fetchInvites,
  };
}

export async function validateInviteCode(code: string) {
  const { data, error } = await supabase
    .from("organization_invites")
    .select(`
      id,
      organization_id,
      team_id,
      org_role,
      app_role,
      organizations:organization_id(name),
      teams:team_id(name)
    `)
    .eq("invite_code", code.toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return { valid: false, invite: null };
  }

  // Fetch seat info for the org
  let seatsUsed: number | undefined;
  let seatLimit: number | undefined;

  const { count } = await supabase
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", data.organization_id);

  const { data: entitlement } = await supabase
    .from("entitlements")
    .select("limits")
    .eq("organization_id", data.organization_id)
    .maybeSingle();

  seatsUsed = count ?? 0;
  seatLimit = (entitlement?.limits as any)?.users ?? undefined;

  return {
    valid: true,
    invite: {
      id: data.id,
      organizationId: data.organization_id,
      organizationName: (data.organizations as any)?.name || "Unknown",
      teamId: data.team_id,
      teamName: (data.teams as any)?.name || null,
      orgRole: data.org_role,
      appRole: data.app_role,
      seatsUsed,
      seatLimit,
    },
  };
}

export async function redeemInviteCode(code: string, userId: string) {
  // First validate the code
  const { data: invite, error: validateError } = await supabase
    .from("organization_invites")
    .select("*")
    .eq("invite_code", code.toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (validateError || !invite) {
    return { error: new Error("Invalid or expired invite code") };
  }

  // Pre-check seat limits before attempting INSERT (prevents cryptic RLS errors)
  const { count: memberCount } = await supabase
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", invite.organization_id);

  const { data: entitlement } = await supabase
    .from("entitlements")
    .select("limits")
    .eq("organization_id", invite.organization_id)
    .maybeSingle();

  const seatLimit = (entitlement?.limits as any)?.users;
  if (seatLimit && (memberCount ?? 0) >= seatLimit) {
    return { error: new Error("This organization has reached its seat limit. Please ask an admin to add more seats.") };
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", invite.organization_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return { error: new Error("You are already a member of this organization") };
  }

  // Add to organization
  const { error: orgError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: invite.organization_id,
      user_id: userId,
      role: invite.org_role,
    });

  if (orgError) {
    return { error: orgError };
  }

  // Add to team if specified
  if (invite.team_id) {
    await supabase
      .from("team_members")
      .insert({
        team_id: invite.team_id,
        user_id: userId,
        role: "member",
        organization_id: invite.organization_id,
      });
  }

  // Assign app role if specified
  if (invite.app_role) {
    const appRole = invite.app_role as AppRole;
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", appRole)
      .maybeSingle();

    if (!existingRole) {
      await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role: appRole }]);
    }
  }

  // Record redemption and increment uses_count
  await supabase
    .from("invite_redemptions")
    .insert({ invite_id: invite.id, user_id: userId });

  await supabase
    .from("organization_invites")
    .update({ uses_count: invite.uses_count + 1 })
    .eq("id", invite.id);

  return { error: null, organizationId: invite.organization_id, teamId: invite.team_id };
}
