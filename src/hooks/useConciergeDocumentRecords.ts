import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConciergeDocRecord {
  id: string;
  engagement_id: string;
  organization_id: string | null;
  document_key: string;
  version: number;
  format: string;
  storage_bucket: string;
  storage_path: string;
  needs_snapshot: Record<string, unknown>;
  cost_snapshot: Record<string, unknown>;
  is_master: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  superseded_at: string | null;
}

const BUCKET = "concierge-docs";

export function useConciergeDocumentRecords(engagementId: string | null | undefined, documentKey?: string) {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["concierge-doc-records", engagementId, documentKey ?? "all"],
    enabled: !!engagementId,
    queryFn: async (): Promise<ConciergeDocRecord[]> => {
      let q = supabase
        .from("concierge_document_records" as any)
        .select("*")
        .eq("engagement_id", engagementId!)
        .order("created_at", { ascending: false });
      if (documentKey) q = q.eq("document_key", documentKey);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ConciergeDocRecord[];
    },
  });

  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: ["concierge-doc-records", engagementId] }),
    [qc, engagementId],
  );

  const saveVersion = useMutation({
    mutationFn: async (input: {
      orgId: string | null;
      documentKey: string;
      format: string;
      blob: Blob;
      needsSnapshot: Record<string, unknown>;
      costSnapshot: Record<string, unknown>;
      isMaster?: boolean;
      notes?: string;
    }) => {
      if (!engagementId) throw new Error("Missing engagement id");
      // Determine next version
      const { data: existing, error: existingErr } = await supabase
        .from("concierge_document_records" as any)
        .select("version")
        .eq("engagement_id", engagementId)
        .eq("document_key", input.documentKey)
        .order("version", { ascending: false })
        .limit(1);
      if (existingErr) throw existingErr;
      const nextVersion = ((existing?.[0] as any)?.version ?? 0) + 1;

      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id ?? null;
      const orgSeg = input.orgId ?? "no-org";
      const path = `${orgSeg}/${engagementId}/${input.documentKey}-v${nextVersion}.${input.format}`;

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, input.blob, {
        upsert: false,
        contentType: input.blob.type || undefined,
      });
      if (upErr) throw upErr;

      // Mark prior master superseded if this is the new master
      if (input.isMaster) {
        await supabase
          .from("concierge_document_records" as any)
          .update({ is_master: false, superseded_at: new Date().toISOString() })
          .eq("engagement_id", engagementId)
          .eq("document_key", input.documentKey)
          .eq("is_master", true);
      }

      const { error: insErr } = await supabase.from("concierge_document_records" as any).insert({
        engagement_id: engagementId,
        organization_id: input.orgId,
        document_key: input.documentKey,
        version: nextVersion,
        format: input.format,
        storage_bucket: BUCKET,
        storage_path: path,
        needs_snapshot: input.needsSnapshot,
        cost_snapshot: input.costSnapshot,
        is_master: !!input.isMaster,
        notes: input.notes ?? null,
        created_by: uid,
      });
      if (insErr) throw insErr;
      return { version: nextVersion, path };
    },
    onSuccess: () => {
      toast.success("Version saved to record.");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Save version failed"),
  });

  const downloadVersion = useCallback(async (record: ConciergeDocRecord) => {
    const { data, error } = await supabase.storage
      .from(record.storage_bucket)
      .createSignedUrl(record.storage_path, 60 * 10);
    if (error) {
      toast.error(error.message);
      return null;
    }
    return data?.signedUrl ?? null;
  }, []);

  return { list, saveVersion, downloadVersion };
}
