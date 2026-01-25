import { MachineReadiness, TriState } from "@/types/handoff";
import { Check, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadinessChecklistProps {
  readiness: MachineReadiness;
}

const checklistItems: { key: keyof MachineReadiness; label: string }[] = [
  { key: "programLoaded", label: "Program Loaded" },
  { key: "programVerifiedAgainstSetup", label: "Program Verified Against Setup" },
  { key: "toolsInstalled", label: "Tools Installed" },
  { key: "toolsSetMeasured", label: "Tools Set/Measured" },
  { key: "toolListMatchesProgram", label: "Tool List Matches Program" },
  { key: "workOffsetsSet", label: "Work Offsets Set" },
  { key: "probingCompleted", label: "Probing Completed" },
  { key: "proveOutCompleted", label: "Prove Out Completed" },
];

function StatusIcon({ value }: { value: TriState }) {
  if (value === "Yes") {
    return (
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-status-ok/20">
        <Check className="w-3 h-3 text-status-ok" />
      </div>
    );
  }
  if (value === "No") {
    return (
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-status-critical/20">
        <X className="w-3 h-3 text-status-critical" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-muted">
      <Minus className="w-3 h-3 text-muted-foreground" />
    </div>
  );
}

export function ReadinessChecklist({ readiness }: ReadinessChecklistProps) {
  const completedCount = checklistItems.filter(
    (item) => readiness[item.key] === "Yes"
  ).length;
  const progress = Math.round((completedCount / checklistItems.length) * 100);

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Machine Readiness</h3>
        <span className="font-mono text-xs text-muted-foreground">
          {completedCount}/{checklistItems.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              progress === 100 ? "bg-status-ok" : progress > 50 ? "bg-status-warning" : "bg-status-critical"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-0">
        {checklistItems.map((item) => (
          <div key={item.key} className="checklist-item">
            <span className="text-xs text-foreground">{item.label}</span>
            <StatusIcon value={readiness[item.key] as TriState} />
          </div>
        ))}
      </div>

      {/* Notes */}
      {readiness.notes && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground italic">{readiness.notes}</p>
        </div>
      )}
    </div>
  );
}
