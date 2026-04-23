import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OapCourse {
  id: string;
  slug: string;
  section_number: number;
  title: string;
  summary: string | null;
  description: string | null;
  estimated_minutes: number | null;
  is_published: boolean;
  sort_order: number;
}

export interface OapLesson {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  body_markdown: string;
  estimated_minutes: number | null;
  sort_order: number;
  is_published: boolean;
}

export interface OapQuiz {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  passing_score_pct: number;
  max_attempts: number | null;
  time_limit_minutes: number | null;
  is_published: boolean;
}

export interface OapQuizQuestion {
  id: string;
  quiz_id: string;
  question_type: string;
  prompt: string;
  choices: any[];
  correct_answers: any[];
  explanation: string | null;
  points: number;
  sort_order: number;
}

export function useOapCourses() {
  return useQuery({
    queryKey: ["oap-courses-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oap_courses")
        .select("*")
        .order("section_number", { ascending: true });
      if (error) throw error;
      return (data ?? []) as OapCourse[];
    },
  });
}

export function useOapLessons(courseId: string | null) {
  return useQuery({
    queryKey: ["oap-lessons-admin", courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from("oap_lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as OapLesson[];
    },
    enabled: !!courseId,
  });
}

export function useOapQuizzes(courseId: string | null) {
  return useQuery({
    queryKey: ["oap-quizzes-admin", courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from("oap_quizzes")
        .select("*")
        .eq("course_id", courseId);
      if (error) throw error;
      return (data ?? []) as OapQuiz[];
    },
    enabled: !!courseId,
  });
}

export function useOapQuizQuestions(quizId: string | null) {
  return useQuery({
    queryKey: ["oap-quiz-questions-admin", quizId],
    queryFn: async () => {
      if (!quizId) return [];
      const { data, error } = await supabase
        .from("oap_quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as OapQuizQuestion[];
    },
    enabled: !!quizId,
  });
}

export function useOapAdminMutations() {
  const qc = useQueryClient();

  const upsertCourse = useMutation({
    mutationFn: async (c: Partial<OapCourse> & { title: string; slug: string; section_number: number }) => {
      const { data, error } = await supabase.from("oap_courses").upsert(c as any, { onConflict: "id" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oap-courses-admin"] });
      toast.success("Course saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upsertLesson = useMutation({
    mutationFn: async (l: Partial<OapLesson> & { course_id: string; title: string; slug: string }) => {
      const { data, error } = await supabase.from("oap_lessons").upsert(l as any, { onConflict: "id" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["oap-lessons-admin", v.course_id] });
      toast.success("Lesson saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteLesson = useMutation({
    mutationFn: async ({ id }: { id: string; course_id: string }) => {
      const { error } = await supabase.from("oap_lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["oap-lessons-admin", v.course_id] });
      toast.success("Lesson deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upsertQuiz = useMutation({
    mutationFn: async (q: Partial<OapQuiz> & { course_id: string; title: string }) => {
      const { data, error } = await supabase.from("oap_quizzes").upsert(q as any, { onConflict: "id" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["oap-quizzes-admin", v.course_id] });
      toast.success("Quiz saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upsertQuizQuestion = useMutation({
    mutationFn: async (q: Partial<OapQuizQuestion> & { quiz_id: string; prompt: string; question_type: string }) => {
      const { data, error } = await supabase.from("oap_quiz_questions").upsert(q as any, { onConflict: "id" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["oap-quiz-questions-admin", v.quiz_id] });
      toast.success("Question saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteQuizQuestion = useMutation({
    mutationFn: async ({ id }: { id: string; quiz_id: string }) => {
      const { error } = await supabase.from("oap_quiz_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["oap-quiz-questions-admin", v.quiz_id] });
      toast.success("Question deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    upsertCourse,
    upsertLesson,
    deleteLesson,
    upsertQuiz,
    upsertQuizQuestion,
    deleteQuizQuestion,
  };
}
