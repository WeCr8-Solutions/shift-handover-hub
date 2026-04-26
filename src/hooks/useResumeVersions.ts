import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ResumeVersionRow {
  id: string;
  user_id: string;
  file_url: string;
  storage_path: string | null;
  source: "uploaded" | "generated";
  file_name: string | null;
  size_bytes: number | null;
  note: string | null;
  created_at: string;
}

export function useResumeVersions(userId: string | undefined) {
  const [versions, setVersions] = useState<ResumeVersionRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("operator_resume_versions" as any)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setVersions(((data ?? []) as unknown) as ResumeVersionRow[]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recordVersion = useCallback(
    async (input: {
      file_url: string;
      storage_path?: string | null;
      source: "uploaded" | "generated";
      file_name?: string | null;
      size_bytes?: number | null;
      note?: string | null;
    }) => {
      if (!userId) return;
      await supabase.from("operator_resume_versions" as any).insert({
        user_id: userId,
        file_url: input.file_url,
        storage_path: input.storage_path ?? null,
        source: input.source,
        file_name: input.file_name ?? null,
        size_bytes: input.size_bytes ?? null,
        note: input.note ?? null,
      } as any);
      await refresh();
    },
    [userId, refresh],
  );

  const deleteVersion = useCallback(
    async (id: string, storagePath: string | null) => {
      await supabase.from("operator_resume_versions" as any).delete().eq("id", id);
      if (storagePath) {
        await supabase.storage.from("operator-profiles").remove([storagePath]);
      }
      await refresh();
    },
    [refresh],
  );

  return { versions, loading, refresh, recordVersion, deleteVersion };
}
