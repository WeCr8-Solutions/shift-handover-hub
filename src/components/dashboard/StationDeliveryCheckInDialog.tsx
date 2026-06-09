/**
 * StationDeliveryCheckInDialog
 *
 * Mounted on the operator dashboard. When an operator is checked into one or
 * more stations and there are deliveries in `awaiting_acceptance` for those
 * stations (i.e. parts + paperwork were dropped off while no-one was there),
 * we surface a single dialog so they explicitly confirm receipt. Each accept
 * runs the `accept_delivery` RPC which clears `queue_items.awaiting_delivery`
 * and writes a queue history entry.
 *
 * The dialog is shown once per (session × station-set × delivery-set) so it
 * never nags the operator after they've handled it.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, PackageCheck, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDeliveryRequests } from "@/hooks/useDeliveryRequests";
import { toast } from "sonner";

interface StationDeliveryCheckInDialogProps {
  /** Stations the operator is currently checked into. */
  stationIds: string[];
}

const PENDING_STATUSES = new Set(["awaiting_acceptance", "delivered"]);

export function StationDeliveryCheckInDialog({ stationIds }: StationDeliveryCheckInDialogProps) {
  const { deliveries, acceptDelivery } = useDeliveryRequests();
  const [dismissedSignature, setDismissedSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const pending = useMemo(
    () =>
      deliveries.filter(
        (d) => PENDING_STATUSES.has(d.status) && d.to_station_id && stationIds.includes(d.to_station_id),
      ),
    [deliveries, stationIds],
  );

  // Stable signature so we only auto-open once per delivery batch.
  const signature = useMemo(
    () => pending.map((d) => d.id).sort().join("|"),
    [pending],
  );

  useEffect(() => {
    if (pending.length > 0 && signature !== dismissedSignature) {
      setOpen(true);
    }
  }, [pending.length, signature, dismissedSignature]);

  const handleAcceptAll = async () => {
    setBusy(true);
    let failures = 0;
    for (const d of pending) {
      const { error } = await acceptDelivery(d.id);
      if (error) failures += 1;
    }
    setBusy(false);
    if (failures > 0) {
      toast.error(`${failures} of ${pending.length} deliveries could not be accepted`);
    } else {
      toast.success(`Checked in ${pending.length} delivery${pending.length === 1 ? "" : "s"}`);
    }
    setDismissedSignature(signature);
    setOpen(false);
  };

  const handleAcceptOne = async (id: string) => {
    setBusy(true);
    const { error } = await acceptDelivery(id);
    setBusy(false);
    if (error) toast.error("Could not accept", { description: error });
    else toast.success("Accepted");
  };

  const handleDefer = () => {
    setDismissedSignature(signature);
    setOpen(false);
    toast.info("You can accept these later from the delivery panel.");
  };

  if (pending.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? handleDefer() : setOpen(o))}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-status-warning" />
            Confirm received deliveries
          </DialogTitle>
          <DialogDescription>
            {pending.length === 1
              ? "A delivery was dropped off at your station while you were away. Please verify you have the parts and paperwork before accepting."
              : `${pending.length} deliveries were dropped off at your station while you were away. Please verify you have the parts and paperwork before accepting.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {pending.map((d) => (
            <div key={d.id} className="rounded-md border border-status-warning/40 bg-status-warning/5 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">
                      {d.work_order || d.part_number || "Work Order"}
                    </span>
                    {d.quantity != null && (
                      <Badge variant="secondary" className="text-[10px]">Qty {d.quantity}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 flex-wrap">
                    <span className="font-mono">{d.from_station_name || "—"}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="font-mono">{d.to_station_name || "—"}</span>
                    <span className="ml-1">
                      · dropped {formatDistanceToNow(new Date(d.delivered_at || d.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                  {d.delivered_by_name && (
                    <div className="text-xs text-muted-foreground mt-1">
                      By <span className="font-medium">{d.delivered_by_name}</span>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAcceptOne(d.id)}
                  disabled={busy}
                >
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={handleDefer} disabled={busy}>
            Remind me later
          </Button>
          <Button onClick={handleAcceptAll} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
            Accept all ({pending.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
