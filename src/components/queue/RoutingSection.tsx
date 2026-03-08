import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { RoutingStepInput } from "@/hooks/useQueue";
import { Route, Plus, Trash2, GripVertical, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Station {
  id: string;
  name: string;
  station_id: string;
  work_center_type: string;
}

interface RoutingTemplate {
  id: string;
  name: string;
  description: string | null;
  part_number_pattern: string | null;
}

interface RoutingTemplateStep {
  step_number: number;
  operation_name: string;
  operation_type: string;
  work_center_type: string | null;
  setup_time_minutes: number | null;
  first_article_minutes: number | null;
  cycle_time_minutes: number | null;
  instructions: string | null;
}

const OPERATION_TYPES = [
  { value: "quote", label: "Quote" },
  { value: "engineering", label: "Engineering" },
  { value: "purchasing", label: "Purchasing" },
  { value: "receiving", label: "Receiving" },
  { value: "internal", label: "Internal" },
  { value: "outside_processing", label: "Outside Processing" },
  { value: "inspection", label: "Inspection" },
  { value: "shipping", label: "Shipping" },
];

interface RoutingSectionProps {
  steps: RoutingStepInput[];
  onChange: (steps: RoutingStepInput[]) => void;
  stations: Station[];
}

export function RoutingSection({ steps, onChange, stations }: RoutingSectionProps) {
  const { organization } = useUserOrganization();
  const [templates, setTemplates] = useState<RoutingTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [expanded, setExpanded] = useState(false);

  // Fetch routing templates
  useEffect(() => {
    if (!organization?.id) return;
    let cancelled = false;

    const fetchTemplates = async () => {
      setTemplatesLoading(true);
      const { data, error } = await supabase
        .from("routing_templates")
        .select("id, name, description, part_number_pattern")
        .eq("organization_id", organization.id)
        .order("name");

      if (!cancelled) {
        if (!error && data) setTemplates(data);
        setTemplatesLoading(false);
      }
    };
    fetchTemplates();
    return () => { cancelled = true; };
  }, [organization?.id]);

  // Load template steps when selected
  const handleTemplateSelect = useCallback(async (templateId: string) => {
    if (templateId === "none" || templateId === "custom") {
      setSelectedTemplateId(templateId);
      if (templateId === "custom") {
        onChange([{
          step_number: 1,
          operation_name: "",
          operation_type: "internal",
        }]);
        setExpanded(true);
      } else {
        onChange([]);
        setExpanded(false);
      }
      return;
    }

    setSelectedTemplateId(templateId);
    const { data: templateSteps, error } = await supabase
      .from("routing_template_steps")
      .select("step_number, operation_name, operation_type, work_center_type, setup_time_minutes, first_article_minutes, cycle_time_minutes, instructions")
      .eq("template_id", templateId)
      .order("step_number");

    if (error) {
      toast.error("Failed to load template steps");
      return;
    }

    if (templateSteps?.length) {
      // Map template steps to routing input, try to match stations by work_center_type
      const mappedSteps: RoutingStepInput[] = templateSteps.map((ts) => {
        const matchedStation = ts.work_center_type
          ? stations.find((s) => s.work_center_type === ts.work_center_type)
          : undefined;

        return {
          step_number: ts.step_number,
          operation_name: ts.operation_name,
          operation_type: ts.operation_type,
          station_id: matchedStation?.id,
          setup_time_minutes: ts.setup_time_minutes ?? undefined,
          first_article_minutes: ts.first_article_minutes ?? undefined,
          cycle_time_minutes: ts.cycle_time_minutes ?? undefined,
          notes: ts.instructions ?? undefined,
        };
      });
      onChange(mappedSteps);
      setExpanded(true);
    }
  }, [stations, onChange]);

  const stationsByType = useMemo(() => {
    return stations.reduce((acc, station) => {
      if (!acc[station.work_center_type]) acc[station.work_center_type] = [];
      acc[station.work_center_type].push(station);
      return acc;
    }, {} as Record<string, Station[]>);
  }, [stations]);

  const addStep = useCallback(() => {
    const nextNum = steps.length > 0 ? Math.max(...steps.map((s) => s.step_number)) + 1 : 1;
    onChange([...steps, { step_number: nextNum, operation_name: "", operation_type: "internal" }]);
  }, [steps, onChange]);

  const removeStep = useCallback((index: number) => {
    const newSteps = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_number: i + 1 }));
    onChange(newSteps);
  }, [steps, onChange]);

  const updateStep = useCallback((index: number, field: keyof RoutingStepInput, value: string | number | undefined) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    onChange(newSteps);
  }, [steps, onChange]);

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Route className="w-4 h-4" />
        Routing
      </Label>

      {/* Template selector */}
      <Select value={selectedTemplateId || "none"} onValueChange={handleTemplateSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Select routing..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No routing</SelectItem>
          <SelectItem value="custom">
            <span className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Create custom routing
            </span>
          </SelectItem>
          {templatesLoading ? (
            <div className="p-3">
              <Skeleton className="h-4 w-32" />
            </div>
          ) : templates.length > 0 ? (
            templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  {t.name}
                </span>
              </SelectItem>
            ))
          ) : null}
        </SelectContent>
      </Select>

      {/* Steps list */}
      {steps.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {steps.length} routing step{steps.length !== 1 ? "s" : ""}
          </button>

          {expanded && (
            <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
              {steps.map((step, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-md bg-background">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <GripVertical className="w-3.5 h-3.5" />
                      Step {step.step_number}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(index)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Operation Name</Label>
                      <Input
                        value={step.operation_name}
                        onChange={(e) => updateStep(index, "operation_name", e.target.value)}
                        placeholder="e.g. CNC Milling"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={step.operation_type}
                        onValueChange={(v) => updateStep(index, "operation_type", v)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATION_TYPES.map((op) => (
                            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Station</Label>
                    <Select
                      value={step.station_id || "none"}
                      onValueChange={(v) => updateStep(index, "station_id", v === "none" ? undefined : v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select station..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        <SelectItem value="none">— Unassigned —</SelectItem>
                        {Object.entries(stationsByType).map(([type, typeStations]) => (
                          <div key={type}>
                            <div className="px-3 py-1 text-xs font-semibold text-muted-foreground bg-muted/50">{type}</div>
                            {typeStations.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                <span className="font-mono text-xs">{s.station_id}</span> — {s.name}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {step.operation_type === "outside_processing" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Vendor</Label>
                        <Input
                          value={step.outside_vendor || ""}
                          onChange={(e) => updateStep(index, "outside_vendor", e.target.value)}
                          placeholder="Vendor name"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">PO #</Label>
                        <Input
                          value={step.po_number || ""}
                          onChange={(e) => updateStep(index, "po_number", e.target.value)}
                          placeholder="PO-12345"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" onClick={addStep} className="w-full gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Add Step
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
