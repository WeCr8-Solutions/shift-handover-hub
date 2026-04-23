import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type ReleaseProgram = "OAP" | "GCA" | "CERT";
export type ReleaseEntityType = "bank" | "course" | "lesson" | "quiz" | "template";

export interface ReleaseLogRow {
  id: string;
  program: ReleaseProgram;
  entity_type: ReleaseEntityType;
  entity_id: string;
  entity_label: string | null;
  content_year: number;
  release_notes: string | null;
  released_by: string | null;
  released_at: string;
  organization_id: string | null;
}

interface PublishInput {
  program: ReleaseProgram;
  entityType: ReleaseEntityType;
  entityId: string;
  entityLabel?: string | null;
  contentYear: number;
  releaseNotes?: string | null;
  organizationId?: string | null;
  /** Which content table to stamp `last_published_at`/`content_year`/`last_published_by` on. */
  contentTable?: "gca_question_banks" | "oap_courses" | "oap_lessons" | "oap_quizzes" | "certificate_templates";
}

export function useProgramReleaseLog(filter?: {
  program?: ReleaseProgram;
  year?: number;
  organizationId?: string | null;
}) {
  return useQuery({
    queryKey: ["program-release-log", filter],
    queryFn: async () => {
      let q = supabase
        .from("program_release_log")
        .select("*")
        .order("released_at", { ascending: false })
        .limit(500);
      if (filter?.program) q = q.eq("program", filter.program);
      if (filter?.year) q = q.eq("content_year", filter.year);
      if (filter?.organizationId !== undefined) {
        if (filter.organizationId === null) q = q.is("organization_id", null);
        else q = q.eq("organization_id", filter.organizationId);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ReleaseLogRow[];
    },
  });
}

export function usePublishRelease() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: PublishInput) => {
      // 1) Stamp the content row (best-effort — only if contentTable provided and supports the columns)
      if (input.contentTable && input.contentTable !== "oap_quizzes") {
        const stamp = {
          content_year: input.contentYear,
          last_published_at: new Date().toISOString(),
          last_published_by: user?.id ?? null,
        };
        const { error: stampErr } = await supabase
          .from(input.contentTable)
          .update(stamp as any)
          .eq("id", input.entityId);
        if (stampErr) throw stampErr;
      }

      // 2) Insert release log row
      const { data, error } = await supabase
        .from("program_release_log")
        .insert({
          program: input.program,
          entity_type: input.entityType,
          entity_id: input.entityId,
          entity_label: input.entityLabel ?? null,
          content_year: input.contentYear,
          release_notes: input.releaseNotes ?? null,
          released_by: user?.id ?? null,
          organization_id: input.organizationId ?? null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as ReleaseLogRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["program-release-log"] });
      qc.invalidateQueries({ queryKey: ["gca-banks-admin"] });
      qc.invalidateQueries({ queryKey: ["oap-courses-admin"] });
      qc.invalidateQueries({ queryKey: ["certificate-templates"] });
      toast.success("Published");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
