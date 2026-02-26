import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueue, QueuePriority } from "@/hooks/useQueue";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package, Wrench, Hash, Calendar, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
}

export function CreateWorkOrderDialog({ 
  open, 
  onOpenChange,
  preSelectedStationId 
}: CreateWorkOrderDialogProps) {
  const { currentTeam } = useCurrentTeam();
  const { createItem } = useQueue();
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);

  const [formData, setFormData] = useState({
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
  });

  // Fetch stations
  useEffect(() => {
    const fetchStations = async () => {
      setStationsLoading(true);
      let query = supabase
        .from("stations")
        .select("id, name, station_id, work_center_type")
        .eq("is_active", true)
        .order("work_center_type")
        .order("station_id");

      if (currentTeam?.id) {
        query = query.eq("team_id", currentTeam.id);
      }

      const { data } = await query;
      setStations(data || []);
      setStationsLoading(false);
    };

    if (open) {
      fetchStations();
    }
  }, [open, currentTeam?.id]);

  // Set pre-selected station
  useEffect(() => {
    if (preSelectedStationId) {
      setFormData(prev => ({ ...prev, station_id: preSelectedStationId }));
    }
  }, [preSelectedStationId]);

  // Group stations by work center type
  const stationsByType = stations.reduce((acc, station) => {
    if (!acc[station.work_center_type]) {
      acc[station.work_center_type] = [];
    }
    acc[station.work_center_type].push(station);
    return acc;
  }, {} as Record<string, Station[]>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.work_order.trim()) {
      toast.error("Work order number is required");
      return;
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
        station_id: formData.station_id || undefined,
        priority: formData.priority,
        due_date: formData.due_date || undefined,
        setup_time_minutes: formData.setup_time_minutes ? parseInt(formData.setup_time_minutes) : undefined,
        first_article_minutes: formData.first_article_minutes ? parseInt(formData.first_article_minutes) : undefined,
        cycle_time_minutes: formData.cycle_time_minutes ? parseInt(formData.cycle_time_minutes) : undefined,
      });

      toast.success("Work order created successfully");
      onOpenChange(false);
      
      // Reset form
      setFormData({
        work_order: "",
        part_number: "",
        operation_number: "",
        title: "",
        description: "",
        quantity: "",
        station_id: preSelectedStationId || "",
        priority: "normal",
        due_date: "",
        setup_time_minutes: "",
        first_article_minutes: "",
        cycle_time_minutes: "",
      });
    } catch (error) {
      toast.error("Failed to create work order");
    } finally {
      setLoading(false);
    }
  };

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
              Work Order # <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.work_order}
              onChange={(e) => setFormData({ ...formData, work_order: e.target.value })}
              placeholder="Enter your work order number"
              required
            />
          </div>

          {/* Machine/Station Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Assign to Station (Optional)
            </Label>
            <Select
              value={formData.station_id || "none"}
              onValueChange={(value) => setFormData({ ...formData, station_id: value === "none" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a station..." />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {stationsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : stations.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    <AlertTriangle className="w-4 h-4 mx-auto mb-1" />
                    No stations available
                  </div>
                ) : (
                  Object.entries(stationsByType).map(([type, typeStations]) => (
                    <div key={type}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                        {type}
                      </div>
                      {typeStations.map((station) => (
                        <SelectItem key={station.id} value={station.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">{station.station_id}</span>
                            <span className="text-muted-foreground">-</span>
                            <span>{station.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Part Number & Operation */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Part Number</Label>
              <Input
                value={formData.part_number}
                onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                placeholder="Enter part number"
              />
            </div>
            <div className="space-y-2">
              <Label>Operation #</Label>
              <Input
                value={formData.operation_number}
                onChange={(e) => setFormData({ ...formData, operation_number: e.target.value })}
                placeholder="Enter operation"
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
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Qty"
                min="1"
              />
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
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Due Date
            </Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              min={format(new Date(), "yyyy-MM-dd")}
            />
          </div>

          {/* Machine Time Breakdown */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Machine Time Breakdown
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Setup (min)</Label>
                <Input
                  type="number"
                  value={formData.setup_time_minutes}
                  onChange={(e) => setFormData({ ...formData, setup_time_minutes: e.target.value })}
                  placeholder="Min"
                  min="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">First Article (min)</Label>
                <Input
                  type="number"
                  value={formData.first_article_minutes}
                  onChange={(e) => setFormData({ ...formData, first_article_minutes: e.target.value })}
                  placeholder="Min"
                  min="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cycle / Part (min)</Label>
                <Input
                  type="number"
                  value={formData.cycle_time_minutes}
                  onChange={(e) => setFormData({ ...formData, cycle_time_minutes: e.target.value })}
                  placeholder="Min"
                  min="0"
                />
              </div>
            </div>
            {/* Total Estimate Preview */}
            {(formData.setup_time_minutes || formData.first_article_minutes || formData.cycle_time_minutes) && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2 mt-1">
                {(() => {
                  const setup = parseInt(formData.setup_time_minutes) || 0;
                  const fai = parseInt(formData.first_article_minutes) || 0;
                  const cycle = parseInt(formData.cycle_time_minutes) || 0;
                  const qty = parseInt(formData.quantity) || 1;
                  const total = setup + fai + (cycle * qty);
                  const hours = (total / 60).toFixed(1);
                  return (
                    <span>
                      <strong>Total Est:</strong> {setup} setup + {fai} FAI + ({cycle} × {qty} pcs) = <strong>{total} min</strong> (~{hours} hrs)
                    </span>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Notes / Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional notes about this work order..."
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Work Order"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
