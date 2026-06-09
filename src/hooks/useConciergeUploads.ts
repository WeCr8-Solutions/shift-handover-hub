/**
 * Uploadable concierge documents (manuals, SOPs, reference).
 *
 * Pairs with the system-generated `concierge_document_records` (snapshots of
 * generated MSA/NDA/etc) — this hook is for **user-uploaded** files only.
 *
 * Storage: `concierge-docs` bucket, path = `${orgId}/uploads/${category}/${id}-v${version}.${ext}`
 * Versioning: replace = insert new row with version+1 + set `superseded_by` on old row.
 */
import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type UploadedDocCategory = "manual" | "sop" | "reference";

export interface UploadedConciergeDoc {
  id: string;
  organization_id: string;
  engagement_id: string | null;
  category: UploadedDocCategory;
  title: string;
  description: string | null;
  tags: string[];
  storage_bucket: string;
  storage_path: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  version: number;
  superseded_by: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

const TABLE = "concierge_uploaded_documents";
const BUCKET = "concierge-docs";

function extensionFromMime(file: File): string {
  const dot = file.name.lastIndexOf(".");
  if (dot > 0) return file.name.slice(dot + 1).toLowerCase();
  if (file.type.includes("pdf")) return "pdf";
  if (file.type.includes("word")) return "docx";
  if (file.type.includes("sheet")) return "xlsx";
  return "bin";
}

export function useConciergeUploads(orgId: string | null | undefined, category?: UploadedDocCategory) {
  const qc = useQueryClient();
  const enabled = !!orgId;

  const list = useQuery({
    queryKey: ["concierge-uploads", orgId, category ?? "all"],
    enabled,
    queryFn: async (): Promise<UploadedConciergeDoc[]> => {
      let q = (supabase as any)
        .from(TABLE)
        .select("*")
        .eq("organization_id", orgId!)
        .is("superseded_by", null)
        .order("created_at", { ascending: false });
      if (category) q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as UploadedConciergeDoc[];
    },
  });

  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: ["concierge-uploads", orgId] }),
    [qc, orgId],
  );

  const upload = useMutation({
    mutationFn: async (input: {
      file: File;
      category: UploadedDocCategory;
      title: string;
      description?: string | null;
      tags?: string[];
      engagementId?: string | null;
      /** When provided, treat as a new version superseding this row. */
      supersedesId?: string | null;
    }) => {
      if (!orgId) throw new Error("Missing organization");
      const ext = extensionFromMime(input.file);
      const docId = crypto.randomUUID();

      // Determine version number for the title within this org+category
      let version = 1;
      if (input.supersedesId) {
        const { data: prev } = await (supabase as any)
          .from(TABLE)
          .select("version")
          .eq("id", input.supersedesId)
          .maybeSingle();
        version = ((prev as any)?.version ?? 0) + 1;
      }

      const path = `${orgId}/uploads/${input.category}/${docId}-v${version}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, input.file, { upsert: false, contentType: input.file.type || undefined });
      if (upErr) throw upErr;

      const { data: auth } = await supabase.auth.getUser();

      const { error: insErr } = await (supabase as any).from(TABLE).insert({
        id: docId,
        organization_id: orgId,
        engagement_id: input.engagementId ?? null,
        category: input.category,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        tags: input.tags ?? [],
        storage_bucket: BUCKET,
        storage_path: path,
        file_size_bytes: input.file.size,
        mime_type: input.file.type || null,
        version,
        uploaded_by: auth.user?.id ?? null,
      });
      if (insErr) {
        // Best-effort cleanup if DB insert fails after upload
        await supabase.storage.from(BUCKET).remove([path]);
        throw insErr;
      }

      if (input.supersedesId) {
        await (supabase as any)
          .from(TABLE)
          .update({ superseded_by: docId })
          .eq("id", input.supersedesId);
      }

      return { id: docId, path, version };
    },
    onSuccess: () => {
      toast.success("Document uploaded");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Upload failed"),
  });

  const updateMeta = useMutation({
    mutationFn: async (input: {
      id: string;
      title?: string;
      description?: string | null;
      tags?: string[];
      category?: UploadedDocCategory;
    }) => {
      const { id, ...patch } = input;
      const { error } = await (supabase as any).from(TABLE).update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Updated");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  const remove = useMutation({
    mutationFn: async (doc: UploadedConciergeDoc) => {
      await supabase.storage.from(doc.storage_bucket).remove([doc.storage_path]);
      const { error } = await (supabase as any).from(TABLE).delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  const getSignedUrl = useCallback(async (doc: UploadedConciergeDoc) => {
    const { data, error } = await supabase.storage
      .from(doc.storage_bucket)
      .createSignedUrl(doc.storage_path, 60 * 10);
    if (error) {
      toast.error(error.message);
      return null;
    }
    return data?.signedUrl ?? null;
  }, []);

  return { list, upload, updateMeta, remove, getSignedUrl };
}
