import { useState } from "react";
import {
  useOapCourses, useOapLessons, useOapQuizzes, useOapQuizQuestions, useOapAdminMutations,
  type OapCourse, type OapLesson, type OapQuiz,
} from "@/hooks/useOapAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownEditor } from "./shared/MarkdownEditor";
import { QuestionEditor, type EditableQuestion } from "./shared/QuestionEditor";
import { MediaOverlayEditor } from "@/components/training/MediaOverlayEditor";
import { PublishReleaseDialog } from "./PublishReleaseDialog";
import { AttemptsReviewPanel } from "./AttemptsReviewPanel";
import { PROFESSION_PRESETS } from "@/lib/professionPresets";
import { Plus, Save, BookOpen, FileText, ClipboardCheck, Trash2, BarChart3, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Props { isPlatformAdmin: boolean }

type Selection =
  | { kind: "course"; id: string }
  | { kind: "lesson"; id: string; courseId: string }
  | { kind: "quiz"; id: string; courseId: string }
  | null;

export function OapProgramEditor({ isPlatformAdmin }: Props) {
  const { data: courses = [] } = useOapCourses();
  const [sel, setSel] = useState<Selection>(null);
  const m = useOapAdminMutations();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Card className="md:col-span-1">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Courses ({courses.length})</CardTitle>
            {isPlatformAdmin && (
              <Button size="sm" variant="outline" className="h-7 gap-1"
                onClick={() => m.upsertCourse.mutate({
                  title: "New Course", slug: `course-${Date.now()}`, section_number: 1, is_published: false, sort_order: courses.length,
                })}>
                <Plus className="w-3 h-3" /> New
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {courses.map((c) => (
              <CourseTreeNode key={c.id} course={c} sel={sel} setSel={setSel} isPlatformAdmin={isPlatformAdmin} m={m} />
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="md:col-span-2">
        {!sel && <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Select a course, lesson, or quiz</CardContent></Card>}
        {sel?.kind === "course" && <CourseEditor course={courses.find((c) => c.id === sel.id)!} m={m} readOnly={!isPlatformAdmin} />}
        {sel?.kind === "lesson" && <LessonEditor courseId={sel.courseId} lessonId={sel.id} m={m} readOnly={!isPlatformAdmin} />}
        {sel?.kind === "quiz" && <QuizEditor courseId={sel.courseId} quizId={sel.id} m={m} readOnly={!isPlatformAdmin} />}
      </div>
    </div>
  );
}

function CourseTreeNode({ course, sel, setSel, isPlatformAdmin, m }: {
  course: OapCourse; sel: Selection; setSel: (s: Selection) => void; isPlatformAdmin: boolean;
  m: ReturnType<typeof useOapAdminMutations>;
}) {
  const [open, setOpen] = useState(false);
  const { data: lessons = [] } = useOapLessons(open ? course.id : null);
  const { data: quizzes = [] } = useOapQuizzes(open ? course.id : null);

  return (
    <div className="border-b">
      <button
        onClick={() => { setOpen(!open); setSel({ kind: "course", id: course.id }); }}
        className={`w-full text-left px-3 py-2 hover:bg-muted/50 ${sel?.kind === "course" && sel.id === course.id ? "bg-muted" : ""}`}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-medium truncate flex-1">§{course.section_number} · {course.title}</span>
          {!course.is_published && <Badge variant="destructive" className="text-[9px] h-4">draft</Badge>}
        </div>
      </button>
      {open && (
        <div className="bg-muted/20">
          {lessons.map((l) => (
            <button key={l.id} onClick={() => setSel({ kind: "lesson", id: l.id, courseId: course.id })}
              className={`w-full text-left pl-9 pr-3 py-1.5 text-xs hover:bg-muted/50 flex items-center gap-2 ${sel?.kind === "lesson" && sel.id === l.id ? "bg-muted" : ""}`}>
              <FileText className="w-3 h-3" /> {l.title}
            </button>
          ))}
          {quizzes.map((q) => (
            <button key={q.id} onClick={() => setSel({ kind: "quiz", id: q.id, courseId: course.id })}
              className={`w-full text-left pl-9 pr-3 py-1.5 text-xs hover:bg-muted/50 flex items-center gap-2 ${sel?.kind === "quiz" && sel.id === q.id ? "bg-muted" : ""}`}>
              <ClipboardCheck className="w-3 h-3" /> {q.title}
            </button>
          ))}
          {isPlatformAdmin && (
            <div className="pl-9 pr-3 py-1.5 flex gap-1">
              <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1"
                onClick={() => m.upsertLesson.mutate({ course_id: course.id, title: "New Lesson", slug: `lesson-${Date.now()}`, body_markdown: "", sort_order: lessons.length })}>
                <Plus className="w-2.5 h-2.5" /> Lesson
              </Button>
              <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1"
                onClick={() => m.upsertQuiz.mutate({ course_id: course.id, title: "New Quiz", passing_score_pct: 80 })}>
                <Plus className="w-2.5 h-2.5" /> Quiz
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CourseEditor({ course, m, readOnly }: { course: OapCourse; m: ReturnType<typeof useOapAdminMutations>; readOnly: boolean }) {
  const [draft, setDraft] = useState<OapCourse>(course);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          Course {course.content_year && <Badge variant="outline" className="ml-2 text-[10px]">Updated · {course.content_year}</Badge>}
        </CardTitle>
        {!readOnly && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => m.upsertCourse.mutate(draft)} disabled={m.upsertCourse.isPending} className="gap-1">
              <Save className="w-3.5 h-3.5" /> Save
            </Button>
            <PublishReleaseDialog
              program="OAP"
              entityType="course"
              entityId={course.id}
              entityLabel={`§${course.section_number} · ${course.title}`}
              contentTable="oap_courses"
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} disabled={readOnly} className="h-8" /></div>
          <div><Label className="text-xs">Slug</Label><Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} disabled={readOnly} className="h-8" /></div>
          <div><Label className="text-xs">Section (1-7)</Label><Input type="number" min={1} max={7} value={draft.section_number} onChange={(e) => setDraft({ ...draft, section_number: Number(e.target.value) })} disabled={readOnly} className="h-8" /></div>
          <div><Label className="text-xs">Estimated minutes</Label><Input type="number" value={draft.estimated_minutes ?? 0} onChange={(e) => setDraft({ ...draft, estimated_minutes: Number(e.target.value) })} disabled={readOnly} className="h-8" /></div>
        </div>
        <div><Label className="text-xs">Summary</Label><Textarea value={draft.summary ?? ""} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} disabled={readOnly} rows={2} /></div>
        <div><Label className="text-xs">Description</Label><Textarea value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} disabled={readOnly} rows={3} /></div>

        <MediaOverlayEditor
          entityType="oap_course"
          entityId={course.id}
          readOnly={readOnly}
          value={{
            cover_media_id: draft.cover_media_id ?? null,
            cover_overlay_text: draft.cover_overlay_text ?? null,
            cover_overlay_opacity: draft.cover_overlay_opacity ?? null,
            cover_overlay_position: draft.cover_overlay_position ?? null,
            cover_overlay_text_color: draft.cover_overlay_text_color ?? null,
          }}
          onChange={(v) => setDraft({ ...draft, ...v })}
        />

        <label className="flex items-center gap-2 text-sm">
          <Switch checked={draft.is_published} onCheckedChange={(v) => setDraft({ ...draft, is_published: v })} disabled={readOnly} /> Published
        </label>
      </CardContent>
    </Card>
  );
}

function LessonEditor({ courseId, lessonId, m, readOnly }: { courseId: string; lessonId: string; m: ReturnType<typeof useOapAdminMutations>; readOnly: boolean }) {
  const { data: lessons = [] } = useOapLessons(courseId);
  const lesson = lessons.find((l) => l.id === lessonId);
  const [draft, setDraft] = useState<OapLesson | null>(lesson ?? null);

  if (!lesson) return <Card><CardContent className="py-8 text-sm text-muted-foreground">Lesson not found</CardContent></Card>;
  if (!draft || draft.id !== lesson.id) { setDraft(lesson); return null; }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          Lesson
          {draft.content_year && <Badge variant="outline" className="text-[10px]">Updated · {draft.content_year}</Badge>}
        </CardTitle>
        {!readOnly && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => m.upsertLesson.mutate(draft)} disabled={m.upsertLesson.isPending} className="gap-1"><Save className="w-3.5 h-3.5" /> Save</Button>
            <PublishReleaseDialog
              program="OAP"
              entityType="lesson"
              entityId={lesson.id}
              entityLabel={draft.title}
              contentTable="oap_lessons"
            />
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => m.deleteLesson.mutate({ id: lesson.id, course_id: courseId })}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} disabled={readOnly} className="h-8" /></div>
          <div><Label className="text-xs">Slug</Label><Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} disabled={readOnly} className="h-8" /></div>
          <div><Label className="text-xs">Estimated minutes</Label><Input type="number" value={draft.estimated_minutes ?? 0} onChange={(e) => setDraft({ ...draft, estimated_minutes: Number(e.target.value) })} disabled={readOnly} className="h-8" /></div>
          <div><Label className="text-xs">Sort order</Label><Input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} disabled={readOnly} className="h-8" /></div>
        </div>
        <div>
          <Label className="text-xs">Body (Markdown)</Label>
          <MarkdownEditor value={draft.body_markdown} onChange={(v) => setDraft({ ...draft, body_markdown: v })} />
        </div>

        <MediaOverlayEditor
          entityType="oap_lesson"
          entityId={lesson.id}
          readOnly={readOnly}
          value={{
            cover_media_id: draft.cover_media_id ?? null,
            cover_overlay_text: draft.cover_overlay_text ?? null,
            cover_overlay_opacity: draft.cover_overlay_opacity ?? null,
            cover_overlay_position: draft.cover_overlay_position ?? null,
            cover_overlay_text_color: draft.cover_overlay_text_color ?? null,
          }}
          onChange={(v) => setDraft({ ...draft, ...v })}
        />

        <label className="flex items-center gap-2 text-sm">
          <Switch checked={draft.is_published} onCheckedChange={(v) => setDraft({ ...draft, is_published: v })} disabled={readOnly} /> Published
        </label>
      </CardContent>
    </Card>
  );
}

function QuizEditor({ courseId, quizId, m, readOnly }: { courseId: string; quizId: string; m: ReturnType<typeof useOapAdminMutations>; readOnly: boolean }) {
  const { data: quizzes = [] } = useOapQuizzes(courseId);
  const { data: questions = [] } = useOapQuizQuestions(quizId);
  const quiz = quizzes.find((q) => q.id === quizId);
  const [draft, setDraft] = useState<OapQuiz | null>(quiz ?? null);

  if (!quiz) return <Card><CardContent className="py-8 text-sm text-muted-foreground">Quiz not found</CardContent></Card>;
  if (!draft || draft.id !== quiz.id) { setDraft(quiz); return null; }

  const handleAddQuestion = () => {
    m.upsertQuizQuestion.mutate({
      quiz_id: quizId, prompt: "New question", question_type: "single_choice",
      choices: [], correct_answers: [], points: 1, sort_order: questions.length,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Quiz</CardTitle>
        {!readOnly && (
          <Button size="sm" onClick={() => m.upsertQuiz.mutate(draft)} disabled={m.upsertQuiz.isPending} className="gap-1"><Save className="w-3.5 h-3.5" /> Save</Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <Tabs defaultValue="settings">
          <TabsList>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
            <TabsTrigger value="attempts" className="gap-1">
              <BarChart3 className="w-3 h-3" /> Attempts
            </TabsTrigger>
          </TabsList>
          <TabsContent value="settings" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} disabled={readOnly} className="h-8" /></div>
              <div><Label className="text-xs">Passing score %</Label><Input type="number" value={draft.passing_score_pct} onChange={(e) => setDraft({ ...draft, passing_score_pct: Number(e.target.value) })} disabled={readOnly} className="h-8" /></div>
              <div><Label className="text-xs">Max attempts</Label><Input type="number" value={draft.max_attempts ?? 0} onChange={(e) => setDraft({ ...draft, max_attempts: Number(e.target.value) || null })} disabled={readOnly} className="h-8" /></div>
              <div><Label className="text-xs">Time limit (min)</Label><Input type="number" value={draft.time_limit_minutes ?? 0} onChange={(e) => setDraft({ ...draft, time_limit_minutes: Number(e.target.value) || null })} disabled={readOnly} className="h-8" /></div>
            </div>
            <div><Label className="text-xs">Description</Label><Textarea value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} disabled={readOnly} rows={2} /></div>
          </TabsContent>
          <TabsContent value="questions" className="mt-3 space-y-3">
            {!readOnly && <Button size="sm" variant="outline" onClick={handleAddQuestion} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Question</Button>}
            {questions.map((q) => (
              <QuestionEditor
                key={q.id}
                initial={q as EditableQuestion}
                readOnly={readOnly}
                saving={m.upsertQuizQuestion.isPending}
                onSave={(updated) => m.upsertQuizQuestion.mutate({ ...updated, id: q.id, quiz_id: q.quiz_id } as any)}
                onDelete={() => m.deleteQuizQuestion.mutate({ id: q.id, quiz_id: q.quiz_id })}
              />
            ))}
            {questions.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No questions yet</p>}
          </TabsContent>
          <TabsContent value="attempts" className="mt-3">
            <AttemptsReviewPanel program="oap" parentId={quizId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
