import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { mockMachines, getCurrentShift } from "@/lib/mockData";
import { JobState, TriState } from "@/types/handoff";
import { X, Check, Minus, Save, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const jobStates: JobState[] = [
  "Part Running",
  "Setup in Progress",
  "First Article in Process",
  "Waiting on QA",
  "Waiting on Tooling",
  "Waiting on Material",
  "Machine Down / Issue",
];

const readinessItems = [
  { key: "programLoaded", label: "Program Loaded" },
  { key: "programVerifiedAgainstSetup", label: "Program Verified Against Setup" },
  { key: "toolsInstalled", label: "Tools Installed" },
  { key: "toolsSetMeasured", label: "Tools Set/Measured" },
  { key: "toolListMatchesProgram", label: "Tool List Matches Program" },
  { key: "workOffsetsSet", label: "Work Offsets Set" },
  { key: "probingCompleted", label: "Probing Completed" },
  { key: "proveOutCompleted", label: "Prove Out Completed" },
];

interface NewHandoffFormProps {
  onClose: () => void;
}

export function NewHandoffForm({ onClose }: NewHandoffFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    machineId: "",
    workOrder: "",
    partNumber: "",
    partRevision: "",
    operationNumber: "",
    outgoingOperator: "",
    incomingOperator: "",
    jobState: "" as JobState | "",
    jobStateReason: "",
    readiness: Object.fromEntries(readinessItems.map((item) => [item.key, "N/A" as TriState])),
    readinessNotes: "",
    coolantLevel: "OK",
    airPressure: "OK",
    chipCondition: "Clear",
    activeAlarms: false,
    alarmNotes: "",
    partsCompleted: 0,
    scrapCount: 0,
    reworkCount: 0,
    criticalDimsVerified: false,
    handoffSummary: "",
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateReadiness = (key: string) => {
    const currentValue = formData.readiness[key];
    const nextValue: TriState = currentValue === "N/A" ? "Yes" : currentValue === "Yes" ? "No" : "N/A";
    setFormData((prev) => ({
      ...prev,
      readiness: { ...prev.readiness, [key]: nextValue },
    }));
  };

  const handleSubmit = () => {
    toast.success("Handoff record created successfully!");
    onClose();
  };

  const totalSteps = 4;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">New Shift Handoff</h2>
            <p className="text-xs text-muted-foreground">
              {getCurrentShift()} Shift • {new Date().toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={cn(
                  "flex-1 h-1 rounded-full transition-colors",
                  s <= step ? "bg-primary" : "bg-secondary"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Step {step} of {totalSteps}:{" "}
            {step === 1 && "Job Information"}
            {step === 2 && "Machine Readiness"}
            {step === 3 && "Condition & Quality"}
            {step === 4 && "Summary & Sign-off"}
          </p>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Machine</Label>
                  <Select value={formData.machineId} onValueChange={(v) => updateField("machineId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select machine" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockMachines.map((m) => (
                        <SelectItem key={m.machineId} value={m.machineId}>
                          {m.machineId} - {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Work Order</Label>
                  <Input
                    value={formData.workOrder}
                    onChange={(e) => updateField("workOrder", e.target.value)}
                    placeholder="WO-2024-XXXX"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Part Number</Label>
                  <Input
                    value={formData.partNumber}
                    onChange={(e) => updateField("partNumber", e.target.value)}
                    placeholder="PN-XXXX-X"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Revision</Label>
                  <Input
                    value={formData.partRevision}
                    onChange={(e) => updateField("partRevision", e.target.value)}
                    placeholder="Rev A"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Operation</Label>
                  <Input
                    value={formData.operationNumber}
                    onChange={(e) => updateField("operationNumber", e.target.value)}
                    placeholder="OP-XX"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Outgoing Operator</Label>
                  <Input
                    value={formData.outgoingOperator}
                    onChange={(e) => updateField("outgoingOperator", e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Incoming Operator</Label>
                  <Input
                    value={formData.incomingOperator}
                    onChange={(e) => updateField("incomingOperator", e.target.value)}
                    placeholder="Next shift operator"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Job State</Label>
                <Select value={formData.jobState} onValueChange={(v) => updateField("jobState", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select current state" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(formData.jobState.includes("Waiting") || formData.jobState.includes("Down")) && (
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea
                    value={formData.jobStateReason}
                    onChange={(e) => updateField("jobStateReason", e.target.value)}
                    placeholder="Explain the current state..."
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click each item to cycle through: N/A → Yes → No
              </p>
              <div className="space-y-1">
                {readinessItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => updateReadiness(item.key)}
                    className="w-full flex items-center justify-between py-3 px-3 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <span className="text-sm text-foreground">{item.label}</span>
                    <TriStateIcon value={formData.readiness[item.key]} />
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Readiness Notes (Optional)</Label>
                <Textarea
                  value={formData.readinessNotes}
                  onChange={(e) => updateField("readinessNotes", e.target.value)}
                  placeholder="Any notes about machine readiness..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="section-header">Machine Condition</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Coolant Level</Label>
                  <Select value={formData.coolantLevel} onValueChange={(v) => updateField("coolantLevel", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OK">OK</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Air Pressure</Label>
                  <Select value={formData.airPressure} onValueChange={(v) => updateField("airPressure", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OK">OK</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Chip Condition</Label>
                  <Select value={formData.chipCondition} onValueChange={(v) => updateField("chipCondition", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Clear">Clear</SelectItem>
                      <SelectItem value="Needs Cleaning">Needs Cleaning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex items-end">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="alarms"
                      checked={formData.activeAlarms}
                      onCheckedChange={(v) => updateField("activeAlarms", v)}
                    />
                    <Label htmlFor="alarms" className="text-status-critical">Active Alarms</Label>
                  </div>
                </div>
              </div>

              {formData.activeAlarms && (
                <div className="space-y-2">
                  <Label>Alarm Notes</Label>
                  <Textarea
                    value={formData.alarmNotes}
                    onChange={(e) => updateField("alarmNotes", e.target.value)}
                    placeholder="Describe active alarms..."
                    rows={2}
                  />
                </div>
              )}

              <div className="section-header mt-6">Quality Status</div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Parts Completed</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.partsCompleted}
                    onChange={(e) => updateField("partsCompleted", parseInt(e.target.value) || 0)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scrap Count</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.scrapCount}
                    onChange={(e) => updateField("scrapCount", parseInt(e.target.value) || 0)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rework Count</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.reworkCount}
                    onChange={(e) => updateField("reworkCount", parseInt(e.target.value) || 0)}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="dims"
                  checked={formData.criticalDimsVerified}
                  onCheckedChange={(v) => updateField("criticalDimsVerified", v)}
                />
                <Label htmlFor="dims">Critical Dimensions Verified</Label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Handoff Summary *</Label>
                <Textarea
                  value={formData.handoffSummary}
                  onChange={(e) => updateField("handoffSummary", e.target.value)}
                  placeholder="Summarize the current state and any important notes for the incoming operator..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Provide a clear summary of the job status and any critical information.
                </p>
              </div>

              {/* Summary Preview */}
              <div className="border border-border rounded-lg p-4 bg-secondary/30">
                <h4 className="text-sm font-semibold mb-3">Handoff Preview</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Machine: </span>
                    <span className="font-mono">{formData.machineId || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Work Order: </span>
                    <span className="font-mono">{formData.workOrder || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Part: </span>
                    <span className="font-mono">{formData.partNumber || "—"} {formData.partRevision}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">State: </span>
                    <span>{formData.jobState || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">From: </span>
                    <span>{formData.outgoingOperator || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">To: </span>
                    <span>{formData.incomingOperator || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Parts: </span>
                    <span className="font-mono text-status-ok">{formData.partsCompleted}</span>
                    {formData.scrapCount > 0 && (
                      <span className="text-status-critical ml-2">({formData.scrapCount} scrap)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          
          {step < totalSteps ? (
            <Button onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!formData.handoffSummary}>
              <Save className="w-4 h-4 mr-1" />
              Submit Handoff
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function TriStateIcon({ value }: { value: TriState }) {
  if (value === "Yes") {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-status-ok/20">
        <Check className="w-3.5 h-3.5 text-status-ok" />
        <span className="text-xs font-medium text-status-ok">Yes</span>
      </div>
    );
  }
  if (value === "No") {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-status-critical/20">
        <X className="w-3.5 h-3.5 text-status-critical" />
        <span className="text-xs font-medium text-status-critical">No</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted">
      <Minus className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">N/A</span>
    </div>
  );
}
