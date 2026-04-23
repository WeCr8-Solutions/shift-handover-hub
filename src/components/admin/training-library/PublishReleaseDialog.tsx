import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { usePublishRelease, type ReleaseEntityType, type ReleaseProgram } from "@/hooks/useProgramReleaseLog";

interface Props {
  program: ReleaseProgram;
  entityType: ReleaseEntityType;
  entityId: string;
  entityLabel?: string | null;
  organizationId?: string | null;
  contentTable?: "gca_question_banks" | "oap_courses" | "oap_lessons" | "oap_quizzes" | "certificate_templates";
  /** Optional disabled state, e.g. when entity is unsaved. */
  disabled?: boolean;
  triggerLabel?: string;
}

export function PublishReleaseDialog({
  program,
  entityType,
  entityId,
  entityLabel,
  organizationId,
  contentTable,
  disabled,
  triggerLabel = "Save & Publish",
}: Props) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [notes, setNotes] = useState("");
  const publish = usePublishRelease();

  const handlePublish = async () => {
    await publish.mutateAsync({
      program,
      entityType,
      entityId,
      entityLabel: entityLabel ?? null,
      contentYear: year,
      releaseNotes: notes.trim() || null,
      organizationId: organizationId ?? null,
      contentTable,
    });
    setOpen(false);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled} className="gap-1">
          <Send className="w-3.5 h-3.5" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Publish {program} — {entityType}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Content year</Label>
            <Input
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Release notes (optional, max 500 chars)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              rows={4}
              placeholder="What changed in this release?"
            />
            <p className="text-[10px] text-muted-foreground text-right mt-1">{notes.length}/500</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handlePublish} disabled={publish.isPending}>
            {publish.isPending ? "Publishing..." : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
