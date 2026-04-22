import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Loader2,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RoutingProposalChange {
  routing_step_id: string;
  queue_item_id: string;
  work_order?: string;
  step_number?: number;
  operation_name?: string;
  from_station_id?: string | null;
  from_station_name?: string | null;
  to_station_id: string;
  to_station_name?: string | null;
  reason?: string;
}

export interface RoutingProposal {
  title: string;
  rationale: string;
  effort_tier?: 1 | 2 | 3 | 4;
  changes: RoutingProposalChange[];
  warnings?: string[];
}

interface Props {
  organizationId: string;
  proposal: RoutingProposal;
  canApprove: boolean;
}

const TIER_LABEL: Record<number, string> = {
  1: "Tier 1 — No program change",
  2: "Tier 2 — Re-post only",
  3: "Tier 3 — Re-program required",
  4: "Tier 4 — Not portable",
};

export function RoutingProposalCard({ organizationId, proposal, canApprove }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<{
    appliedCount: number;
    failedCount: number;
  } | null>(null);
  const [rejected, setRejected] = useState(false);

  const handleApply = async () => {
    setApplying(true);
    try {
      const { data, error } = await supabase.functions.invoke("apply-routing-change", {
        body: {
          organization_id: organizationId,
          proposal_title: proposal.title,
          proposal_rationale: proposal.rationale,
          changes: proposal.changes.map((c) => ({
            routing_step_id: c.routing_step_id,
            queue_item_id: c.queue_item_id,
            to_station_id: c.to_station_id,
            reason: c.reason,
            work_order: c.work_order,
            step_number: c.step_number,
            operation_name: c.operation_name,
            from_station_id: c.from_station_id ?? null,
            from_station_name: c.from_station_name ?? null,
            to_station_name: c.to_station_name ?? null,
          })),
        },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error ?? "Failed to apply routing changes");

      setApplied({
        appliedCount: data.applied ?? 0,
        failedCount: data.failed ?? 0,
      });

      if (data.failed > 0) {
        toast.warning(
          `Applied ${data.applied} of ${data.requested} changes. ${data.failed} failed — see chat for details.`,
        );
      } else {
        toast.success(`Routing updated — ${data.applied} step(s) reassigned.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to apply routing: ${msg}`);
    } finally {
      setApplying(false);
      setConfirmOpen(false);
    }
  };

  if (rejected) {
    return (
      <div className="mt-3 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground flex items-center gap-2">
        <XCircle className="w-3.5 h-3.5" /> Proposal rejected — no changes were made.
      </div>
    );
  }

  if (applied) {
    return (
      <div className="mt-3 rounded-md border border-status-ok/30 bg-status-ok/5 p-3 text-xs flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-status-ok" />
        <span>
          Applied <strong>{applied.appliedCount}</strong> change(s)
          {applied.failedCount > 0 && (
            <>
              , <strong>{applied.failedCount}</strong> failed
            </>
          )}
          .
        </span>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Routing change proposal</span>
            {proposal.effort_tier && (
              <Badge variant="secondary" className="text-[10px]">
                {TIER_LABEL[proposal.effort_tier] ?? `Tier ${proposal.effort_tier}`}
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium">{proposal.title}</p>
          <p className="text-xs text-muted-foreground">{proposal.rationale}</p>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px]">
          {proposal.changes.length} step{proposal.changes.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {proposal.warnings && proposal.warnings.length > 0 && (
        <div className="rounded-md border border-status-warn/30 bg-status-warn/5 p-2 space-y-1">
          {proposal.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-status-warn shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-md border bg-background overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Work Order</TableHead>
              <TableHead className="text-xs">Step</TableHead>
              <TableHead className="text-xs">Operation</TableHead>
              <TableHead className="text-xs">From → To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposal.changes.map((c) => (
              <TableRow key={c.routing_step_id}>
                <TableCell className="text-xs font-mono">{c.work_order ?? "—"}</TableCell>
                <TableCell className="text-xs">{c.step_number ?? "—"}</TableCell>
                <TableCell className="text-xs">{c.operation_name ?? "—"}</TableCell>
                <TableCell className="text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">
                      {c.from_station_name ?? "(unassigned)"}
                    </span>
                    <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                    <span className="font-medium">{c.to_station_name ?? c.to_station_id.slice(0, 8)}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!canApprove ? (
        <p className="text-xs text-muted-foreground italic">
          Only supervisors or admins can approve routing changes. Share this proposal with a supervisor.
        </p>
      ) : (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRejected(true)}
            disabled={applying}
          >
            Reject
          </Button>
          <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={applying}>
            {applying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Applying…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Approve & Apply
              </>
            )}
          </Button>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply routing changes?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  You are about to reassign <strong>{proposal.changes.length}</strong> routing
                  step{proposal.changes.length === 1 ? "" : "s"} based on the AI's recommendation.
                </p>
                <p className="text-xs text-muted-foreground">
                  This action is logged with your name and the AI's rationale. You can revert it
                  later from the Routing editor on each affected work order.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applying}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApply} disabled={applying}>
              {applying ? "Applying…" : "Yes, apply changes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
