import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GcaBank {
  id: string;
  slug: string;
  title: string;
  topic: string;
  description: string | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  passing_score_pct: number;
  is_pro_only: boolean;
  is_published: boolean;
  sort_order: number;
}

export interface GcaQuestion {
  id: string;
  bank_id: string;
  question_type: "multiple_choice" | "true_false" | "fill_in" | "multi_select" | "drag_drop";
  prompt: string;
  choices: any[];
  correct_answers: any[];
  explanation: string | null;
  points: number;
  sort_order: number;
}

export function useGcaBanks() {
  return useQuery({
    queryKey: ["gca-banks-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gca_question_banks")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as GcaBank[];
    },
  });
}

export function useGcaQuestions(bankId: string | null) {
  return useQuery({
    queryKey: ["gca-questions-admin", bankId],
    queryFn: async () => {
      if (!bankId) return [];
      const { data, error } = await supabase
        .from("gca_questions")
        .select("*")
        .eq("bank_id", bankId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as GcaQuestion[];
    },
    enabled: !!bankId,
  });
}

export function useGcaAdminMutations() {
  const qc = useQueryClient();

  const upsertBank = useMutation({
    mutationFn: async (bank: Partial<GcaBank> & { title: string; slug: string; topic: string }) => {
      const { data, error } = await supabase
        .from("gca_question_banks")
        .upsert(bank as any, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gca-banks-admin"] });
      toast.success("Bank saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBank = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gca_question_banks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gca-banks-admin"] });
      toast.success("Bank deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upsertQuestion = useMutation({
    mutationFn: async (q: Partial<GcaQuestion> & { bank_id: string; prompt: string; question_type: string }) => {
      const { data, error } = await supabase
        .from("gca_questions")
        .upsert(q as any, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["gca-questions-admin", vars.bank_id] });
      toast.success("Question saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteQuestion = useMutation({
    mutationFn: async ({ id }: { id: string; bank_id: string }) => {
      const { error } = await supabase.from("gca_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["gca-questions-admin", vars.bank_id] });
      toast.success("Question deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkInsertQuestions = useMutation({
    mutationFn: async ({ bankId, questions }: { bankId: string; questions: Partial<GcaQuestion>[] }) => {
      const rows = questions.map((q, i) => ({
        bank_id: bankId,
        question_type: q.question_type ?? "multiple_choice",
        prompt: q.prompt ?? "",
        choices: q.choices ?? [],
        correct_answers: q.correct_answers ?? [],
        explanation: q.explanation ?? null,
        points: q.points ?? 1,
        sort_order: q.sort_order ?? i,
      }));
      const { error } = await supabase.from("gca_questions").insert(rows as any);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["gca-questions-admin", vars.bankId] });
      toast.success("Questions imported");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { upsertBank, deleteBank, upsertQuestion, deleteQuestion, bulkInsertQuestions };
}
