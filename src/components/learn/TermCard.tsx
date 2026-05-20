import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, ChevronDown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LearnTerm } from "@/lib/LearnGlossaryData";
import { TermQuizSection } from "./TermQuizSection";

interface TermCardProps {
  term: LearnTerm;
  index: number;
  onSparkClick: (termId: string, termName: string) => void;
  ideaCaptured: boolean;
}

function BoldText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <strong key={`${part}-${index}`} className="font-semibold text-foreground">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function TermCard({ term, index, onSparkClick, ideaCaptured }: TermCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!isRead) {
      setIsRead(true);
    }
  }, [isRead]);

  const handleSpark = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onSparkClick(term.id, term.name);
    },
    [onSparkClick, term.id, term.name],
  );

  return (
    <div
      ref={cardRef}
      className={cn(
        "overflow-hidden rounded-lg bg-card transition-all duration-300",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        isRead
          ? "border border-border border-l-4 border-l-green-500"
          : "border border-border",
        "hover:border-border/80",
      )}
    >
      <button
        type="button"
        className="flex w-full cursor-pointer select-none items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/30"
        onClick={handleToggle}
        aria-controls={`term-body-${term.id}`}
      >
        <div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xl", term.color.bgClass)}>
          {term.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-sm font-bold uppercase tracking-wide", term.color.textClass)}>{term.name}</span>
            {term.trending && (
              <span className="inline-flex items-center gap-1 rounded border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-600">
                Trending
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{term.oneLiner}</p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <Badge
            variant="outline"
            className={cn("hidden text-xs sm:inline-flex", term.color.textClass, term.color.borderClass, term.color.bgClass)}
          >
            {term.category}
          </Badge>
          {isRead && <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Read" />}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </button>

      {isOpen && (
        <div id={`term-body-${term.id}`} className="border-t border-border">
          <div className="px-4 pb-3 pt-4">
            <p className="mb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">Plain English</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <BoldText text={term.plain} />
            </p>
          </div>

          <div className="px-4 pb-3">
            <p className="mb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">Why it matters here</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{term.whyItMatters}</p>
          </div>

          {(term.benefits || term.drawbacks) && (
            <div className="px-4 pb-3">
              <div className="grid gap-3 md:grid-cols-2">
                {term.benefits && term.benefits.length > 0 && (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50/70 p-3">
                    <p className="mb-2 text-xs font-mono uppercase tracking-widest text-emerald-700">Benefits</p>
                    <ul className="space-y-2 text-xs leading-relaxed text-emerald-900">
                      {term.benefits.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {term.drawbacks && term.drawbacks.length > 0 && (
                  <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3">
                    <p className="mb-2 text-xs font-mono uppercase tracking-widest text-amber-700">Drawbacks</p>
                    <ul className="space-y-2 text-xs leading-relaxed text-amber-900">
                      {term.drawbacks.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-600" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {(term.visual || term.analogy.aiSide) && (
            <div className="px-4 pb-3">
              <p className="mb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">Picture it like this</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {term.visual?.body ?? term.analogy.aiSide}
              </p>
              {term.visual?.breakdown && term.visual.breakdown.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {term.visual.breakdown.map((piece) => (
                    <span
                      key={piece}
                      className="inline-flex items-center rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs text-foreground"
                    >
                      {piece}
                    </span>
                  ))}
                </div>
              )}
              {term.visual?.note && <p className="mt-2 text-xs leading-snug text-muted-foreground">{term.visual.note}</p>}
            </div>
          )}

          <div className="mx-4 mb-3 grid overflow-hidden rounded-md border border-border bg-muted/30 sm:grid-cols-2">
            <div className="p-3 sm:border-r sm:border-border">
              <p className="mb-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground">Inside the model</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{term.analogy.aiSide}</p>
            </div>
            <div className="border-t border-border p-3 sm:border-l-0 sm:border-t-0">
              <p className="mb-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground">How to apply it</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{term.analogy.shopSide}</p>
            </div>
          </div>

          <div className="px-4 pb-3">
            <p className="mb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">Where you might notice this</p>
            <div className="flex flex-wrap gap-2">
              {term.examples.map((example) => (
                <span
                  key={example}
                  className="inline-flex items-center rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs text-muted-foreground"
                >
                  {example}
                </span>
              ))}
            </div>
          </div>

          {term.relatedLinks && term.relatedLinks.length > 0 && (
            <div className="px-4 pb-3">
              <p className="mb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">Connect this term to</p>
              <div className="flex flex-wrap gap-2">
                {term.relatedLinks.map((item) => (
                  <Button key={item.href} asChild size="sm" variant="outline" className="h-8 text-xs">
                    <Link to={item.href}>{item.label}</Link>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 pb-3">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <BookOpen className="h-3 w-3" />
              Check your understanding
            </p>
            <TermQuizSection quiz={term.quiz} termId={term.id} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-amber-50/50 px-4 py-3">
            <div className="flex min-w-0 flex-1 items-start gap-2.5">
              <span className="mt-0.5 text-base" aria-hidden="true">
                💡
              </span>
              <div>
                <p className="mb-0.5 text-xs font-semibold text-foreground">Optional reflection</p>
                <p className="text-xs leading-snug text-muted-foreground">{term.sparkPrompt}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant={ideaCaptured ? "outline" : "default"}
              className={cn(
                "flex-shrink-0 gap-1.5 text-xs",
                ideaCaptured && "cursor-default border-green-300 bg-green-50 text-green-600 hover:bg-green-50",
              )}
              onClick={ideaCaptured ? undefined : handleSpark}
              disabled={ideaCaptured}
            >
              {ideaCaptured ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Save Optional Reflection
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}