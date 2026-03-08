import { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueue, QueuePriority, RoutingStepInput } from "@/hooks/useQueue";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package, Wrench, Hash, Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { PartSpecsSection, PartSpecsData } from "./PartSpecsSection";
import { RoutingSection } from "./RoutingSection";
import { cn } from "@/lib/utils";

interface Station {
  id: string;
  name: string;
  station_id: string;
  work_center_type: string;
}

interface CreateWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedStationId?: string;
  onSuccess?: () => void;
}

export function CreateWorkOrderDialog({
  open,
  onOpenChange,
  preSelectedStationId,
  onSuccess,
}: CreateWorkOrderDialogProps) {
  const { currentTeam } = useCurrentTeam();
  const { createItem } = useQueue();
  const [loading, setLoading] = useState(false);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stations, setStations] = useState<Station[]>([]);
  const [routingSteps, setRoutingSteps] = useState<RoutingStepInput[]>([]);

  const defaultFormData = useMemo(
    () => ({
      work_order: "",
      part_number: "",
      operation_number: "",
      title: "",
      description: "",
      quantity: "",
      station_id: preSelectedStationId || "",
      priority: "normal" as QueuePriority,
      due_date: "",
      setup_time_minutes: "",
      first_article_minutes: "",
      cycle_time_minutes: "",
    }),
    [preSelectedStationId],
  );

  const [formData, setFormData] = useState(defaultFormData);
  const [partSpecs, setPartSpecs] = useState<PartSpecsData>({
    material_type: "",
    part_length_inches: "",
    part_width_inches: "",
    part_height_inches: "",
    part_weight_lbs: "",
    part_shape: "",
    part_catalog_id: "",
    required_tolerance: "",
    surface_finish: "",
  });

  // Reset form on open
  useEffect(() => {
    if (open) {
      setFormData(defaultFormData);
      setRoutingSteps([]);
      setPartSpecs({
        material_type: "",
        part_length_inches: "",
        part_width_inches: "",
        part_height_inches: "",
        part_weight_lbs: "",
        part_shape: "",
        part_catalog_id: "",
        required_tolerance: "",
        surface_finish: "",
      });
    }
  }, [open, defaultFormData]);

  // Fetch stations
  useEffect(() => {
    let cancelled = false;

    const fetchStations = async () => {
      if (!open) return;

      setStationsLoading(true);
      try {
        let query = supabase
          .from("stations")
          .select("id, name, station_id, work_center_type")
          .eq("is_active", true)
          .order("work_center_type")
          .order("station_id");

        if (currentTeam?.id) {
          query = query.eq("team_id", currentTeam.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (!cancelled) {
          setStations(data || []);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error("Failed to load stations");
        }
      } finally {
        if (!cancelled) {
          setStationsLoading(false);
        }
      }
    };

    fetchStations();
    return () => {
      cancelled = true;
    };
  }, [open, currentTeam?.id]);

  // Group stations by work center type
  const stationsByType = useMemo(() => {
    return stations.reduce(
      (acc, station) => {
        if (!acc[station.work_center_type]) {
          acc[station.work_center_type] = [];
        }
        acc[station.work_center_type].push(station);
        return acc;
      },
      {} as Record<string, Station[]>,
    );
  }, [stations]);

  const hasRouting = routingSteps.length > 0;

  // Validation
  const isValid = formData.work_order.trim() !== "";
  const totalEstMinutes = useMemo(() => {
    const setup = parseInt(formData.setup_time_minutes) || 0;
    const fai = parseInt(formData.first_article_minutes) || 0;
    const cycle = parseInt(formData.cycle_time_minutes) || 0;
    const qty = parseInt(formData.quantity) || 0;
    return setup + fai + cycle * qty;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isValid) {
        toast.error("Work order number is required");
        return;
      }

      // Validate routing steps have operation names
      if (hasRouting) {
        const invalidSteps = routingSteps.filter((s) => !s.operation_name.trim());
        if (invalidSteps.length > 0) {
          toast.error("All routing steps must have an operation name");
          return;
        }
      }

      setLoading(true);
      try {
        await createItem({
          item_type: "work_order",
          title: formData.title || `WO: ${formData.work_order}`,
          description: formData.description || undefined,
          work_order: formData.work_order,
          part_number: formData.part_number || undefined,
          operation_number: formData.operation_number || undefined,
          quantity: formData.quantity ? parseInt(formData.quantity) : undefined,
          station_id: hasRouting ? undefined : formData.station_id || undefined,
          priority: formData.priority,
          due_date: formData.due_date || undefined,
          setup_time_minutes: formData.setup_time_minutes ? parseInt(formData.setup_time_minutes) : undefined,
          first_article_minutes: formData.first_article_minutes ? parseInt(formData.first_article_minutes) : undefined,
          cycle_time_minutes: formData.cycle_time_minutes ? parseInt(formData.cycle_time_minutes) : undefined,
          material_type: partSpecs.material_type || undefined,
          part_length_inches: partSpecs.part_length_inches ? parseFloat(partSpecs.part_length_inches) : undefined,
          part_width_inches: partSpecs.part_width_inches ? parseFloat(partSpecs.part_width_inches) : undefined,
          part_height_inches: partSpecs.part_height_inches ? parseFloat(partSpecs.part_height_inches) : undefined,
          part_weight_lbs: partSpecs.part_weight_lbs ? parseFloat(partSpecs.part_weight_lbs) : undefined,
          part_shape: partSpecs.part_shape || undefined,
          part_catalog_id: partSpecs.part_catalog_id || undefined,
          required_tolerance: partSpecs.required_tolerance || undefined,
          surface_finish: partSpecs.surface_finish || undefined,
          routing_steps: hasRouting ? routingSteps : undefined,
        });

        toast.success("Work order created successfully!");
        onOpenChange(false);
        onSuccess?.();
      } catch (error) {
        console.error("Create work order error:", error);
        toast.error("Failed to create work order");
      } finally {
        setLoading(false);
      }
    },
    [formData, partSpecs, routingSteps, hasRouting, createItem, isValid, onOpenChange, onSuccess],
  );

  const updateFormField = useCallback((field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Add Work Order
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)] pr-1">
          {/* Work Order Number */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Work Order # <span className="text-destructive">*</span>
            </Label>
            <Input
              value={formData.work_order}
              onChange={(e) => updateFormField("work_order", e.target.value)}
              placeholder="Enter your work order number"
              className={!isValid ? "ring-2 ring-destructive/20" : ""}
              required
            />
          </div>

          {/* Routing Section — replaces station selector when active */}
          <RoutingSection
            steps={routingSteps}
            onChange={setRoutingSteps}
            stations={stations}
          />

          {/* Station Selection — only shown when no routing is defined */}
          {!hasRouting && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Assign to Station
              </Label>
              <Select
                value={formData.station_id || "none"}
                onValueChange={(value) => updateFormField("station_id", value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a station..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {stationsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading stations...
                    </div>
                  ) : stations.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      <AlertTriangle className="w-4 h-4 mx-auto mb-1" />
                      No active stations found
                    </div>
                  ) : (
                    Object.entries(stationsByType).map(([type, typeStations]) => (
                      <div key={type} className="py-1">
                        <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b sticky top-0 z-10">
                          {type}
                        </div>
                        {typeStations.map((station) => (
                          <SelectItem key={station.id} value={station.id} className="px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded-sm">
                                {station.station_id}
                              </span>
                              <span className="text-muted-foreground text-xs">•</span>
                              <span className="truncate">{station.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Part Number & Operation */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Part Number</Label>
              <Input
                value={formData.part_number}
                onChange={(e) => updateFormField("part_number", e.target.value)}
                placeholder="e.g. PN-12345"
              />
            </div>
            <div className="space-y-2">
              <Label>Operation #</Label>
              <Input
                value={formData.operation_number}
                onChange={(e) => updateFormField("operation_number", e.target.value)}
                placeholder="e.g. OP-10"
              />
            </div>
          </div>

          {/* Quantity & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => updateFormField("quantity", e.target.value)}
                placeholder="100"
                min="1"
              />
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
                  <SelectItem value="low">🟢 Low</SelectItem>
                  <SelectItem value="normal">🟡 Normal</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  <SelectItem value="critical">🚨 Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Due Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.due_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date
                    ? format(new Date(formData.due_date + "T00:00:00"), "PPP")
                    : "Pick a due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.due_date ? new Date(formData.due_date + "T00:00:00") : undefined}
                  onSelect={(date) =>
                    updateFormField("due_date", date ? format(date, "yyyy-MM-dd") : "")
                  }
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Machine Time Breakdown */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Machine Time Breakdown
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Setup</Label>
                <Input
                  type="number"
                  value={formData.setup_time_minutes}
                  onChange={(e) => updateFormField("setup_time_minutes", e.target.value)}
                  placeholder="30"
                  min="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">First Article</Label>
                <Input
                  type="number"
                  value={formData.first_article_minutes}
                  onChange={(e) => updateFormField("first_article_minutes", e.target.value)}
                  placeholder="15"
                  min="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cycle Time</Label>
                <Input
                  type="number"
                  value={formData.cycle_time_minutes}
                  onChange={(e) => updateFormField("cycle_time_minutes", e.target.value)}
                  placeholder="2"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
            {totalEstMinutes > 0 && (
              <div className="p-3 bg-gradient-to-r from-primary/5 to-secondary/50 border rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Total Estimated Time:</span>
                  <div className="text-right space-y-0.5">
                    <div className="text-lg font-bold text-primary">{Math.round(totalEstMinutes)} min</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(totalEstMinutes / 60)}h {totalEstMinutes % 60}m
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Part Specifications */}
          <PartSpecsSection data={partSpecs} onChange={setPartSpecs} />

          {/* Title & Description */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Title (Optional)</Label>
              <Input
                value={formData.title}
                onChange={(e) => updateFormField("title", e.target.value)}
                placeholder="Short description (auto-generated if blank)"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => updateFormField("description", e.target.value)}
                placeholder="Additional instructions, special requirements..."
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !isValid}
              className={cn("gap-2", !isValid && "opacity-50 cursor-not-allowed")}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Create Work Order
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
