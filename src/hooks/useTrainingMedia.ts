import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { Database } from "@/integrations/supabase/types";

export type TrainingMediaEntity =
  Database["public"]["Enums"]["training_media_entity"];
export type TrainingMediaType =
  Database["public"]["Enums"]["training_media_type"];
export type TrainingMediaProgram =
  Database["public"]["Enums"]["training_media_program"];

export interface TrainingMedia {
  id: string;
  organization_id: string | null;
  program: TrainingMediaProgram;
  entity_type: TrainingMediaEntity;
  entity_id: string;
  media_type: TrainingMediaType;
  mime_type: string;
  storage_bucket: "training-media-public" | "training-media-private";
  storage_path: string;
  file_name: string | null;
  file_size_bytes: number | null;
  duration_ms: number | null;
  width: number | null;
  height: number | null;
  caption: string | null;
  alt_text: string | null;
  transcript: string | null;
  sort_order: number;
  is_primary: boolean;
  visibility: "public" | "private";
  is_canonical: boolean;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  signed_url?: string;
}

const ALLOWED_MIME: Record<TrainingMediaType, string[]> = {
  image: ["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"],
  audio: ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/aac"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
};

export function detectMediaType(mime: string): TrainingMediaType | null {
  if (ALLOWED_MIME.image.includes(mime)) return "image";
  if (ALLOWED_MIME.audio.includes(mime)) return "audio";
  if (ALLOWED_MIME.video.includes(mime)) return "video";
  return null;
}

export const ACCEPTED_FILE_ACCEPT =
  ALLOWED_MIME.image.join(",") +
  "," +
  ALLOWED_MIME.audio.join(",") +
  "," +
  ALLOWED_MIME.video.join(",");

async function attachSignedUrls(rows: TrainingMedia[]): Promise<TrainingMedia[]> {
  return Promise.all(
    rows.map(async (m) => {
      const { data } = await supabase.storage
        .from(m.storage_bucket)
        .createSignedUrl(m.storage_path, 60 * 60);
      return { ...m, signed_url: data?.signedUrl ?? undefined };
    })
  );
}

export function useTrainingMedia(
  entityType: TrainingMediaEntity | null,
  entityId: string | null
) {
  const [media, setMedia] = useState<TrainingMedia[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMedia = useCallback(async () => {
    if (!entityType || !entityId) {
      setMedia([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("training_media")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("training_media load failed", error);
      setMedia([]);
      setLoading(false);
      return;
    }
    const withUrls = await attachSignedUrls((data ?? []) as TrainingMedia[]);
    setMedia(withUrls);
    setLoading(false);
  }, [entityType, entityId]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  return { media, loading, refresh: fetchMedia };
}

interface UploadInput {
  file: File;
  entityType: TrainingMediaEntity;
  entityId: string;
  program?: TrainingMediaProgram;
  visibility?: "public" | "private";
  caption?: string;
  altText?: string;
  transcript?: string;
  isPrimary?: boolean;
  isCanonical?: boolean;
  sortOrder?: number;
}

export function useTrainingMediaUploader() {
  const { user } = useAuth();
  const { organization } = useOrgContext();

  const upload = useCallback(
    async (input: UploadInput) => {
      if (!user) throw new Error("Not authenticated");
      const mediaType = detectMediaType(input.file.type);
      if (!mediaType) throw new Error(`Unsupported file type: ${input.file.type}`);

      const visibility = input.visibility ?? "public";
      const bucket =
        visibility === "private"
          ? "training-media-private"
          : "training-media-public";
      const isCanonical = !!input.isCanonical;

      // Path layout: {scope}/{program}/{entity_type}/{entity_id}/{file}
      const scope = isCanonical ? "canonical" : organization?.id;
      if (!scope) throw new Error("No organization context for upload");

      const ext = input.file.name.split(".").pop() || "bin";
      const safeName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}.${ext}`;
      const path = `${scope}/${input.program ?? "both"}/${input.entityType}/${
        input.entityId
      }/${safeName}`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, input.file, {
          contentType: input.file.type,
          upsert: false,
        });
      if (upErr) throw upErr;

      const { data: row, error: insErr } = await supabase
        .from("training_media")
        .insert({
          organization_id: isCanonical ? null : organization!.id,
          program: input.program ?? "both",
          entity_type: input.entityType,
          entity_id: input.entityId,
          media_type: mediaType,
          mime_type: input.file.type,
          storage_bucket: bucket,
          storage_path: path,
          file_name: input.file.name,
          file_size_bytes: input.file.size,
          caption: input.caption ?? null,
          alt_text: input.altText ?? null,
          transcript: input.transcript ?? null,
          sort_order: input.sortOrder ?? 0,
          is_primary: !!input.isPrimary,
          visibility,
          is_canonical: isCanonical,
          uploaded_by: user.id,
        })
        .select()
        .single();
      if (insErr) {
        // Best-effort cleanup
        await supabase.storage.from(bucket).remove([path]);
        throw insErr;
      }
      return row as TrainingMedia;
    },
    [user, organization]
  );

  const remove = useCallback(async (m: TrainingMedia) => {
    await supabase.storage.from(m.storage_bucket).remove([m.storage_path]);
    await supabase.from("training_media").delete().eq("id", m.id);
  }, []);

  return { upload, remove };
}
