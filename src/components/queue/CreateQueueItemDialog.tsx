import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { CalendarIcon, Loader2, Wrench, Factory, Circle, CheckCircle, AlertCircle } from "lucide-react";
import { workCenterIcons, workCenterColors } from "@/lib/workCenterIcons";
import { WorkCenterType, WORK_CENTER_CATEGORIES } from "@/types/handoff";

interface CreateQueueItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: CreateQueueItemInput) => Promise<{ error: string | null }>;
  preselectedStationId?: string;
  onSuccess?: () => void; // New: optional callback
}

const ALL_TYPE_OPTIONS: { value: QueueItemType; label: string; description: string }[] = [
  { value: "quote", label: "Quote", description: "Quote for estimation and customer approval" },
  { value: "work_order", label: "Work Order", description: "Manufacturing work order queue item" },
  { value: "station_task", label: "Station Task", description: "Task assigned to a specific station" },
  { value: "team_task", label: "Team Task", description: "General task for team members" },
  { value: "support_ticket", label: "Support Ticket", description: "Support or issue ticket" },
];

const priorityOptions: { value: QueuePriority; label: string; color: string; icon: string }[] = [
  { value: "low", label: "🟢 Low", color: "text-emerald-500" },
  { value: "normal", label: "🟡 Normal", color: "text-amber-500" },
  { value: "high", label: "🟠 High", color: "text-orange-500" },
  { value: "urgent", label: "🔴 Urgent", color: "text-red-500" },
  { value: "critical", label: "🚨 Critical", color: "text-red-600 font-bold" },
];

export function CreateQueueItemDialog({
  open,
  onOpenChange,
  onCreate,
  preselectedStationId,
  onSuccess,
}: CreateQueueItemDialogProps) {
  const { toast } = useToast();
  const { currentTeam } = useCurrentTeam();
  const { organization } = useUserOrganization();
  const { isQuoteSystemEnabled } = useQuoteSystem();
  const { stations, loading: stationsLoading } = useStations(currentTeam?.id, organization?.id);

  // Form state with proper defaults
  const defaultFormData = useMemo(
    () => ({
      item_type: "work_order" as QueueItemType,
      title: "",
      description: "",
      priority: "normal" as QueuePriority,
      station_id: preselectedStationId || undefined,
      work_order: "",
      part_number: "",
      operation_number: "",
      quantity: undefined,
      setup_time_minutes: undefined,
      first_article_minutes: undefined,
      cycle_time_minutes: undefined,
    }),
    [preselectedStationId],
  );

  const [formData, setFormData] = useState<CreateQueueItemInput>(defaultFormData);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData(defaultFormData);
      setDueDate(undefined);
      setValidationErrors({});
    }
  }, [open, defaultFormData]);

  // Update station_id when preselectedStationId changes
  useEffect(() => {
    if (preselectedStationId && open) {
      setFormData((prev) => ({
        ...prev,
        station_id: preselectedStationId,
        item_type: "work_order" as QueueItemType,
      }));
    }
  }, [preselectedStationId, open]);

  // Memoized stations grouping and type options
  const typeOptions = useMemo(
    () => (isQuoteSystemEnabled ? ALL_TYPE_OPTIONS : ALL_TYPE_OPTIONS.filter((o) => o.value !== "quote")),
    [isQuoteSystemEnabled],
  );

  const stationsByCategory = useMemo(
    () =>
      stations.reduce(
        (acc, station) => {
          const type = station.work_center_type as WorkCenterType;
          if (!acc[type]) acc[type] = [];
          acc[type].push(station);
          return acc;
        },
        {} as Record<WorkCenterType, Station[]>,
      ),
    [stations],
  );

  const selectedStation = useMemo(
    () => (formData.station_id ? stations.find((s) => s.id === formData.station_id) : null),
    [formData.station_id, stations],
  );

  // Enhanced time estimation
  const totalEstMinutes = useMemo(() => {
    const setup = formData.setup_time_minutes || 0;
    const fai = formData.first_article_minutes || 0;
    const cycle = formData.cycle_time_minutes || 0;
    const qty = formData.quantity || 1;
    return computeEstimatedDuration(setup, fai, cycle, qty);
  }, [formData.setup_time_minutes, formData.first_article_minutes, formData.cycle_time_minutes, formData.quantity]);

  // Validation
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      errors.title = "Title is required";
    }

    if (formData.item_type === "work_order" && !formData.station_id) {
      errors.station = "Work orders require station assignment";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.title, formData.item_type, formData.station_id]);

  const updateFormField = useCallback((field: keyof CreateQueueItemInput, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific validation error
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        toast({
          title: "Validation Error",
          description: "Please fix the errors above",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      try {
        // Prepare final data
        const submitData: CreateQueueItemInput = {
          ...formData,
          due_date: dueDate?.toISOString(),
          // Ensure numeric fields are properly typed
          quantity: formData.quantity ? Number(formData.quantity) : undefined,
          setup_time_minutes: formData.setup_time_minutes ? Number(formData.setup_time_minutes) : undefined,
          first_article_minutes: formData.first_article_minutes ? Number(formData.first_article_minutes) : undefined,
          cycle_time_minutes: formData.cycle_time_minutes ? Number(formData.cycle_time_minutes) : undefined,
        };

        const { error } = await onCreate(submitData);

        if (error) {
          toast({ title: "Error", description: error, variant: "destructive" });
        } else {
          const typeLabel = typeOptions.find((t) => t.value === formData.item_type)?.label || "Item";
          toast({
            title: "Success",
            description: `${typeLabel} created successfully!`,
            duration: 3000,
          });
          onOpenChange(false);
          onSuccess?.();
        }
      } catch (error) {
        console.error("Create queue item error:", error);
        toast({ title: "Error", description: "Failed to create item", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [formData, dueDate, onCreate, validateForm, typeOptions, onOpenChange, onSuccess, toast],
  );

  const requiresStation = formData.item_type === "work_order" || formData.item_type === "station_task";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <Factory className="w-6 h-6 text-primary" />
            Create {typeOptions.find((t) => t.value === formData.item_type)?.label || "Queue Item"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {typeOptions.find((t) => t.value === formData.item_type)?.description || "Add a new item to the queue"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
          {/* Type and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.item_type}
                onValueChange={(value) => updateFormField("item_type", value as QueueItemType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
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
                onValueChange={(value) => updateFormField("priority", value as QueuePriority)}
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

          {/* Enhanced Station Selection */}
          {(requiresStation || formData.item_type === "quote") && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Wrench className="w-4 h-4" />
                Assign to Machine/Station
                {requiresStation && <span className="text-destructive">*</span>}
                {formData.item_type === "quote" && (
                  <span className="text-xs text-muted-foreground ml-1">(optional)</span>
                )}
              </Label>
              {validationErrors.station && (
                <p className="text-xs text-destructive mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.station}
                </p>
              )}
              <Select
                value={formData.station_id || "none"}
                onValueChange={(value) => updateFormField("station_id", value === "none" ? undefined : value)}
              >
                <SelectTrigger
                  className={cn(validationErrors.station && "ring-2 ring-destructive/20 border-destructive/30")}
                >
                  <SelectValue placeholder="Select a machine..." />
                </SelectTrigger>
                <SelectContent className="max-h-64 w-[var(--radix-select-trigger-width)]">
                  {!requiresStation && (
                    <SelectItem value="none">
                      <span className="text-muted-foreground">No station assigned</span>
                    </SelectItem>
                  )}
                  {stationsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Loading stations...</span>
                    </div>
                  ) : stations.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">No stations configured</div>
                  ) : (
                    Object.entries(stationsByCategory).map(([type, typeStations]) => {
                      const Icon = workCenterIcons[type as WorkCenterType] || Circle;
                      const colorClass = workCenterColors[type as WorkCenterType];
                      return (
                        <div key={type} className="border-t">
                          <div className="px-4 py-2 text-xs font-semibold bg-muted/50 flex items-center gap-2 sticky top-0 z-10">
                            <Icon className={cn("w-3 h-3 flex-shrink-0", colorClass)} />
                            {type} ({typeStations.length})
                          </div>
                          {typeStations.map((station) => (
                            <SelectItem key={station.id} value={station.id} className="px-4">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">
                                  {station.station_id}
                                </span>
                                <span>{station.name}</span>
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 px-3 py-1 bg-muted/50 rounded-md">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Assigned: {selectedStation.station_id} - {selectedStation.name}
                </div>
              )}
            </div>
          )}

          {/* Title with validation */}
          <div className="space-y-2">
            <Label>
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              value={formData.title || ""}
              onChange={(e) => updateFormField("title", e.target.value)}
              placeholder="Enter a descriptive title..."
              className={cn(validationErrors.title && "ring-2 ring-destructive/20 border-destructive/30")}
              disabled={loading}
            />
            {validationErrors.title && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationErrors.title}
              </p>
            )}
          </div>

          {/* Work Order/Quote Specific Fields */}
          {(formData.item_type === "work_order" || formData.item_type === "quote") && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gradient-to-br from-muted/50 to-background border rounded-xl">
              <div className="space-y-1">
                <Label className="text-xs font-medium">{formData.item_type === "quote" ? "Quote #" : "WO #"}</Label>
                <Input
                  value={formData.work_order || ""}
                  onChange={(e) => updateFormField("work_order", e.target.value)}
                  placeholder={formData.item_type === "quote" ? "Q-2026-001" : "WO-12345"}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Part #</Label>
                <Input
                  value={formData.part_number || ""}
                  onChange={(e) => updateFormField("part_number", e.target.value)}
                  placeholder="PN-12345"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Op #</Label>
                <Input
                  value={formData.operation_number || ""}
                  onChange={(e) => updateFormField("operation_number", e.target.value)}
                  placeholder="OP-10"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Qty</Label>
                <Input
                  type="number"
                  value={formData.quantity || ""}
                  onChange={(e) => updateFormField("quantity", parseInt(e.target.value) || undefined)}
                  placeholder="100"
                  min="1"
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label>Notes / Instructions</Label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) => updateFormData("description", e.target.value)}
              placeholder="Setup instructions, special requirements, customer notes..."
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Scheduling & Time Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Due Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left h-11", !dueDate && "text-muted-foreground")}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "No due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">Machine Time Estimate</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Setup (min)</Label>
                  <Input
                    type="number"
                    value={formData.setup_time_minutes || ""}
                    onChange={(e) => updateFormField("setup_time_minutes", parseInt(e.target.value) || undefined)}
                    placeholder="30"
                    min="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">First Article (min)</Label>
                  <Input
                    type="number"
                    value={formData.first_article_minutes || ""}
                    onChange={(e) => updateFormField("first_article_minutes", parseInt(e.target.value) || undefined)}
                    placeholder="15"
                    min="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Cycle Time (min)</Label>
                  <Input
                    type="number"
                    value={formData.cycle_time_minutes || ""}
                    onChange={(e) => updateFormField("cycle_time_minutes", parseFloat(e.target.value) || undefined)}
                    placeholder="2.5"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              {/* Enhanced Total Time Preview */}
              {totalEstMinutes > 0 && (
                <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/20 border rounded-xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total Estimated Time</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{Math.round(totalEstMinutes)} min</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.floor(totalEstMinutes / 60)}h {totalEstMinutes % 60}m
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        <DialogFooter className="px-6 py-4 border-t bg-background/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="px-4"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !validateForm()} className="gap-2 px-6 font-medium">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Create {typeOptions.find((t) => t.value === formData.item_type)?.label}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
