import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DimensionRequirement, DimensionReading } from "@/hooks/useDimensions";
import { CheckCircle2, XCircle, Ruler, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const INSTRUMENTS = [
  "Micrometer",
  "Caliper",
  "CMM",
  "Height Gauge",
  "Bore Gauge",
  "Go/No-Go Gauge",
  "Surface Plate",
  "Optical Comparator",
  "Other",
];

interface DimensionCheckFormProps {
  requirements: DimensionRequirement[];
  readings: DimensionReading[];
  queueItemId: string;
  routingStepId: string;
  onRecordReading: (reading: {
    dimension_id: string;
    routing_step_id: string;
    queue_item_id: string;
    measured_value: number;
    instrument_used?: string;
  }) => Promise<{ error: string | null }>;
  loading?: boolean;
  readOnly?: boolean;
}

export function DimensionCheckForm({
  requirements,
  readings,
  queueItemId,
  routingStepId,
  onRecordReading,
  loading,
  readOnly,
}: DimensionCheckFormProps) {
  const [formValues, setFormValues] = useState<Record<string, { value: string; instrument: string }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Initialize form with existing readings
  useEffect(() => {
    const initial: Record<string, { value: string; instrument: string }> = {};
    requirements.forEach((req) => {
      const existing = readings.find((r) => r.dimension_id === req.id);
      initial[req.id] = {
        value: existing ? String(existing.measured_value) : "",
        instrument: existing?.instrument_used || "",
      };
    });
    setFormValues(initial);
  }, [requirements, readings]);

  const handleSubmitReading = async (dimId: string) => {
    const entry = formValues[dimId];
    if (!entry?.value) return;
    const measured = parseFloat(entry.value);
    if (isNaN(measured)) return;

    setSubmitting(dimId);
    await onRecordReading({
      dimension_id: dimId,
      routing_step_id: routingStepId,
      queue_item_id: queueItemId,
      measured_value: measured,
      instrument_used: entry.instrument || undefined,
    });
    setSubmitting(null);
  };

  if (requirements.length === 0) return null;

  const completedCount = requirements.filter((req) => readings.find((r) => r.dimension_id === req.id)).length;
  const allPassing = requirements.every((req) => {
    const r = readings.find((rd) => rd.dimension_id === req.id);
    return r && r.is_pass;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Ruler className="w-4 h-4 text-primary" />
          Dimension Checks
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            completedCount === requirements.length
              ? allPassing
                ? "text-green-600 border-green-500/50"
                : "text-destructive border-destructive/50"
              : "text-muted-foreground"
          )}
        >
          {completedCount}/{requirements.length} recorded
        </Badge>
      </div>

      <div className="space-y-2">
        {requirements.map((req) => {
          const existing = readings.find((r) => r.dimension_id === req.id);
          const entry = formValues[req.id] || { value: "", instrument: "" };
          const lowerBound = req.nominal_value - req.lower_tolerance;
          const upperBound = req.nominal_value + req.upper_tolerance;

          return (
            <div
              key={req.id}
              className={cn(
                "border rounded-lg p-3 space-y-2",
                existing?.is_pass === true && "border-green-500/30 bg-green-500/5",
                existing?.is_pass === false && "border-destructive/30 bg-destructive/5",
                req.is_critical && !existing && "border-amber-500/30"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{req.dimension_name}</span>
                  {req.is_critical && (
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/50">
                      <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                      Critical
                    </Badge>
                  )}
                </div>
                {existing && (
                  existing.is_pass ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )
                )}
              </div>

              {/* Tolerance spec */}
              <div className="text-xs text-muted-foreground">
                Nominal: <span className="font-mono font-medium">{req.nominal_value}</span> {req.unit}
                {" · "}Range: <span className="font-mono">{lowerBound.toFixed(4)} — {upperBound.toFixed(4)}</span> {req.unit}
              </div>

              {/* Reading input or display */}
              {existing && readOnly ? (
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-mono font-medium">{existing.measured_value}</span>
                  <span className={cn("text-xs", existing.is_pass ? "text-green-600" : "text-destructive")}>
                    {existing.is_pass ? "PASS" : "FAIL"}
                  </span>
                  {existing.instrument_used && (
                    <span className="text-xs text-muted-foreground">({existing.instrument_used})</span>
                  )}
                  {existing.recorded_by_name && (
                    <span className="text-xs text-muted-foreground ml-auto">by {existing.recorded_by_name}</span>
                  )}
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Measured Value ({req.unit})</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder={String(req.nominal_value)}
                      value={entry.value}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          [req.id]: { ...prev[req.id], value: e.target.value },
                        }))
                      }
                      className="h-8 text-sm font-mono"
                      disabled={!!existing || readOnly}
                    />
                  </div>
                  <div className="w-36 space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Instrument</Label>
                    <Select
                      value={entry.instrument || "none"}
                      onValueChange={(v) =>
                        setFormValues((prev) => ({
                          ...prev,
                          [req.id]: { ...prev[req.id], instrument: v === "none" ? "" : v },
                        }))
                      }
                      disabled={!!existing || readOnly}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select...</SelectItem>
                        {INSTRUMENTS.map((i) => (
                          <SelectItem key={i} value={i}>{i}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!existing && !readOnly && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3"
                      disabled={!entry.value || submitting === req.id}
                      onClick={() => handleSubmitReading(req.id)}
                    >
                      {submitting === req.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Record"
                      )}
                    </Button>
                  )}
                </div>
              )}

              {req.notes && (
                <p className="text-[10px] text-muted-foreground italic">{req.notes}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
