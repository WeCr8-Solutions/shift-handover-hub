/**
 * DeliveryHandoffPanel
 *
 * Operator/Supervisor surface showing all parts + paperwork that need to be
 * physically walked between stations after a routing-advance. Anyone in the
 * org can pick up + drop off; we capture who did each step for audit.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, PackageCheck, Truck, Package, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useDeliveryRequests, type DeliveryRequest } from "@/hooks/useDeliveryRequests";
import { useAdminAccess } from "@/hooks/useAdminData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DeliveryHandoffPanelProps {
  /** When set, only show deliveries arriving at this station (operator view). */
  toStationId?: string;
  /** Compact = small card; default = full panel. */
  compact?: boolean;
}

export function DeliveryHandoffPanel({ toStationId, compact = false }: DeliveryHandoffPanelProps) {
  const { deliveries, loading, error, markPickedUp, markDelivered, acceptDelivery, forceAccept } =
    useDeliveryRequests();
  const { hasOrgSupervisorAccess } = useAdminAccess();
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = toStationId
    ? deliveries.filter((d) => d.to_station_id === toStationId)
    : deliveries;

  const handlePickup = async (id: string) => {
    setBusyId(id);
    const { error: err } = await markPickedUp(id);
    setBusyId(null);
    if (err) toast.error("Could not mark as picked up", { description: err });
    else toast.success("Picked up — please walk it to the next station");
  };

  const handleDelivered = async (id: string) => {
    setBusyId(id);
    const { error: err } = await markDelivered(id);
    setBusyId(null);
    if (err) toast.error("Could not mark as delivered", { description: err });
    else toast.success("Dropped off — waiting on receiving station to accept");
  };

  const handleAccept = async (id: string) => {
    setBusyId(id);
    const { error: err } = await acceptDelivery(id);
    setBusyId(null);
    if (err) toast.error("Could not accept delivery", { description: err });
    else toast.success("Accepted — work order is now active in your queue");
  };

  const handleForceAccept = async (id: string) => {
    setBusyId(id);
    const { error: err } = await forceAccept(id);
    setBusyId(null);
    if (err) toast.error("Could not override acceptance", { description: err });
    else toast.success("Force-accepted on behalf of station");
  };

  if (loading && filtered.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Pending physical deliveries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (filtered.length === 0) {
    if (compact) return null;
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Pending physical deliveries
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4 text-sm text-muted-foreground flex items-center gap-2">
          <PackageCheck className="w-4 h-4 text-status-ok" />
          No work is waiting to be walked between stations.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="w-4 h-4" />
          {toStationId ? "Incoming deliveries" : "Pending physical deliveries"}
          <Badge variant="secondary">{filtered.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {filtered.map((d) => (
          <DeliveryRow
            key={d.id}
            delivery={d}
            busy={busyId === d.id}
            canForceAccept={hasOrgSupervisorAccess}
            onPickup={() => handlePickup(d.id)}
            onDelivered={() => handleDelivered(d.id)}
            onAccept={() => handleAccept(d.id)}
            onForceAccept={() => handleForceAccept(d.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface DeliveryRowProps {
  delivery: DeliveryRequest;
  busy: boolean;
  canForceAccept: boolean;
  onPickup: () => void;
  onDelivered: () => void;
  onAccept: () => void;
  onForceAccept: () => void;
}

function DeliveryRow({
  delivery,
  busy,
  canForceAccept,
  onPickup,
  onDelivered,
  onAccept,
  onForceAccept,
}: DeliveryRowProps) {
  const isInTransit = delivery.status === "in_transit";
  const isAwaitingAcceptance =
    delivery.status === "awaiting_acceptance" || delivery.status === "delivered";
  const age = formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true });

  let badgeLabel = "Pending pickup";
  if (isInTransit) badgeLabel = "In transit";
  else if (isAwaitingAcceptance) badgeLabel = "Awaiting acceptance";

  const containerClass = isAwaitingAcceptance
    ? "border-status-warning bg-status-warning/10"
    : isInTransit
      ? "border-status-warning/50 bg-status-warning/5"
      : "border-border bg-card";

  return (
    <div className={cn("rounded-md border p-3 space-y-2 transition-colors", containerClass)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Package className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-medium text-sm truncate">
              {delivery.work_order || delivery.part_number || "Work Order"}
            </span>
            {delivery.part_number && delivery.work_order && (
              <span className="text-xs text-muted-foreground truncate">
                · {delivery.part_number}
              </span>
            )}
            <Badge
              variant={isAwaitingAcceptance || isInTransit ? "default" : "secondary"}
              className="text-[10px]"
            >
              {badgeLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 flex-wrap">
            <span className="font-mono">{delivery.from_station_name || "—"}</span>
            <ArrowRight className="w-3 h-3" />
            <span className="font-mono">{delivery.to_station_name || "—"}</span>
            {delivery.quantity != null && (
              <span className="ml-1">· Qty {delivery.quantity}</span>
            )}
            <span className="ml-1 inline-flex items-center gap-0.5">
              <Clock className="w-3 h-3" /> {age}
            </span>
          </div>
          {isAwaitingAcceptance && delivery.delivered_by_name && (
            <div className="text-xs text-muted-foreground mt-1">
              Dropped off by <span className="font-medium">{delivery.delivered_by_name}</span>
            </div>
          )}
          {isInTransit && delivery.picked_up_by_name && (
            <div className="text-xs text-muted-foreground mt-1">
              Carried by <span className="font-medium">{delivery.picked_up_by_name}</span>
            </div>
          )}
          {delivery.requested_by_name && !isInTransit && !isAwaitingAcceptance && (
            <div className="text-xs text-muted-foreground mt-1">
              Released by <span className="font-medium">{delivery.requested_by_name}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          {isAwaitingAcceptance ? (
            <Button
              size="sm"
              variant="default"
              onClick={onAccept}
              disabled={busy}
              className="gap-1.5"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              Accept
            </Button>
          ) : (
            <>
              {!isInTransit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onPickup}
                  disabled={busy}
                  className="gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Pick up
                </Button>
              )}
              <Button
                size="sm"
                variant={isInTransit ? "default" : "secondary"}
                onClick={onDelivered}
                disabled={busy}
                className="gap-1.5"
              >
                <PackageCheck className="w-3.5 h-3.5" />
                Delivered
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
