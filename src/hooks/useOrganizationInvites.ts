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
  // Use the secure RPC function that excludes invited_email
  const { data, error } = await supabase.rpc("validate_invite_code", {
    _code: code,
  });

  if (error || !data || !(data as any).valid) {
    return { valid: false, invite: null, reason: "Invalid or inactive invite code" };
  }

  const invite = data as {
    valid: boolean;
    id: string;
    organization_id: string;
    team_id: string | null;
    org_role: string;
    app_role: string | null;
    expires_at: string | null;
    max_uses: number | null;
    uses_count: number;
  };

  // Fetch org name, team name, and seat info
  const [orgResult, teamResult, countResult, entitlementResult] = await Promise.all([
    supabase.from("organizations").select("name").eq("id", invite.organization_id).maybeSingle(),
    invite.team_id
      ? supabase.from("teams").select("name").eq("id", invite.team_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", invite.organization_id),
    supabase
      .from("entitlements")
      .select("limits")
      .eq("organization_id", invite.organization_id)
      .maybeSingle(),
  ]);

  const seatsUsed = countResult.count ?? 0;
  const seatLimit = (entitlementResult.data?.limits as any)?.users ?? undefined;

  return {
    valid: true,
    invite: {
      id: invite.id,
      organizationId: invite.organization_id,
      organizationName: orgResult.data?.name || "Unknown",
      teamId: invite.team_id,
      teamName: teamResult.data?.name || null,
      orgRole: invite.org_role,
      appRole: invite.app_role,
      seatsUsed,
      seatLimit,
    },
  };
}

export async function redeemInviteCode(code: string, userId: string) {
  const { data, error } = await supabase.rpc("redeem_invite_code", {
    _code: code,
    _user_id: userId,
  });

  if (error) {
    return { error: new Error(error.message) };
  }

  const result = data as { error?: string; success?: boolean; organization_id?: string; team_id?: string | null };

  if (result.error) {
    return { error: new Error(result.error) };
  }

  return {
    error: null,
    organizationId: result.organization_id,
    teamId: result.team_id,
  };
}
