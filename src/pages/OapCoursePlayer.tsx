import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useOapCourses,
  useOapLessons,
  useOapQuizzes,
} from "@/hooks/useOapProgram";
import { OapMarkdown } from "@/components/oap/OapMarkdown";
import { QuizPlayer } from "@/components/oap/QuizPlayer";
import { Header } from "@/components/Header";
import { TrainingMedia } from "@/components/training/TrainingMedia";
import { InspectionToolVideoCard } from "@/components/training/InspectionToolVideoCard";
import { getOapCourseToolSlugs } from "@/lib/oapToolMap";
import { BookOpen, ArrowLeft, ArrowRight, Clock, CheckCircle2 } from "lucide-react";

export default function OapCoursePlayer() {
  const { courseSlug, lessonSlug } = useParams<{ courseSlug: string; lessonSlug?: string }>();
  const navigate = useNavigate();
  const { data: courses = [] } = useOapCourses();
  const course = useMemo(
    () => courses.find((c) => c.slug === courseSlug),
    [courses, courseSlug],
  );
  const { data: lessons = [], isLoading: lessonsLoading } = useOapLessons(course?.id ?? null);
  const { data: quizzes = [] } = useOapQuizzes(course?.id ?? null);

  const currentLesson = useMemo(() => {
    if (!lessons.length) return null;
    if (lessonSlug) return lessons.find((l) => l.slug === lessonSlug) ?? lessons[0];
    return lessons[0];
  }, [lessons, lessonSlug]);

  const currentIndex = currentLesson ? lessons.findIndex((l) => l.id === currentLesson.id) : -1;
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const [showQuiz, setShowQuiz] = useState(false);
  const toolSlugs = getOapCourseToolSlugs(course?.slug);

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-3xl mx-auto px-4 py-8">
          <p className="text-sm text-muted-foreground">Course not found.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/oap/learn">← Back to OAP</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{course.title} — OAP</title>
        <meta name="description" content={course.summary ?? course.title} />
      </Helmet>
      <Header />
      <main className="container max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="space-y-3">
          <Button variant="ghost" size="sm" asChild className="w-full justify-start">
            <Link to="/oap/learn"><ArrowLeft className="w-4 h-4 mr-1" /> All sections</Link>
          </Button>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Section {course.section_number}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{course.title}</p>
            </CardHeader>
            <CardContent className="space-y-1">
              {lessonsLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
              {!lessonsLoading && lessons.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  No lessons published yet.
                </p>
              )}
              {lessons.map((l, i) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setShowQuiz(false);
                    navigate(`/oap/learn/${course.slug}/${l.slug}`);
                  }}
                  className={
                    "w-full text-left text-xs px-2 py-1.5 rounded transition " +
                    (currentLesson?.id === l.id && !showQuiz
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted")
                  }
                >
                  {i + 1}. {l.title}
                </button>
              ))}
              {quizzes.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setShowQuiz(true)}
                  className={
                    "w-full text-left text-xs px-2 py-1.5 rounded transition flex items-center gap-1 " +
                    (showQuiz ? "bg-primary text-primary-foreground" : "hover:bg-muted")
                  }
                >
                  <CheckCircle2 className="w-3 h-3" /> Quiz: {q.title}
                </button>
              ))}
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-4 min-w-0">
          {!showQuiz && currentLesson && (
            <>
              <div>
                <Badge variant="outline" className="mb-2 gap-1">
                  <Clock className="w-3 h-3" /> ~{currentLesson.estimated_minutes ?? course.estimated_minutes ?? 10} min
                </Badge>
                <h1 className="text-2xl font-semibold">{currentLesson.title}</h1>
              </div>
              <Card>
                <CardContent className="py-6 space-y-4">
                  <TrainingMedia
                    entityType="oap_lesson"
                    entityId={currentLesson.id}
                  />
                  {currentLesson.body_markdown ? (
                    <OapMarkdown source={currentLesson.body_markdown} />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No written content for this lesson yet.
                    </p>
                  )}
                </CardContent>
              </Card>
              <TrainingMedia
                entityType="oap_course"
                entityId={course.id}
                emptyHint=""
              />
              {toolSlugs.length > 0 && (
                <InspectionToolVideoCard slugs={toolSlugs} />
              )}
              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  disabled={!prevLesson}
                  onClick={() => prevLesson && navigate(`/oap/learn/${course.slug}/${prevLesson.slug}`)}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                {nextLesson ? (
                  <Button onClick={() => navigate(`/oap/learn/${course.slug}/${nextLesson.slug}`)}>
                    Next <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : quizzes.length > 0 ? (
                  <Button onClick={() => setShowQuiz(true)}>
                    Take quiz <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : null}
              </div>
            </>
          )}

          {showQuiz && quizzes[0] && (
            <>
              <h1 className="text-2xl font-semibold">Quiz — {quizzes[0].title}</h1>
              <QuizPlayer quiz={quizzes[0]} toolSlugs={toolSlugs} />
              <Button variant="outline" onClick={() => setShowQuiz(false)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to lessons
              </Button>
            </>
          )}

          {!currentLesson && !showQuiz && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                This section is being authored. Check back soon.
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
