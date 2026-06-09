import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Concierge Sales Pack draft + finalization persistence.
 *
 * The `snapshot` field is treated as opaque on the server (jsonb). The shape
 * below is the contract used by the React page when reading/writing it.
 */
export interface PackSnapshot {
  selected: Record<string, boolean>;
  paperSize: string;
  orientation: string;
  copies: number;
  salesRepName: string;
  salesRepTitle: string;
  jobLineRepName: string;
  jobLineRepTitle: string;
  billingEmail: string;
  repTalentUrl: string;
  recommendedTier?: string;
  /** Free-form editable fields keyed by EditableField fieldKey. */
  fields: Record<string, string>;
  /** Sealed signature envelopes (dataUrl + sha256 + signedAt). */
  signatures: Record<string, { dataUrl: string; sha256: string; signedAt: string; signerName?: string }>;
  savedClientAt: string;
}

export interface ConciergePackFinalization {
  engagement_id: string;
  snapshot: PackSnapshot;
  status: "draft" | "finalized";
  finalized_by: string | null;
  finalized_at: string | null;
  reopened_by: string | null;
  reopened_at: string | null;
  reopen_reason: string | null;
  pack_hash: string | null;
  created_at: string;
  updated_at: string;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function useConciergeFinalization(engagementId: string | null) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["concierge-pack-finalization", engagementId],
    enabled: !!engagementId,
    queryFn: async (): Promise<ConciergePackFinalization | null> => {
      const { data, error } = await supabase
        .from("concierge_pack_finalizations" as any)
        .select("*")
        .eq("engagement_id", engagementId!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as ConciergePackFinalization) ?? null;
    },
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["concierge-pack-finalization", engagementId] });
  }, [qc, engagementId]);

  const saveDraft = useMutation({
    mutationFn: async (snapshot: PackSnapshot) => {
      if (!engagementId) throw new Error("Missing engagement id");
      const payload: Record<string, unknown> = {
        engagement_id: engagementId,
        snapshot,
        status: "draft",
        // Clear finalized / reopen audit on re-save of a draft
        finalized_at: null,
        finalized_by: null,
        pack_hash: null,
      };
      const { error } = await supabase
        .from("concierge_pack_finalizations" as any)
        .upsert(payload, { onConflict: "engagement_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Draft saved. Resume anytime from this engagement.");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  const finalize = useMutation({
    mutationFn: async (snapshot: PackSnapshot) => {
      if (!engagementId) throw new Error("Missing engagement id");
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id ?? null;
      const canonical = JSON.stringify(snapshot);
      const hash = await sha256Hex(canonical);
      const payload: Record<string, unknown> = {
        engagement_id: engagementId,
        snapshot,
        status: "finalized",
        finalized_by: uid,
        finalized_at: new Date().toISOString(),
        pack_hash: hash,
        reopened_at: null,
        reopened_by: null,
        reopen_reason: null,
      };
      const { error } = await supabase
        .from("concierge_pack_finalizations" as any)
        .upsert(payload, { onConflict: "engagement_id" });
      if (error) throw error;
      return hash;
    },
    onSuccess: () => {
      toast.success("Pack finalized & sealed. You can now print, email, or export.");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Finalize failed"),
  });

  const reopen = useMutation({
    mutationFn: async (reason: string) => {
      if (!engagementId) throw new Error("Missing engagement id");
      const trimmed = reason.trim();
      if (!trimmed) throw new Error("Re-open reason is required");
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id ?? null;
      const { error } = await supabase
        .from("concierge_pack_finalizations" as any)
        .update({
          status: "draft",
          reopened_by: uid,
          reopened_at: new Date().toISOString(),
          reopen_reason: trimmed,
        })
        .eq("engagement_id", engagementId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pack re-opened for edits. Audit trail recorded.");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Re-open failed"),
  });

  return { query, saveDraft, finalize, reopen };
}
