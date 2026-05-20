import { useEffect, useState } from "react";
import { Lightbulb, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLearnIdeaSubmit } from "@/hooks/useLearnIdeaSubmit";

export interface CapturedIdea {
  termId: string;
  termName: string;
  termIcon: string;
  role: string;
  title: string;
  problem: string;
  solution: string;
  ts: string;
}

interface IdeaDrawerProps {
  open: boolean;
  onClose: () => void;
  termId: string | null;
  termName: string | null;
  termIcon: string | null;
  onSubmitted: (idea: CapturedIdea) => void;
  sessionIdeas: CapturedIdea[];
}

const ROLES = [
  "Machinist",
  "CNC Operator",
  "Programmer",
  "Manufacturing Engineer",
  "Quality Inspector",
  "Maintenance Tech",
  "Shift Supervisor",
  "Operations Leader",
  "Other",
] as const;

export function IdeaDrawer({
  open,
  onClose,
  termId,
  termName,
  termIcon,
  onSubmitted,
  sessionIdeas,
}: IdeaDrawerProps) {
  const { submit, isSubmitting } = useLearnIdeaSubmit();
  const [role, setRole] = useState("");
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");

  useEffect(() => {
    if (open) {
      setRole("");
      setTitle("");
      setProblem("");
      setSolution("");
    }
  }, [open, termId]);

  const canSubmit = title.trim().length > 0 && problem.trim().length > 0;

  const handleSubmit = async () => {
    if (!termId || !termName || !canSubmit) {
      return;
    }

    const ok = await submit({
      termId,
      termName,
      role: role || undefined,
      title,
      problem,
      solution: solution || undefined,
    });

    if (ok) {
      onSubmitted({
        termId,
        termName,
        termIcon: termIcon ?? "💡",
        role,
        title: title.trim(),
        problem: problem.trim(),
        solution: solution.trim(),
        ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
      onClose();
    }
  };

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:w-[440px]">
        <SheetHeader className="border-b bg-card px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Capture reflection
          </SheetTitle>
          <SheetDescription className="text-xs leading-snug">
            Capture what made the explanation useful, where it applies in your work, and any optional idea worth following up later.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-4 px-5 py-4">
            {termId && termName && (
              <div>
                <p className="mb-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground">Sparked by</p>
                <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
                  <span aria-hidden="true">{termIcon ?? "💡"}</span>
                  <span className="font-medium text-foreground">{termName}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Your role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((item) => (
                    <SelectItem key={item} value={item} className="text-sm">
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="idea-title" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Reflection title
              </Label>
              <Input
                id="idea-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: vision inspection helps catch repeat defects faster"
                maxLength={120}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="idea-problem" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Where does this apply in your work?
              </Label>
              <Textarea
                id="idea-problem"
                value={problem}
                onChange={(event) => setProblem(event.target.value)}
                placeholder="Describe the task, friction, decision, or repeated situation where this explanation matters."
                className="min-h-[92px] resize-none"
                maxLength={500}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="idea-solution" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Optional follow-up idea
              </Label>
              <Textarea
                id="idea-solution"
                value={solution}
                onChange={(event) => setSolution(event.target.value)}
                placeholder="Example: summarize notes, retrieve documents, flag risks, or guide the next step."
                className="min-h-[88px] resize-none"
                maxLength={500}
              />
            </div>

            <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                "Save reflection"
              )}
            </Button>

            {sessionIdeas.length > 0 && (
              <>
                <div className="my-1 border-t border-border" />
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Saved this session ({sessionIdeas.length})
                </p>
                {sessionIdeas.map((idea) => (
                  <div
                    key={`${idea.termId}-${idea.ts}-${idea.title}`}
                    className="rounded-md border border-border border-l-2 border-l-green-500 bg-muted/20 p-3"
                  >
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-xs">
                        {idea.termIcon} {idea.termName}
                      </Badge>
                      {idea.role && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          {idea.role}
                        </Badge>
                      )}
                    </div>
                    <p className="mb-1 text-sm font-medium text-foreground">{idea.title}</p>
                    <p className="text-xs leading-snug text-muted-foreground">
                      <span className="font-medium">Applies here:</span> {idea.problem}
                    </p>
                    {idea.solution && (
                      <p className="mt-1 text-xs leading-snug text-muted-foreground">
                        <span className="font-medium">Follow-up:</span> {idea.solution}
                      </p>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}