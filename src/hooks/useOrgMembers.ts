/**
 * Concierge org members management.
 * Lists organization_members joined to profiles, plus mutations gated by the
 * `concierge_update_org_member` RPC (admin-only, with single-owner protection).
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type OrgMemberRole = "owner" | "admin" | "member" | "viewer";

export interface OrgMemberRow {
  id: string;
  user_id: string;
  role: OrgMemberRole;
  joined_at: string;
  profile: { email: string; display_name: string | null; avatar_url: string | null } | null;
}

export function useOrgMembers(orgId: string | null | undefined) {
  const qc = useQueryClient();
  const enabled = !!orgId;
  const queryKey = ["concierge-org-members", orgId];

  const list = useQuery<OrgMemberRow[]>({
    queryKey,
    enabled,
    queryFn: async () => {
      if (!orgId) return [];
      const { data: members, error } = await (supabase as any)
        .from("organization_members")
        .select("id, user_id, role, joined_at")
        .eq("organization_id", orgId)
        .order("joined_at", { ascending: true });
      if (error) throw error;
      const rows = (members ?? []) as Array<{ id: string; user_id: string; role: OrgMemberRole; joined_at: string }>;
      if (rows.length === 0) return [];

      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profiles, error: pErr } = await (supabase as any)
        .from("profiles")
        .select("user_id, email, display_name, avatar_url")
        .in("user_id", userIds);
      if (pErr) throw pErr;
      const map = new Map<string, any>((profiles ?? []).map((p: any) => [p.user_id, p]));
      return rows.map((r) => ({
        ...r,
        profile: map.get(r.user_id) ?? null,
      }));
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey });
    qc.invalidateQueries({ queryKey: ["org-structure", orgId] });
  };

  const changeRole = useMutation({
    mutationFn: async (input: { userId: string; newRole: OrgMemberRole }) => {
      if (!orgId) throw new Error("Missing organization");
      const { error } = await (supabase as any).rpc("concierge_update_org_member", {
        _org_id: orgId, _user_id: input.userId, _action: "change_role", _new_role: input.newRole,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Role updated"); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Role update failed"),
  });

  const remove = useMutation({
    mutationFn: async (userId: string) => {
      if (!orgId) throw new Error("Missing organization");
      const { error } = await (supabase as any).rpc("concierge_update_org_member", {
        _org_id: orgId, _user_id: userId, _action: "remove", _new_role: null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Member removed"); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Remove failed"),
  });

  const transferOwner = useMutation({
    mutationFn: async (userId: string) => {
      if (!orgId) throw new Error("Missing organization");
      const { error } = await (supabase as any).rpc("concierge_update_org_member", {
        _org_id: orgId, _user_id: userId, _action: "transfer_owner", _new_role: null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Ownership transferred"); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Transfer failed"),
  });

  return { list, changeRole, remove, transferOwner };
}
