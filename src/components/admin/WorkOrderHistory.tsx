import { useState, useEffect } from "react";
import { useWorkOrderHistory, WorkOrderWithLinkedData, WorkOrderLinkedData } from "@/hooks/useWorkOrderHistory";
import { exportWorkOrdersToExcel, generateWorkOrderReport, downloadBlob, printReport } from "@/lib/workOrderExport";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Search, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Package, 
  Clock, 
  CheckCircle2,
  XCircle,
  Calendar,
  Loader2,
  Eye,
  GitBranch,
  Repeat,
  Lightbulb,
  AlertTriangle,
  MessageSquare,
  History,
  Filter,
  ChevronRight
} from "lucide-react";

interface WorkOrderHistoryProps {
  isAdmin?: boolean;
}

export function WorkOrderHistory({ isAdmin = false }: WorkOrderHistoryProps) {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderWithLinkedData | null>(null);
  const [linkedData, setLinkedData] = useState<WorkOrderLinkedData | null>(null);
  const [loadingLinked, setLoadingLinked] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [linkedDataMap, setLinkedDataMap] = useState<Map<string, WorkOrderLinkedData>>(new Map());

  const { workOrders, loading, fetchLinkedData } = useWorkOrderHistory({
    search: debouncedSearch,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch linked data when selecting a work order
  useEffect(() => {
    if (selectedWorkOrder) {
      setLoadingLinked(true);
      fetchLinkedData(selectedWorkOrder.id).then((data) => {
        setLinkedData(data);
        if (data) {
          setLinkedDataMap(prev => new Map(prev).set(selectedWorkOrder.id, data));
        }
        setLoadingLinked(false);
      });
    }
  }, [selectedWorkOrder, fetchLinkedData]);

  const handleExportExcel = async () => {
    if (workOrders.length === 0) {
      toast.error("No work orders to export");
      return;
    }

    setExporting(true);
    try {
      // Fetch linked data for all work orders
      const dataMap = new Map<string, WorkOrderLinkedData>();
      for (const wo of workOrders.slice(0, 50)) { // Limit to 50 for performance
        const data = await fetchLinkedData(wo.id);
        if (data) dataMap.set(wo.id, data);
      }

      const blob = await exportWorkOrdersToExcel(workOrders, dataMap);
      downloadBlob(blob, `work-order-history-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("Excel export downloaded");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export");
    }
    setExporting(false);
  };

  const handleExportPDF = () => {
    if (!selectedWorkOrder || !linkedData) {
      toast.error("Select a work order first");
      return;
    }
    const html = generateWorkOrderReport(selectedWorkOrder, linkedData);
    printReport(html);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "cancelled": return <XCircle className="w-4 h-4 text-red-500" />;
      case "in_progress": return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Package className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Work Order History
              </CardTitle>
              <CardDescription>
                Search and export completed work orders with linked production data
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleExportExcel}
                disabled={exporting || workOrders.length === 0}
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                )}
                Export Excel
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportPDF}
                disabled={!selectedWorkOrder}
              >
                <FileText className="w-4 h-4 mr-2" />
                Print Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by work order, part number, or title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div>
                <Label className="sr-only">From Date</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40"
                />
              </div>
              <div>
                <Label className="sr-only">To Date</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="border rounded-lg">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : workOrders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No completed work orders found</p>
                <p className="text-sm mt-1">Try adjusting your search or date filters</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {workOrders.map((wo) => (
                    <div
                      key={wo.id}
                      className="p-4 hover:bg-muted/50 cursor-pointer flex items-center gap-4 transition-colors"
                      onClick={() => setSelectedWorkOrder(wo)}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {getStatusIcon(wo.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{wo.work_order || wo.title}</span>
                          <Badge variant="outline" className={getStatusColor(wo.status)}>
                            {wo.status}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {wo.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {wo.part_number && (
                            <span>Part: {wo.part_number}</span>
                          )}
                          {wo.station_name && (
                            <span>• {wo.station_name}</span>
                          )}
                          {wo.completed_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(wo.completed_at), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {workOrders.length} completed work orders
          </p>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedWorkOrder} onOpenChange={(open) => !open && setSelectedWorkOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {selectedWorkOrder?.work_order || selectedWorkOrder?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedWorkOrder && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              {/* Header Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Part Number</p>
                  <p className="font-medium">{selectedWorkOrder.part_number || "N/A"}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="font-medium">{selectedWorkOrder.quantity || "N/A"}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Station</p>
                  <p className="font-medium">{selectedWorkOrder.station_name || "N/A"}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="font-medium">
                    {selectedWorkOrder.completed_at 
                      ? format(new Date(selectedWorkOrder.completed_at), "MMM d, yyyy")
                      : "N/A"
                    }
                  </p>
                </div>
              </div>

              {loadingLinked ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <Tabs defaultValue="routing" className="flex-1">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="routing" className="gap-1">
                      <GitBranch className="w-4 h-4" />
                      Routing ({linkedData?.routing.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="handoffs" className="gap-1">
                      <Repeat className="w-4 h-4" />
                      Handoffs ({linkedData?.handoffs.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="gap-1">
                      <Lightbulb className="w-4 h-4" />
                      Updates ({linkedData?.performanceUpdates.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="downtime" className="gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Downtime ({linkedData?.downtimeEvents.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-1">
                      <History className="w-4 h-4" />
                      History
                    </TabsTrigger>
                  </TabsList>

                  <ScrollArea className="h-[350px] mt-4">
                    <TabsContent value="routing" className="mt-0">
                      {linkedData?.routing && linkedData.routing.length > 0 ? (
                        <div className="space-y-2">
                          {linkedData.routing.map((step) => (
                            <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                                {step.step_order}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{step.work_center} - Op {step.operation_number}</p>
                                <p className="text-sm text-muted-foreground">
                                  {step.station_name || "No station"} • {step.operator_name || "No operator"}
                                </p>
                              </div>
                              <Badge variant="outline" className={getStatusColor(step.status)}>
                                {step.status}
                              </Badge>
                              {step.actual_duration_minutes && (
                                <span className="text-sm text-muted-foreground">
                                  {step.actual_duration_minutes} min
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No routing steps found
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="handoffs" className="mt-0">
                      {linkedData?.handoffs && linkedData.handoffs.length > 0 ? (
                        <div className="space-y-2">
                          {linkedData.handoffs.map((handoff) => (
                            <div key={handoff.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{handoff.date} - {handoff.shift}</span>
                                <Badge variant="outline">{handoff.primary_state}</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <p>{handoff.outgoing_operator_name} → {handoff.incoming_operator_name}</p>
                                <p className="mt-1">{handoff.handoff_summary}</p>
                                <p className="mt-1">Parts: {handoff.parts_completed_this_shift}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No handoffs found
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="performance" className="mt-0">
                      {linkedData?.performanceUpdates && linkedData.performanceUpdates.length > 0 ? (
                        <div className="space-y-2">
                          {linkedData.performanceUpdates.map((update) => (
                            <div key={update.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{update.title}</span>
                                <div className="flex gap-2">
                                  <Badge variant="outline">{update.update_type}</Badge>
                                  <Badge variant="outline" className={getStatusColor(update.status)}>
                                    {update.status}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">{update.description}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                By {update.user_name} on {format(new Date(update.created_at), "MMM d, yyyy")}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No performance updates found
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="downtime" className="mt-0">
                      {linkedData?.downtimeEvents && linkedData.downtimeEvents.length > 0 ? (
                        <div className="space-y-2">
                          {linkedData.downtimeEvents.map((event) => (
                            <div key={event.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{event.downtime_type}</span>
                                {event.duration_minutes && (
                                  <Badge variant="destructive">{event.duration_minutes} min</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(event.started_at), "MMM d, yyyy h:mm a")}
                                {event.ended_at && ` - ${format(new Date(event.ended_at), "h:mm a")}`}
                              </p>
                              {event.reason_code && (
                                <p className="text-sm mt-1">Reason: {event.reason_code}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No downtime events recorded
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                      {linkedData?.history && linkedData.history.length > 0 ? (
                        <div className="space-y-2">
                          {linkedData.history.map((entry) => (
                            <div key={entry.id} className="flex items-start gap-3 p-2">
                              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                              <div className="flex-1">
                                <p className="text-sm">{entry.action}</p>
                                <p className="text-xs text-muted-foreground">
                                  {entry.user_name} • {format(new Date(entry.created_at), "MMM d, yyyy h:mm a")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No history entries
                        </div>
                      )}
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
