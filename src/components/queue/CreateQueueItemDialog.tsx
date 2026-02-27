import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CreateQueueItemInput, QueueItemType, QueuePriority } from "@/hooks/useQueue";
import { computeEstimatedDuration } from "@/lib/machineTime";
import { useStations, Station } from "@/hooks/useStations";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { useQuoteSystem } from "@/hooks/useQuoteSystem";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, Wrench, Factory, Circle } from "lucide-react";
import { workCenterIcons, workCenterColors } from "@/lib/workCenterIcons";
import { WorkCenterType, WORK_CENTER_CATEGORIES } from "@/types/handoff";

interface CreateQueueItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: CreateQueueItemInput) => Promise<{ error: string | null }>;
  preselectedStationId?: string;
}

const ALL_TYPE_OPTIONS: { value: QueueItemType; label: string; description: string }[] = [
  { value: "quote", label: "Quote", description: "Quote for estimation and customer approval" },
  { value: "work_order", label: "Work Order", description: "Manufacturing work order queue item" },
  { value: "station_task", label: "Station Task", description: "Task assigned to a specific station" },
  { value: "team_task", label: "Team Task", description: "General task for team members" },
  { value: "support_ticket", label: "Support Ticket", description: "Support or issue ticket" },
];

const priorityOptions: { value: QueuePriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-muted-foreground" },
  { value: "normal", label: "Normal", color: "text-foreground" },
  { value: "high", label: "High", color: "text-amber-500" },
  { value: "urgent", label: "Urgent", color: "text-orange-500" },
  { value: "critical", label: "Critical", color: "text-red-500" },
];

export function CreateQueueItemDialog({ open, onOpenChange, onCreate, preselectedStationId }: CreateQueueItemDialogProps) {
  const { toast } = useToast();
  const { currentTeam } = useCurrentTeam();
  const { organization } = useUserOrganization();
  const { isQuoteSystemEnabled } = useQuoteSystem();
  const { stations, loading: stationsLoading } = useStations(currentTeam?.id, organization?.id);

  // Filter type options based on quote system setting
  const typeOptions = isQuoteSystemEnabled
    ? ALL_TYPE_OPTIONS
    : ALL_TYPE_OPTIONS.filter(o => o.value !== "quote");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateQueueItemInput>({
    item_type: "work_order",
    title: "",
    description: "",
    priority: "normal",
    station_id: preselectedStationId,
  });
  const [dueDate, setDueDate] = useState<Date | undefined>();

  // Update station_id when preselectedStationId changes
  useEffect(() => {
    if (preselectedStationId) {
      setFormData(prev => ({ ...prev, station_id: preselectedStationId, item_type: "work_order" }));
    }
  }, [preselectedStationId]);

  // Group stations by work center type for easier selection
  const stationsByCategory = stations.reduce((acc, station) => {
    const type = station.work_center_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(station);
    return acc;
  }, {} as Record<WorkCenterType, Station[]>);

  const selectedStation = formData.station_id ? stations.find(s => s.id === formData.station_id) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    // For work orders, require station assignment (quotes don't need one)
    if (formData.item_type === "work_order" && !formData.station_id) {
      toast({ title: "Error", description: "Please assign a machine/station for the work order", variant: "destructive" });
      return;
    }

    // Auto-set qty fields for quotes and work orders
    if ((formData.item_type === "quote" || formData.item_type === "work_order") && formData.quantity) {
      (formData as any).qty_original = formData.quantity;
    }

    setLoading(true);
    const { error } = await onCreate({
      ...formData,
      due_date: dueDate?.toISOString(),
    });
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      const typeLabel = formData.item_type === "work_order" ? "Work order" : formData.item_type === "quote" ? "Quote" : "Queue item";
      toast({ title: "Success", description: `${typeLabel} created` });
      onOpenChange(false);
      // Reset form
      setFormData({
        item_type: "work_order",
        title: "",
        description: "",
        priority: "normal",
        station_id: undefined,
      });
      setDueDate(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-primary" />
            Create {formData.item_type === "quote" ? "Quote" : formData.item_type === "work_order" ? "Work Order" : "Queue Item"}
          </DialogTitle>
          <DialogDescription>
            {formData.item_type === "quote" 
              ? "Create a quote for estimation routing and customer approval"
              : "Add a new item to the queue for live tracking and prioritization"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.item_type}
                onValueChange={(value) => setFormData({ ...formData, item_type: value as QueueItemType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as QueuePriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className={option.color}>{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Machine/Station Assignment - Required for Work Orders, optional for Quotes */}
          {(formData.item_type === "work_order" || formData.item_type === "station_task" || formData.item_type === "quote") && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Assign to Machine/Station {formData.item_type === "work_order" && <span className="text-red-500">*</span>}
                {formData.item_type === "quote" && <span className="text-xs text-muted-foreground">(optional)</span>}
              </Label>
              <Select
                value={formData.station_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, station_id: value === "none" ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a machine..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {(formData.item_type !== "work_order") && (
                    <SelectItem value="none">No station {formData.item_type === "quote" ? "(assign later)" : "(team-wide)"}</SelectItem>
                  )}
                  {stationsLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : stations.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      No stations configured. Add stations in Admin.
                    </div>
                  ) : (
                    Object.entries(stationsByCategory).map(([type, typeStations]) => {
                      const Icon = workCenterIcons[type as WorkCenterType] || Circle;
                      const colorClass = workCenterColors[type as WorkCenterType];
                      return (
                        <div key={type}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2 bg-muted/50">
                            <Icon className={cn("w-3 h-3", colorClass)} />
                            {type}
                          </div>
                          {typeStations.map((station) => (
                            <SelectItem key={station.id} value={station.id}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{station.station_id}</span>
                                <span className="text-muted-foreground">- {station.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              {selectedStation && (
                <p className="text-xs text-muted-foreground">
                  {selectedStation.work_center} • {selectedStation.work_center_type}
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter item title"
            />
          </div>

          {/* Quote / Work Order Specific Fields */}
          {(formData.item_type === "work_order" || formData.item_type === "quote") && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg border">
              <div className="space-y-2">
                <Label className="text-xs">{formData.item_type === "quote" ? "Quote #" : "Work Order #"}</Label>
                <Input
                  value={formData.work_order || ""}
                  onChange={(e) => setFormData({ ...formData, work_order: e.target.value })}
                  placeholder={formData.item_type === "quote" ? "Enter quote number" : "Enter work order number"}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Part Number</Label>
                <Input
                  value={formData.part_number || ""}
                  onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                  placeholder="Enter part number"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Operation #</Label>
                <Input
                  value={formData.operation_number || ""}
                  onChange={(e) => setFormData({ ...formData, operation_number: e.target.value })}
                  placeholder="OP-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity || ""}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || undefined })}
                  placeholder="100"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label>Description / Notes</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter setup instructions, special requirements, or notes..."
              rows={3}
            />
          </div>

          {/* Scheduling Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Machine Time Breakdown</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Setup (min)</Label>
                  <Input
                    type="number"
                    value={formData.setup_time_minutes || ""}
                    onChange={(e) => setFormData({ ...formData, setup_time_minutes: parseInt(e.target.value) || undefined })}
                    placeholder="Min"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">First Article (min)</Label>
                  <Input
                    type="number"
                    value={formData.first_article_minutes || ""}
                    onChange={(e) => setFormData({ ...formData, first_article_minutes: parseInt(e.target.value) || undefined })}
                    placeholder="Min"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Cycle / Part (min)</Label>
                  <Input
                    type="number"
                    value={formData.cycle_time_minutes || ""}
                    onChange={(e) => setFormData({ ...formData, cycle_time_minutes: parseInt(e.target.value) || undefined })}
                    placeholder="Min"
                  />
                </div>
              </div>
              {/* Total Estimate Preview */}
              {(formData.setup_time_minutes || formData.first_article_minutes || formData.cycle_time_minutes) && (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                  {(() => {
                    const setup = formData.setup_time_minutes || 0;
                    const fai = formData.first_article_minutes || 0;
                    const cycle = formData.cycle_time_minutes || 0;
                    const qty = formData.quantity || 1;
                    const total = computeEstimatedDuration(setup, fai, cycle, qty);
                    const hours = (total / 60).toFixed(1);
                    return <span><strong>Total Est:</strong> {setup} setup + {fai} FAI + ({cycle} × {qty} pcs) = <strong>{total} min</strong> (~{hours} hrs)</span>;
                  })()}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create {formData.item_type === "quote" ? "Quote" : formData.item_type === "work_order" ? "Work Order" : "Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
