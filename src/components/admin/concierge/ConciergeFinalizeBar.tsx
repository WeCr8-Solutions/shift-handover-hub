import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Lock, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { useConciergeFinalization, type PackSnapshot } from "@/hooks/useConciergeFinalization";

interface Props {
  engagementId: string;
  canReopen: boolean;
  buildSnapshot: () => PackSnapshot;
  onFinalizedChange?: (finalized: boolean) => void;
}

/**
 * Persistent draft / finalize control for the Concierge Sales Pack.
 * Mounted in the toolbar; the parent passes a `buildSnapshot()` closure that
 * gathers every editable field, rep info, and sealed signature into a single
 * jsonb payload at save time.
 */
export function ConciergeFinalizeBar({ engagementId, canReopen, buildSnapshot, onFinalizedChange }: Props) {
  const { query, saveDraft, finalize, reopen } = useConciergeFinalization(engagementId);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  const row = query.data;
  const isFinalized = row?.status === "finalized";

  // Notify parent of finalized state so it can flip readOnly props.
  if (onFinalizedChange) onFinalizedChange(isFinalized);

  const handleSave = () => saveDraft.mutate(buildSnapshot());
  const handleFinalize = () => {
    finalize.mutate(buildSnapshot(), { onSuccess: () => setConfirmFinalize(false) });
  };
  const handleReopen = () => {
    reopen.mutate(reopenReason, {
      onSuccess: () => {
        setReopenOpen(false);
        setReopenReason("");
      },
    });
  };

  return (
    <div className="border-t pt-2 flex flex-wrap items-center gap-3 text-xs">
      <div className="font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <Save className="w-3.5 h-3.5" /> Master pack
      </div>

      {isFinalized ? (
        <div className="flex items-center gap-2 px-2 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>
            Finalized & sealed {row?.finalized_at ? new Date(row.finalized_at).toLocaleString() : ""}
            {row?.pack_hash ? ` · sha256 ${row.pack_hash.slice(0, 10)}…` : ""}
          </span>
        </div>
      ) : row ? (
        <div className="px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
          Draft saved {new Date(row.updated_at).toLocaleString()}
          {row.reopen_reason ? ` · re-opened: ${row.reopen_reason}` : ""}
        </div>
      ) : (
        <div className="text-muted-foreground">No draft saved yet. Save to resume later or hand off to a teammate.</div>
      )}

      <div className="flex items-center gap-2 ml-auto">
        <Button size="sm" variant="outline" onClick={handleSave} disabled={saveDraft.isPending || isFinalized} className="h-7 text-[11px] gap-1">
          <Save className="w-3.5 h-3.5" /> {saveDraft.isPending ? "Saving…" : "Save draft"}
        </Button>
        {isFinalized ? (
          canReopen ? (
            <Button size="sm" variant="ghost" onClick={() => setReopenOpen(true)} className="h-7 text-[11px] gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Re-open
            </Button>
          ) : null
        ) : (
          <Button size="sm" onClick={() => setConfirmFinalize(true)} disabled={finalize.isPending} className="h-7 text-[11px] gap-1">
            <Lock className="w-3.5 h-3.5" /> Finalize & Save Master
          </Button>
        )}
      </div>

      <Dialog open={confirmFinalize} onOpenChange={setConfirmFinalize}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize &amp; seal master copy?</DialogTitle>
            <DialogDescription>
              This locks every editable field, rep input, and signature in the pack. A SHA-256 hash is
              computed so any later change is detectable. You'll be able to print, email, or export the
              sealed master after this step. Re-opening is admin-only and requires a reason.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmFinalize(false)}>Cancel</Button>
            <Button onClick={handleFinalize} disabled={finalize.isPending} className="gap-1">
              <Lock className="w-4 h-4" /> {finalize.isPending ? "Sealing…" : "Finalize & Seal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reopenOpen} onOpenChange={setReopenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-open sealed pack for edits</DialogTitle>
            <DialogDescription>
              Provide a reason — it's appended to the finalization audit and visible to other concierge
              staff. Customer-acceptance flows should always be re-openable until the org owner signs off
              on go-live.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            rows={3}
            placeholder="e.g. customer needs to correct billing email and add 2 operators before signing."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenOpen(false)}>Cancel</Button>
            <Button onClick={handleReopen} disabled={!reopenReason.trim() || reopen.isPending} className="gap-1">
              <RotateCcw className="w-4 h-4" /> {reopen.isPending ? "Re-opening…" : "Re-open"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
