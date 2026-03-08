import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { RoutingStepInput } from "@/hooks/useQueue";
import { Route, Plus, Trash2, FileText, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
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

const OP_TYPE_COLORS: Record<string, string> = {
  quote: "bg-slate-500",
  engineering: "bg-indigo-500",
  purchasing: "bg-cyan-500",
  receiving: "bg-teal-500",
  internal: "bg-primary",
  outside_processing: "bg-amber-500",
  inspection: "bg-purple-500",
  shipping: "bg-green-500",
};

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
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    // Scroll to end after adding
    setTimeout(() => {
      scrollRef.current?.scrollTo({ left: scrollRef.current.scrollWidth, behavior: "smooth" });
    }, 100);
  }, [steps, onChange]);

  const removeStep = useCallback((index: number) => {
    const newSteps = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_number: i + 1 }));
    onChange(newSteps);
    setSelectedStep(null);
  }, [steps, onChange]);

  const updateStep = useCallback((index: number, field: keyof RoutingStepInput, value: string | number | undefined) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    onChange(newSteps);
  }, [steps, onChange]);

  const scrollBy = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  const opLabel = (type: string) => OPERATION_TYPES.find((o) => o.value === type)?.label || type;

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

      {/* Horizontal scrolling steps */}
      {steps.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => { setExpanded(!expanded); setSelectedStep(null); }}
            className="flex items-center justify-between gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full px-3 py-2 rounded-md border bg-muted/30 hover:bg-muted/50"
          >
            <span className="flex items-center gap-1.5">
              <Route className="w-4 h-4" />
              {steps.length} routing step{steps.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1 text-xs">
              {expanded ? "Collapse" : "Expand to view/edit"}
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>

          {expanded && (
            <div className="border rounded-lg bg-muted/30 overflow-hidden">
              {/* Horizontal scroll track with arrow buttons */}
              <div className="relative">
                {steps.length > 2 && (
                  <>
                    <button
                      type="button"
                      onClick={() => scrollBy("left")}
                      className="absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-muted/80 to-transparent flex items-center justify-start pl-1 hover:from-muted"
                    >
                      <ChevronLeft className="w-4 h-4 text-foreground" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollBy("right")}
                      className="absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-muted/80 to-transparent flex items-center justify-end pr-1 hover:from-muted"
                    >
                      <ChevronRight className="w-4 h-4 text-foreground" />
                    </button>
                  </>
                )}

                <div
                  ref={scrollRef}
                  className="flex gap-2 overflow-x-auto px-3 py-3 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent snap-x snap-mandatory"
                  style={{ scrollbarWidth: "thin" }}
                >
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-1 snap-start">
                      {/* Compact step card */}
                      <button
                        type="button"
                        onClick={() => setSelectedStep(selectedStep === index ? null : index)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2.5 rounded-lg border bg-background min-w-[90px] max-w-[110px] transition-all hover:border-primary/50 shrink-0",
                          selectedStep === index && "ring-2 ring-primary border-primary shadow-md",
                          step.operation_type === "outside_processing" && "border-amber-400/60"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                          OP_TYPE_COLORS[step.operation_type] || "bg-muted-foreground"
                        )}>
                          {step.step_number}
                        </div>
                        <span className="text-[10px] font-medium text-center leading-tight line-clamp-2">
                          {step.operation_name || "Untitled"}
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {opLabel(step.operation_type)}
                        </Badge>
                      </button>

                      {/* Arrow connector between steps */}
                      {index < steps.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                      )}
                    </div>
                  ))}

                  {/* Add step button at end */}
                  <button
                    type="button"
                    onClick={addStep}
                    className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg border border-dashed border-muted-foreground/30 min-w-[80px] hover:border-primary/50 hover:bg-muted/50 transition-colors shrink-0 snap-start"
                  >
                    <Plus className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Add Step</span>
                  </button>
                </div>
              </div>

              {/* Expanded detail panel for selected step */}
              {selectedStep !== null && steps[selectedStep] && (
                <div className="border-t p-3 space-y-3 bg-background/80">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold",
                        OP_TYPE_COLORS[steps[selectedStep].operation_type] || "bg-muted-foreground"
                      )}>
                        {steps[selectedStep].step_number}
                      </div>
                      Step {steps[selectedStep].step_number} Details
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(selectedStep)}
                      className="h-7 px-2 text-destructive hover:text-destructive gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Operation Name</Label>
                      <Input
                        value={steps[selectedStep].operation_name}
                        onChange={(e) => updateStep(selectedStep, "operation_name", e.target.value)}
                        placeholder="e.g. CNC Milling"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={steps[selectedStep].operation_type}
                        onValueChange={(v) => updateStep(selectedStep, "operation_type", v)}
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
                      value={steps[selectedStep].station_id || "none"}
                      onValueChange={(v) => updateStep(selectedStep, "station_id", v === "none" ? undefined : v)}
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

                  {steps[selectedStep].operation_type === "outside_processing" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Vendor</Label>
                        <Input
                          value={steps[selectedStep].outside_vendor || ""}
                          onChange={(e) => updateStep(selectedStep, "outside_vendor", e.target.value)}
                          placeholder="Vendor name"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">PO #</Label>
                        <Input
                          value={steps[selectedStep].po_number || ""}
                          onChange={(e) => updateStep(selectedStep, "po_number", e.target.value)}
                          placeholder="PO-12345"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
