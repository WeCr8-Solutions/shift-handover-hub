import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueueItem, QueueItemComment, QueueItemHistory, UpdateQueueItemInput } from "@/hooks/useQueue";
import { useStations } from "@/hooks/useStations";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { useNCR } from "@/hooks/useNCR";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { GitBranch, MessageSquare, History, ShieldAlert } from "lucide-react";
import { QuantitySummaryCard } from "@/components/ncr/QuantitySummaryCard";
import { CreateNCRDialog } from "@/components/ncr/CreateNCRDialog";
import { NCRListView } from "@/components/ncr/NCRListView";
import { Button } from "@/components/ui/button";
import { QueueItemHeader } from "./QueueItemHeader";
import { QueueItemActions } from "./QueueItemActions";
import { QueueItemDetailsTab } from "./QueueItemDetailsTab";
import { QueueItemRoutingTab } from "./QueueItemRoutingTab";
import { QueueItemCommentsTab } from "./QueueItemCommentsTab";
import { QueueItemHistoryTab } from "./QueueItemHistoryTab";

interface RoutingStepRow {
  id: string;
  step_number: number;
  operation_name: string;
  operation_type: string;
  status: string;
  station_id: string | null;
  estimated_duration: number | null;
  started_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  outside_vendor: string | null;
  po_number: string | null;
  expected_return_date: string | null;
  completed_by_name?: string | null;
  station_name?: string | null;
  station_code?: string | null;
}

interface QueueItemDetailDialogProps {
  item: QueueItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, input: UpdateQueueItemInput) => Promise<{ error: string | null }>;
  onDelete: (id: string) => Promise<{ error: string | null }>;
  onAddComment: (itemId: string, content: string) => Promise<{ error: string | null }>;
  getComments: (itemId: string) => Promise<{ data: QueueItemComment[] | null; error: string | null }>;
  getHistory: (itemId: string) => Promise<{ data: QueueItemHistory[] | null; error: string | null }>;
  onOpenRouting?: (item: { id: string; work_order?: string | null; part_number?: string | null }) => void;
  /** Refresh the parent items list (e.g. after routing advancement) so station_id / status reflect server state immediately. */
  onRefreshItems?: () => void;
}

export function QueueItemDetailDialog({
  item,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  onAddComment,
  getComments,
  getHistory,
  onOpenRouting,
  onRefreshItems,
}: QueueItemDetailDialogProps) {
  const { currentTeam } = useCurrentTeam();
  const { organization } = useOrgContext();
  const { stations } = useStations(currentTeam?.id, organization?.id);
  const { ncrs, createNCR, uploadNCRImage } = useNCR(item ? { queue_item_id: item.id } : undefined);

  const [comments, setComments] = useState<QueueItemComment[]>([]);
  const [history, setHistory] = useState<QueueItemHistory[]>([]);
  const [routingSteps, setRoutingSteps] = useState<RoutingStepRow[]>([]);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [ncrDialogOpen, setNcrDialogOpen] = useState(false);
  const [assignedUserName, setAssignedUserName] = useState<string | null>(null);
  const [createdByName, setCreatedByName] = useState<string | null>(null);

  const assignedStation = item?.station_id ? stations.find(s => s.id === item.station_id) ?? null : null;

  // Parallelise all on-open fetches to cut perceived load time on the WO detail drawer.
  // Previously these ran sequentially in the effect body which caused noticeable lag
  // (comments → history → routing → user names, ~4 round-trips serialised).
  useEffect(() => {
    if (item && open) {
      void Promise.all([loadComments(), loadHistory(), loadRouting(), loadUserNames()]);
    }
  }, [item, open]);

  const loadComments = async () => {
    if (!item) return;
    const { data } = await getComments(item.id);
    setComments(data || []);
  };

  const loadUserNames = async () => {
    if (!item) return;
    const userIds = [item.assigned_to, item.created_by].filter(Boolean) as string[];
    if (userIds.length === 0) { setAssignedUserName(null); setCreatedByName(null); return; }
    const { data } = await supabase.from('profiles').select('user_id, display_name').in('user_id', userIds);
    const map = new Map((data || []).map((p: any) => [p.user_id, p.display_name]));
    setAssignedUserName(item.assigned_to ? map.get(item.assigned_to) || null : null);
    setCreatedByName(item.created_by ? map.get(item.created_by) || null : null);
  };

  const loadHistory = async () => {
    if (!item) return;
    const { data } = await getHistory(item.id);
    setHistory(data || []);
  };

  const loadRouting = async () => {
    if (!item) return;
    setRoutingLoading(true);
    try {
      const { data, error } = await supabase
        .from('work_order_routing')
        .select('*')
        .eq('queue_item_id', item.id)
        .order('step_number', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const completedByIds = [...new Set(data.filter(s => s.completed_by).map(s => s.completed_by!))];
        const stationIds = [...new Set(data.filter(s => s.station_id).map(s => s.station_id!))];

        const [profilesRes, stationsRes] = await Promise.all([
          completedByIds.length > 0
            ? supabase.from('profiles').select('user_id, display_name').in('user_id', completedByIds)
            : Promise.resolve({ data: [] as any[] }),
          stationIds.length > 0
            ? supabase.from('stations').select('id, name, station_id').in('id', stationIds)
            : Promise.resolve({ data: [] as any[] }),
        ]);

        const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p.display_name]));
        const stationMap = new Map((stationsRes.data || []).map((s: any) => [s.id, { name: s.name, code: s.station_id }]));

        setRoutingSteps(data.map(step => ({
          ...step,
          completed_by_name: step.completed_by ? profileMap.get(step.completed_by) || null : null,
          station_name: step.station_id ? stationMap.get(step.station_id)?.name || null : null,
          station_code: step.station_id ? stationMap.get(step.station_id)?.code || null : null,
        })));
      } else {
        setRoutingSteps([]);
      }
    } catch {
      setRoutingSteps([]);
    } finally {
      setRoutingLoading(false);
    }
  };

  if (!item) return null;

  const isOverdue = !!(item.due_date && new Date(item.due_date) < new Date() && item.status !== "completed");
  const isQuote = item.item_type === "quote";
  const isWorkOrder = item.item_type === "work_order";
  const elapsedTime = item.started_at && !item.completed_at
    ? formatDistanceToNow(new Date(item.started_at), { addSuffix: false })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="wo-drawer"
        data-wo-id={item.id}
        data-wo-code={item.work_order ?? ""}
        className="max-w-2xl w-[calc(100vw-1rem)] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6"
      >
        <QueueItemHeader
          item={item}
          assignedStation={assignedStation}
          isOverdue={isOverdue}
          elapsedTime={elapsedTime}
          assignedUserName={assignedUserName}
          createdByName={createdByName}
        />

        <QueueItemActions
          item={item}
          stations={stations}
          routingSteps={routingSteps}
          onUpdate={onUpdate}
          onReloadHistory={loadHistory}
          onReloadRouting={loadRouting}
          onOpenRouting={onOpenRouting}
          onOpenNCR={() => setNcrDialogOpen(true)}
          onCloseDialog={() => onOpenChange(false)}
        />

        {(isWorkOrder || isQuote) && item.qty_original != null && item.qty_original > 0 && (
          <QuantitySummaryCard
            original={item.qty_original ?? 0}
            completed={item.qty_completed ?? 0}
            scrap={item.qty_scrap ?? 0}
            rework={item.qty_rework ?? 0}
            open={item.qty_open ?? 0}
            locked={item.quantity_locked ?? false}
          />
        )}

        <div>
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="routing" className="gap-1" data-tour="routing-tab">
                <GitBranch className="w-4 h-4" />
                <span className="hidden sm:inline">Routing</span>
              </TabsTrigger>
              <TabsTrigger value="ncr" className="gap-1">
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden sm:inline">NCR</span> ({ncrs.length})
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-1">
                <MessageSquare className="w-4 h-4" />
                ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1">
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4 space-y-4">
              <QueueItemDetailsTab
                item={item}
                assignedStation={assignedStation}
                isOverdue={isOverdue}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onReloadHistory={loadHistory}
                onCloseDialog={() => onOpenChange(false)}
              />
            </TabsContent>

            <TabsContent value="routing" className="mt-4">
              <QueueItemRoutingTab
                item={item}
                routingSteps={routingSteps}
                routingLoading={routingLoading}
                stations={stations}
                onReloadRouting={loadRouting}
                onOpenRouting={onOpenRouting}
              />
            </TabsContent>

            <TabsContent value="ncr" className="mt-4">
              <NCRListView ncrs={ncrs} />
              {ncrs.length === 0 && (
                <div className="text-center py-8 space-y-3">
                  <ShieldAlert className="w-10 h-10 mx-auto text-muted-foreground/40" />
                  <p className="text-muted-foreground">No NCRs reported for this work order.</p>
                  <Button variant="outline" size="sm" onClick={() => setNcrDialogOpen(true)} className="gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Report NCR
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <QueueItemCommentsTab
                comments={comments}
                onAddComment={onAddComment}
                itemId={item.id}
                onReloadComments={loadComments}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <QueueItemHistoryTab history={history} />
            </TabsContent>
          </Tabs>
        </div>


        {item && (
          <CreateNCRDialog
            open={ncrDialogOpen}
            onOpenChange={setNcrDialogOpen}
            workOrderNumber={item.work_order || ''}
            partNumber={item.part_number}
            queueItemId={item.id}
            qtyOpen={item.qty_open ?? item.quantity ?? 0}
            onUploadImage={uploadNCRImage}
            onSubmit={createNCR}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
