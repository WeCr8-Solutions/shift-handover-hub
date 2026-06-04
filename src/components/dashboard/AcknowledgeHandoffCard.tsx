import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useHandoffAck } from "@/hooks/useHandoffAck";

interface AcknowledgeHandoffCardProps {
  stationIds: string[];
}

/**
 * Surfaced on the Operator dashboard at first check-in of a shift. Shows any
 * handoff(s) from the prior shift on this user's stations that haven't yet
 * been acknowledged, and provides a one-click acknowledgement.
 */
export function AcknowledgeHandoffCard({ stationIds }: AcknowledgeHandoffCardProps) {
  const stations = useMemo(() => stationIds, [stationIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  const { pending, loading, acknowledge } = useHandoffAck(stations);

  if (loading || pending.length === 0) return null;

  return (
    <Card
      className="border-primary/40 bg-primary/5"
      data-testid="acknowledge-handoff-card"
      aria-label="Pending handoff acknowledgements"
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Handoff from prior shift</h3>
          <Badge variant="secondary" className="text-[10px] ml-auto">
            {pending.length} pending
          </Badge>
        </div>

        <ul className="space-y-2">
          {pending.map((h) => (
            <li
              key={h.id}
              className="rounded-md border border-border bg-card p-3 text-xs space-y-1.5"
              data-testid={`pending-handoff-${h.id}`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="font-medium text-sm">
                  {h.work_order} · {h.part_number}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {h.shift} · {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className="text-muted-foreground">
                From <span className="text-foreground">{h.outgoing_operator_name}</span> on {h.machine_id}
              </div>
              {h.process_notes_for_next_shift && (
                <div className="rounded bg-muted/50 p-2 text-[11px] leading-relaxed">
                  {h.process_notes_for_next_shift}
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="default"
                  className="gap-1.5 h-8"
                  onClick={async () => {
                    const { error } = await acknowledge(h.id);
                    if (error) toast.error(error);
                    else toast.success("Handoff acknowledged");
                  }}
                  data-testid={`ack-button-${h.id}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Acknowledge
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
