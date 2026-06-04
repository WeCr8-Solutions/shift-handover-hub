import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, AlertOctagon, ShieldAlert } from "lucide-react";
import { useUpdateChecklistItem, type ChecklistItem } from "@/hooks/useOnboardingEngagements";

const STATUS_BUTTONS: Array<{ value: ChecklistItem["status"]; label: string; icon: typeof Circle }> = [
  { value: "todo", label: "To do", icon: Circle },
  { value: "in_progress", label: "In progress", icon: Circle },
  { value: "blocked", label: "Blocked", icon: AlertOctagon },
  { value: "done", label: "Done", icon: CheckCircle2 },
];

export function ChecklistModule({
  item,
  description,
  itarLocked = false,
}: {
  item: ChecklistItem;
  description: string;
  itarLocked?: boolean;
}) {
  const update = useUpdateChecklistItem();
  const [note, setNote] = useState(item.customer_blocker_note ?? "");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {item.label}
              {item.required && <Badge variant="outline" className="text-[10px]">required</Badge>}
              {itarLocked && (
                <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive text-[10px]">
                  <ShieldAlert className="w-3 h-3" /> ITAR: read-through enforced
                </Badge>
              )}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_BUTTONS.map((b) => {
            const Icon = b.icon;
            const active = item.status === b.value;
            return (
              <Button
                key={b.value}
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => update.mutate({ id: item.id, status: b.value })}
                disabled={update.isPending}
                className="gap-2"
              >
                <Icon className="w-3.5 h-3.5" /> {b.label}
              </Button>
            );
          })}
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Customer blocker / notes</label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => {
              if ((item.customer_blocker_note ?? "") !== note) {
                update.mutate({ id: item.id, customer_blocker_note: note || null });
              }
            }}
            rows={2}
            placeholder="Waiting on customer for IP whitelist..."
          />
        </div>
      </CardContent>
    </Card>
  );
}
