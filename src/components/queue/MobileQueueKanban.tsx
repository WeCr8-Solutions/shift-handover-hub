import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { QueueItem, QueueStatus, QueuePriority } from "@/hooks/useQueue";
import { cn } from "@/lib/utils";
import { Clock, User, Package, AlertTriangle, ChevronLeft, ChevronRight, ArrowRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { woToast } from "@/lib/woToast";
import { getPriorityBadgeColor, getQueueStatusColumnColor } from "@/lib/status-colors";
import { ItemTypeBadge } from "@/components/queue/ItemTypeBadge";

interface Props {
  itemsByStatus: Record<QueueStatus, QueueItem[]>;
  onItemClick: (itemId: string) => void;
  onStatusChange: (itemId: string, newStatus: QueueStatus) => Promise<{ error: string | null }>;
  requiresStationCheckIn?: boolean;
  onRequestStationCheckIn?: () => void;
}

const VALID_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  pending: ["queued", "cancelled"],
  queued: ["in_progress", "cancelled", "pending"],
  in_progress: ["on_hold", "completed", "queued", "cancelled"],
  on_hold: ["in_progress", "cancelled"],
  completed: ["pending"],
  cancelled: [],
};

const COLUMNS: { status: QueueStatus; title: string }[] = [
  { status: "pending", title: "Pending" },
  { status: "queued", title: "Queued" },
  { status: "in_progress", title: "In Progress" },
  { status: "on_hold", title: "On Hold" },
  { status: "completed", title: "Completed" },
  { status: "cancelled", title: "Cancelled" },
];

const STATUS_LABEL: Record<QueueStatus, string> = {
  pending: "Pending",
  queued: "Queued",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

function isOverdue(item: QueueItem) {
  return item.due_date && new Date(item.due_date) < new Date() && item.status !== "completed";
}

function getPriorityColor(p: QueuePriority) {
  return getPriorityBadgeColor(p);
}

export function MobileQueueKanban({
  itemsByStatus,
  onItemClick,
  onStatusChange,
  requiresStationCheckIn,
  onRequestStationCheckIn,
}: Props) {
  const [activeIdx, setActiveIdx] = useState(2); // default In Progress
  const [actionItem, setActionItem] = useState<QueueItem | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeColumn = COLUMNS[activeIdx];
  const activeItems = useMemo(
    () => (itemsByStatus[activeColumn.status] || []).slice().sort((a, b) => a.position - b.position),
    [itemsByStatus, activeColumn.status],
  );

  // Sync scroll → activeIdx (horizontal column pager)
  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeIdx && idx >= 0 && idx < COLUMNS.length) {
      setActiveIdx(idx);
    }
  }, [activeIdx]);

  const goTo = useCallback((idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(COLUMNS.length - 1, idx));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setActiveIdx(clamped);
  }, []);

  useEffect(() => {
    // initial align to default column
    const el = scrollerRef.current;
    if (el) el.scrollLeft = activeIdx * el.clientWidth;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startLongPress = (item: QueueItem) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(20);
      setActionItem(item);
    }, 450);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleQuickMove = async (target: QueueStatus) => {
    if (!actionItem) return;
    if (requiresStationCheckIn) {
      woToast.blocked("Check-in required", "Check in to a station before changing work order status.");
      onRequestStationCheckIn?.();
      setActionItem(null);
      return;
    }
    const valid = VALID_TRANSITIONS[actionItem.status] || [];
    if (!valid.includes(target)) {
      woToast.blocked(
        "Invalid transition",
        `Cannot move "${STATUS_LABEL[actionItem.status]}" to "${STATUS_LABEL[target]}".`,
        actionItem.work_order,
      );
      return;
    }
    const res = await onStatusChange(actionItem.id, target);
    if (res.error) {
      woToast.error("Status update failed", res.error, actionItem.work_order);
    } else {
      woToast.success(`Moved to ${STATUS_LABEL[target]}`, actionItem.work_order);
      setActionItem(null);
    }
  };

  const nextValid = actionItem ? (VALID_TRANSITIONS[actionItem.status] || []) : [];

  return (
    <div className="flex flex-col gap-2">
      {/* Pager header */}
      <div className="flex items-center justify-between gap-2 sticky top-0 z-10 bg-background/95 backdrop-blur py-2 -mx-2 px-2 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goTo(activeIdx - 1)}
          disabled={activeIdx === 0}
          aria-label="Previous column"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col items-center flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{activeColumn.title}</div>
          <div className="flex items-center gap-1.5 mt-1">
            {COLUMNS.map((c, i) => (
              <button
                key={c.status}
                onClick={() => goTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === activeIdx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30",
                )}
                aria-label={`Go to ${c.title}`}
              />
            ))}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goTo(activeIdx + 1)}
          disabled={activeIdx === COLUMNS.length - 1}
          aria-label="Next column"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Snap scroller */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory -mx-2 px-2 scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {COLUMNS.map((column) => {
          const cols = (itemsByStatus[column.status] || []).slice().sort((a, b) => a.position - b.position);
          return (
            <div
              key={column.status}
              className="snap-center shrink-0 w-full pr-2"
            >
              <Card className={cn("min-h-[60vh] p-2", getQueueStatusColumnColor(column.status))}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    {column.title}
                  </div>
                  <Badge variant="secondary">{cols.length}</Badge>
                </div>
                <div className="space-y-2">
                  {cols.length === 0 && (
                    <div className="text-center py-12 text-sm text-muted-foreground">No items</div>
                  )}
                  {cols.map((item) => {
                    const overdue = isOverdue(item);
                    return (
                      <div
                        key={item.id}
                        onClick={() => onItemClick(item.id)}
                        onTouchStart={() => startLongPress(item)}
                        onTouchEnd={cancelLongPress}
                        onTouchMove={cancelLongPress}
                        onTouchCancel={cancelLongPress}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setActionItem(item);
                        }}
                        className={cn(
                          "p-3 bg-card rounded-lg border shadow-sm cursor-pointer transition-all active:scale-[0.98] select-none",
                          item.item_type === "quote" && "border-l-4 border-l-warning",
                          item.item_type === "work_order" && "border-l-4 border-l-primary",
                          overdue && "border-status-critical/30 bg-status-critical/5",
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge className={cn("text-xs", getPriorityColor(item.priority))}>
                            {item.priority}
                          </Badge>
                          {(item.item_type === "quote" || item.item_type === "work_order") && (
                            <ItemTypeBadge type={item.item_type} />
                          )}
                          {item.erp_source && <ItemTypeBadge type="erp" />}
                        </div>
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        {item.work_order && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Package className="w-3 h-3" />
                            <span>{item.item_type === "quote" ? "Quote #" : "WO #"}: {item.work_order}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2 gap-2">
                          {item.due_date && (
                            <div className={cn("flex items-center gap-1 text-xs", overdue ? "text-status-critical" : "text-muted-foreground")}>
                              {overdue && <AlertTriangle className="w-3 h-3" />}
                              <Clock className="w-3 h-3" />
                              <span>{format(new Date(item.due_date), "MMM d")}</span>
                            </div>
                          )}
                          {item.assigned_to && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />
                              <span>Assigned</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-[10px] text-muted-foreground/70">
                          Long-press to change status
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Bottom action sheet for status change */}
      <Drawer open={!!actionItem} onOpenChange={(o) => !o && setActionItem(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="truncate">
              {actionItem?.work_order ? `${actionItem.work_order} · ` : ""}{actionItem?.title}
            </DrawerTitle>
            <DrawerDescription>
              Currently in <strong>{actionItem ? STATUS_LABEL[actionItem.status] : ""}</strong>. Move to:
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-2 grid grid-cols-1 gap-2">
            {nextValid.length === 0 && (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No further transitions available from this state.
              </div>
            )}
            {nextValid.map((s) => (
              <Button
                key={s}
                variant="secondary"
                className="justify-between h-12"
                onClick={() => handleQuickMove(s)}
              >
                <span>{STATUS_LABEL[s]}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ))}
            {actionItem && (
              <Button
                variant="outline"
                className="justify-between h-12 mt-2"
                onClick={() => {
                  const id = actionItem.id;
                  setActionItem(null);
                  onItemClick(id);
                }}
              >
                <span>Open details</span>
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            )}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
