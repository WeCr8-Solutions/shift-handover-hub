/**
 * Unified hook for the JobLine certifying-mentor registry.
 *
 * The underlying table is `certifying_mentors`, which holds two scopes:
 *   • scope='platform'  — vetted by JobLine.ai admins, signs self-pay certs.
 *   • scope='org'       — designated by an Org Admin in a paid employer org,
 *                         then approved by JobLine.ai.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

export type MentorScope = "platform" | "org";
export type MentorProgram = "OAP" | "GCA";
export type MentorApprovalStatus = "pending" | "approved" | "revoked";

export interface CertifyingMentor {
  id: string;
  organization_id: string | null;
  user_id: string;
  user_name: string | null;
  designated_by: string;
  designated_at: string;
  is_active: boolean;
  notes: string | null;
  scope: MentorScope;
  programs: MentorProgram[];
  approval_status: MentorApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  credentials_url: string | null;
  signature_url: string | null;
  title: string | null;
}

interface UseCertifyingMentorsParams {
  /** Filter by program (returns mentors who certify for this program). */
  program?: MentorProgram;
  /** Filter by scope. Defaults to org when an organization is active. */
  scope?: MentorScope;
  /** Limit to a specific approval status. */
  approvalStatus?: MentorApprovalStatus;
}

const TABLE = "certifying_mentors" as const;

export function useCertifyingMentors(params: UseCertifyingMentorsParams = {}) {
  const { organization } = useOrganization();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;
  const { program, scope = "org", approvalStatus } = params;

  const list = useQuery({
    queryKey: ["certifying-mentors", scope, orgId, program ?? "all", approvalStatus ?? "all"],
    enabled: scope === "platform" ? true : !!orgId,
    queryFn: async () => {
      let q = (supabase as any).from(TABLE).select("*").order("designated_at", { ascending: false });
      q = q.eq("scope", scope);
      if (scope === "org") q = q.eq("organization_id", orgId!);
      if (approvalStatus) q = q.eq("approval_status", approvalStatus);
      const { data, error } = await q;
      if (error) throw error;
      let rows = (data ?? []) as CertifyingMentor[];
      if (program) rows = rows.filter((m) => (m.programs ?? []).includes(program));
      return rows;
    },
  });

  const designate = useMutation({
    mutationFn: async (input: {
      user_id: string;
      user_name?: string | null;
      title?: string | null;
      programs?: MentorProgram[];
      notes?: string | null;
      organization_id?: string | null;
      scope?: MentorScope;
    }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");
      const targetScope = input.scope ?? scope;
      const targetOrg = targetScope === "platform" ? null : input.organization_id ?? orgId;
      if (targetScope === "org" && !targetOrg) throw new Error("No organization");

      const payload = {
        organization_id: targetOrg,
        user_id: input.user_id,
        user_name: input.user_name ?? null,
        title: input.title ?? null,
        designated_by: auth.user.id,
        notes: input.notes ?? null,
        is_active: true,
        scope: targetScope,
        programs: input.programs?.length ? input.programs : ["OAP"],
        // org rows start pending; platform rows are inserted by an admin and may
        // be flipped to 'approved' in a follow-up update by the same admin.
        approval_status: "pending",
      };

      const { error } = await (supabase as any).from(TABLE).upsert(payload, {
        onConflict: targetScope === "platform" ? "user_id" : "organization_id,user_id",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mentor designated — pending JobLine.ai approval");
      qc.invalidateQueries({ queryKey: ["certifying-mentors"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to designate mentor"),
  });

  const setActive = useMutation({
    mutationFn: async (input: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from(TABLE)
        .update({ is_active: input.is_active })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certifying-mentors"] }),
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  const setApproval = useMutation({
    mutationFn: async (input: { id: string; status: MentorApprovalStatus }) => {
      const patch: Record<string, unknown> = { approval_status: input.status };
      if (input.status === "approved") {
        patch.approved_at = new Date().toISOString();
        const { data: auth } = await supabase.auth.getUser();
        if (auth.user) patch.approved_by = auth.user.id;
      }
      const { error } = await (supabase as any).from(TABLE).update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(
        vars.status === "approved"
          ? "Mentor approved"
          : vars.status === "revoked"
            ? "Mentor revoked"
            : "Mentor status updated",
      );
      qc.invalidateQueries({ queryKey: ["certifying-mentors"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Approval update failed"),
  });

  const updateMeta = useMutation({
    mutationFn: async (input: {
      id: string;
      title?: string | null;
      programs?: MentorProgram[];
      credentials_url?: string | null;
      signature_url?: string | null;
      notes?: string | null;
    }) => {
      const { id, ...patch } = input;
      const { error } = await (supabase as any).from(TABLE).update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certifying-mentors"] }),
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  return {
    mentors: list.data ?? [],
    isLoading: list.isLoading,
    refetch: list.refetch,
    designate,
    setActive,
    setApproval,
    updateMeta,
  };
}

/** Public-readable list of approved mentors (anon-allowed view).
 *  Used by the cert checkout dialog to pick a signing mentor. */
export function useApprovedMentorPicker(opts: {
  program: MentorProgram;
  organizationId?: string | null;
}) {
  return useQuery({
    queryKey: ["approved-mentor-picker", opts.program, opts.organizationId ?? "platform"],
    queryFn: async () => {
      let q = (supabase as any)
        .from("certifying_mentors_public")
        .select("id, user_id, user_name, title, scope, organization_id, programs");
      if (opts.organizationId) {
        // Org-issued cert: org mentors only.
        q = q.eq("organization_id", opts.organizationId).eq("scope", "org");
      } else {
        // Self-pay: platform mentors only.
        q = q.eq("scope", "platform");
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).filter((m: any) =>
        Array.isArray(m.programs) ? m.programs.includes(opts.program) : false,
      );
    },
  });
}
