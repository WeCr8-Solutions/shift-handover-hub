import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { QueueItem, RoutingStepInput } from "@/hooks/useQueue";
import { Station } from "@/hooks/useStations";
import { useOrgContext } from "@/contexts/OrgContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useToast } from "@/hooks/use-toast";
import { useDimensions } from "@/hooks/useDimensions";
import { supabase } from "@/integrations/supabase/client";
import { RoutingSection } from "@/components/queue/RoutingSection";
import { DimensionCheckForm } from "@/components/dimensions/DimensionCheckForm";
import { AddDimensionForm } from "@/components/dimensions/AddDimensionForm";
import { RequestDimensionCheckButton } from "@/components/dimensions/RequestDimensionCheckButton";
import { DimensionRequestsPanel } from "@/components/dimensions/DimensionRequestsPanel";
import { useDimensionRequests } from "@/hooks/useDimensionRequests";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  GitBranch, Circle, CircleDot, CheckCircle, Timer, Truck,
  Wrench, User, Loader2, Save, Ruler, Plus, ChevronDown, ChevronUp,
} from "lucide-react";

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

interface QueueItemRoutingTabProps {
  item: QueueItem;
  routingSteps: RoutingStepRow[];
  routingLoading: boolean;
  stations: Station[];
  onReloadRouting: () => void;
  onOpenRouting?: (item: { id: string; work_order?: string | null; part_number?: string | null }) => void;
}

export function QueueItemRoutingTab({
  item,
  routingSteps,
  routingLoading,
  stations,
  onReloadRouting,
  onOpenRouting,
}: QueueItemRoutingTabProps) {
  const { organization } = useOrgContext();
  const { hasAdminAccess, hasOrgSupervisorAccess } = useAdminAccess();
  const { toast } = useToast();
  const [addingRouting, setAddingRouting] = useState(false);
  const [newRoutingSteps, setNewRoutingSteps] = useState<RoutingStepInput[]>([]);
  const [savingRouting, setSavingRouting] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [addingDimForStep, setAddingDimForStep] = useState<string | null>(null);

  const dimensions = useDimensions();
  const dimRequests = useDimensionRequests();
  const handleSaveRouting = async () => {
    if (!organization?.id) return;
    setSavingRouting(true);
    try {
      const routingRows = newRoutingSteps.map((step) => ({
        queue_item_id: item.id,
        organization_id: organization.id,
        step_number: step.step_number,
        operation_name: step.operation_name,
        operation_type: step.operation_type,
        station_id: step.station_id || null,
        setup_time_minutes: step.setup_time_minutes || null,
        first_article_minutes: step.first_article_minutes || null,
        cycle_time_minutes: step.cycle_time_minutes || null,
        notes: step.notes || null,
        outside_vendor: step.outside_vendor || null,
        po_number: step.po_number || null,
        expected_return_date: step.expected_return_date || null,
        status: "pending",
      }));

      const { error: routingError } = await supabase.from("work_order_routing").insert(routingRows);
      if (routingError) throw routingError;

      const firstStationId = newRoutingSteps[0]?.station_id;
      if (firstStationId) {
        await supabase.from("queue_items").update({ station_id: firstStationId }).eq("id", item.id);
      }

      toast({ title: "Routing Saved", description: `${newRoutingSteps.length} routing step(s) added to this work order.` });
      setAddingRouting(false);
      setNewRoutingSteps([]);
      onReloadRouting();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save routing", variant: "destructive" });
    } finally {
      setSavingRouting(false);
    }
  };

  if (routingLoading) {
    return (
      <div className="space-y-3 py-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (routingSteps.length === 0) {
    return (
      <div className="py-6 space-y-4">
        <div className="text-center space-y-3">
          <GitBranch className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">No routing steps configured yet.</p>
        </div>

        {!addingRouting ? (
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { setAddingRouting(true); setNewRoutingSteps([]); }} className="gap-2">
              <GitBranch className="w-4 h-4" />
              Add Routing
            </Button>
            {onOpenRouting && hasAdminAccess && (
              <Button variant="outline" size="sm" onClick={() => onOpenRouting(item)} className="gap-2">
                <GitBranch className="w-4 h-4" />
                Advanced Editor
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <RoutingSection
              steps={newRoutingSteps}
              onChange={setNewRoutingSteps}
              stations={stations.map(s => ({ id: s.id, name: s.name, station_id: s.station_id, work_center_type: s.work_center_type || '' }))}
            />
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => { setAddingRouting(false); setNewRoutingSteps([]); }}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={savingRouting || newRoutingSteps.length === 0 || newRoutingSteps.some(s => !s.operation_name.trim())}
                className="gap-2"
                onClick={handleSaveRouting}
              >
                {savingRouting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Routing
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-1">
        {routingSteps.map((step, idx) => {
          const isComplete = step.status === 'completed';
          const isActive = step.status === 'in_progress';
          const isPending = step.status === 'pending';
          const isOutside = step.operation_type === 'outside_processing';

          return (
            <div key={step.id} className="relative">
              {idx < routingSteps.length - 1 && (
                <div className={cn(
                  "absolute left-[15px] top-[32px] bottom-0 w-0.5",
                  isComplete ? "bg-green-400" : "bg-border"
                )} />
              )}
              <div className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-colors",
                isActive && "bg-primary/5 border border-primary/20",
                isOutside && !isActive && "bg-amber-500/5",
              )}>
                <div className="mt-0.5">
                  {isComplete ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : isActive ? (
                    <CircleDot className="w-5 h-5 text-primary animate-pulse" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/40" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("font-medium text-sm", isPending && "text-muted-foreground")}>
                      {step.step_number}. {step.operation_name}
                    </span>
                    {isOutside && (
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/30">
                        <Truck className="w-3 h-3 mr-1" />
                        Outside
                      </Badge>
                    )}
                    {isActive && (
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                        In Progress
                      </Badge>
                    )}
                  </div>

                  {step.station_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <Wrench className="w-3 h-3 inline mr-1" />
                      {step.station_code} - {step.station_name}
                    </p>
                  )}

                  {isOutside && step.outside_vendor && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                      Vendor: {step.outside_vendor}
                      {step.po_number && ` • PO: ${step.po_number}`}
                      {step.expected_return_date && ` • Return: ${format(new Date(step.expected_return_date), "MMM d, yyyy")}`}
                    </p>
                  )}

                  {isComplete && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-green-700 dark:text-green-400">
                      <User className="w-3 h-3" />
                      <span>
                        {step.completed_by_name || "System"} signed off
                        {step.completed_at && ` • ${format(new Date(step.completed_at), "MMM d, h:mm a")}`}
                      </span>
                    </div>
                  )}

                  {step.estimated_duration && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <Timer className="w-3 h-3 inline mr-1" />
                      Est. {step.estimated_duration} min
                    </p>
                  )}

                  {step.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{step.notes}</p>
                  )}

                  {/* Dimension toggle */}
                  <button
                    className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                    onClick={() => {
                      const isExpanding = expandedStep !== step.id;
                      setExpandedStep(isExpanding ? step.id : null);
                      if (isExpanding) {
                        dimensions.loadAll(step.id, item.id);
                      }
                    }}
                  >
                    <Ruler className="w-3 h-3" />
                    Dimensions
                    {expandedStep === step.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {/* Expanded dimension section */}
                  {expandedStep === step.id && (
                    <div className="mt-2 space-y-2">
                      {dimensions.loading ? (
                        <Skeleton className="h-16 w-full" />
                      ) : (
                        <>
                          <DimensionCheckForm
                            requirements={dimensions.requirements}
                            readings={dimensions.readings}
                            queueItemId={item.id}
                            routingStepId={step.id}
                            onRecordReading={dimensions.recordReading}
                            readOnly={isComplete}
                          />
                          {dimensions.requirements.length === 0 && !addingDimForStep && (
                            <p className="text-xs text-muted-foreground text-center py-2">No dimension checks required for this step.</p>
                          )}
                          {/* Supervisor: add dimension button */}
                          {(hasAdminAccess || hasOrgSupervisorAccess) && !addingDimForStep && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1 text-xs w-full"
                              onClick={() => setAddingDimForStep(step.id)}
                            >
                              <Plus className="w-3 h-3" /> Add Dimension Requirement
                            </Button>
                          )}
                          {addingDimForStep === step.id && (
                            <AddDimensionForm
                              routingStepId={step.id}
                              onAdd={dimensions.addRequirement}
                              onCancel={() => setAddingDimForStep(null)}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {onOpenRouting && hasAdminAccess && (
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenRouting(item)} className="gap-2">
            <GitBranch className="w-4 h-4" />
            Edit Routing
          </Button>
        </div>
      )}
    </ScrollArea>
  );
}
