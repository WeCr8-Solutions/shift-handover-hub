import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
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
  cover_media_id?: string | null;
  cover_overlay_text?: string | null;
  cover_overlay_opacity?: number | null;
  cover_overlay_position?: string | null;
  cover_overlay_text_color?: string | null;
  content_year?: number | null;
  last_published_at?: string | null;
}

export interface OapLesson {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  body_markdown: string | null;
  estimated_minutes: number | null;
  sort_order: number;
  is_published: boolean;
  cover_media_id?: string | null;
  cover_overlay_text?: string | null;
  cover_overlay_opacity?: number | null;
  cover_overlay_position?: string | null;
  cover_overlay_text_color?: string | null;
  content_year?: number | null;
  last_published_at?: string | null;
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
  question_type: string; // single_choice | multi_choice | true_false
  prompt: string;
  choices: { key: string; label: string }[] | null;
  // correct_answers + explanation are server-side only; revealed by grader RPC after submit
  points: number;
  sort_order: number;
}

export interface OapGradedQuestion {
  question_id: string;
  is_correct: boolean;
  correct_answers: string[];
  explanation: string | null;
}

export interface OapGradeResult {
  score_pct: number;
  passed: boolean;
  passing_score_pct: number;
  earned: number;
  total: number;
  questions: OapGradedQuestion[];
}

export interface OapQuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  organization_id: string | null;
  score_pct: number;
  passed: boolean;
  duration_seconds: number | null;
  answers: any;
  started_at: string;
  completed_at: string | null;
}

export interface OapRoleProgram {
  id: string;
  organization_id: string | null;
  name: string;
  description: string | null;
  required_machine_tags: string[] | null;
  required_inspection_tool_slugs: string[] | null;
  required_machining_operation_slugs: string[] | null;
  is_active: boolean;
  is_canonical?: boolean;
  template_slug?: string | null;
  vertical?: string | null;
  vertical_role_slug?: string | null;
  source_template_id?: string | null;
}

export interface OapEnrollment {
  id: string;
  user_id: string;
  organization_id: string;
  role_program_id: string;
  status: string;
  started_at: string | null;
  expected_completion_at: string | null;
  completed_at: string | null;
}

export function useOapCourses() {
  return useQuery({
    queryKey: ["oap-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oap_courses")
        .select("*")
        .eq("is_published", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as OapCourse[];
    },
  });
}

export function useOapLessons(courseId: string | null) {
  return useQuery({
    queryKey: ["oap-lessons", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oap_lessons")
        .select("*")
        .eq("course_id", courseId!)
        .eq("is_published", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as OapLesson[];
    },
  });
}

export function useOapQuizzes(courseId: string | null) {
  return useQuery({
    queryKey: ["oap-quizzes", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oap_quizzes")
        .select("*")
        .eq("course_id", courseId!)
        .eq("is_published", true)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as OapQuiz[];
    },
  });
}

export function useOapQuizQuestions(quizId: string | null) {
  return useQuery({
    queryKey: ["oap-quiz-questions", quizId],
    enabled: !!quizId,
    queryFn: async () => {
      // correct_answers + explanation are revoked at column level; only safe cols here.
      const { data, error } = await supabase
        .from("oap_quiz_questions")
        .select("id, quiz_id, question_type, prompt, choices, points, sort_order")
        .eq("quiz_id", quizId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as OapQuizQuestion[];
    },
  });
}

export function useMyOapQuizAttempts(userId: string | null) {
  return useQuery({
    queryKey: ["oap-quiz-attempts", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oap_quiz_attempts")
        .select("*")
        .eq("user_id", userId!)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OapQuizAttempt[];
    },
  });
}

export function useSubmitQuizAttempt() {
  const { organization } = useOrganization();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      quiz_id: string;
      answers: Record<string, string[]>;
      started_at: string;
    }): Promise<OapGradeResult> => {
      const { data, error } = await supabase.rpc("grade_oap_quiz_attempt", {
        _quiz_id: params.quiz_id,
        _answers: params.answers as never,
        _started_at: params.started_at,
        _organization_id: organization?.id ?? undefined,
      });
      if (error) throw error;
      return data as unknown as OapGradeResult;
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ["oap-quiz-attempts"] });
      toast[a.passed ? "success" : "error"](
        a.passed ? `Passed at ${a.score_pct}%` : `Did not pass — ${a.score_pct}%`,
      );
    },
  });
}

export function useOapRolePrograms() {
  const { organization } = useOrganization();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const list = useQuery({
    queryKey: ["oap-role-programs", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oap_role_programs")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OapRoleProgram[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      description?: string | null;
      required_machine_tags?: string[];
      required_inspection_tool_slugs?: string[];
      required_machining_operation_slugs?: string[];
      course_ids: string[];
      recert_interval_months?: number | null;
      recert_grace_days?: number | null;
    }) => {
      if (!orgId) throw new Error("No organization");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");

      const payload: Record<string, unknown> = {
        id: input.id,
        organization_id: orgId,
        name: input.name,
        description: input.description ?? null,
        required_machine_tags: input.required_machine_tags ?? [],
        required_inspection_tool_slugs: input.required_inspection_tool_slugs ?? [],
        required_machining_operation_slugs: input.required_machining_operation_slugs ?? [],
        is_active: true,
        created_by: auth.user.id,
      };
      if (input.recert_interval_months !== undefined) payload.recert_interval_months = input.recert_interval_months;
      if (input.recert_grace_days !== undefined) payload.recert_grace_days = input.recert_grace_days;
      const { data, error } = await (supabase as any)
        .from("oap_role_programs")
        .upsert(payload)
        .select()
        .single();
      if (error) throw error;

      await supabase.from("oap_role_program_courses").delete().eq("role_program_id", data.id);
      if (input.course_ids.length) {
        const rows = input.course_ids.map((cid, idx) => ({
          role_program_id: data.id,
          course_id: cid,
          is_required: true,
          sort_order: idx,
        }));
        const { error: e2 } = await supabase.from("oap_role_program_courses").insert(rows);
        if (e2) throw e2;
      }
      return data as OapRoleProgram;
    },
    onSuccess: () => {
      toast.success("Role program saved");
      qc.invalidateQueries({ queryKey: ["oap-role-programs", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("oap_role_programs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role program removed");
      qc.invalidateQueries({ queryKey: ["oap-role-programs", orgId] });
    },
  });

  return { programs: list.data ?? [], isLoading: list.isLoading, upsert, remove };
}

/**
 * Canonical OAP role-program templates seeded by the platform.
 * Readable by any authenticated user. Org admins clone them via RPC.
 */
export function useCanonicalRolePrograms() {
  return useQuery({
    queryKey: ["oap-canonical-role-programs"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("oap_role_programs")
        .select("*")
        .eq("is_canonical", true)
        .eq("is_active", true)
        .order("vertical")
        .order("name");
      if (error) throw error;
      return (data ?? []) as OapRoleProgram[];
    },
  });
}

export function useCloneRoleProgramTemplate() {
  const { organization } = useOrganization();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { template_id: string; override_name?: string }) => {
      if (!organization?.id) throw new Error("No organization selected");
      const { data, error } = await (supabase as any).rpc(
        "clone_oap_role_program_to_org",
        {
          _template_id: params.template_id,
          _organization_id: organization.id,
          _override_name: params.override_name ?? null,
        },
      );
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      toast.success("Template added to your shop");
      qc.invalidateQueries({ queryKey: ["oap-role-programs"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Clone failed"),
  });
}

export function useRoleProgramCourses(roleProgramId: string | null) {
  return useQuery({
    queryKey: ["oap-role-program-courses", roleProgramId],
    enabled: !!roleProgramId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oap_role_program_courses")
        .select("course_id, sort_order, is_required")
        .eq("role_program_id", roleProgramId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as { course_id: string; sort_order: number; is_required: boolean }[];
    },
  });
}

export function useOapEnrollments() {
  const { organization } = useOrganization();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const list = useQuery({
    queryKey: ["oap-enrollments", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oap_enrollments")
        .select("*")
        .eq("organization_id", orgId!)
        .order("started_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as OapEnrollment[];
    },
  });

  const enroll = useMutation({
    mutationFn: async (params: { user_id: string; role_program_id: string; expected_days?: number }) => {
      if (!orgId) throw new Error("No organization");
      const expected = params.expected_days
        ? new Date(Date.now() + params.expected_days * 86400000).toISOString()
        : null;
      const { error } = await supabase.from("oap_enrollments").insert({
        user_id: params.user_id,
        organization_id: orgId,
        role_program_id: params.role_program_id,
        status: "in_progress",
        started_at: new Date().toISOString(),
        expected_completion_at: expected,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Operator enrolled");
      qc.invalidateQueries({ queryKey: ["oap-enrollments", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Enroll failed"),
  });

  return { enrollments: list.data ?? [], isLoading: list.isLoading, enroll };
}

export function useMyOapEnrollments(userId: string | null) {
  return useQuery({
    queryKey: ["oap-my-enrollments", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oap_enrollments")
        .select("*")
        .eq("user_id", userId!)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OapEnrollment[];
    },
  });
}
