import { ShiftHandoffRecord } from "@/types/handoff";
import { StatusBadge, getJobStateStatus, getJobStateShortName } from "./StatusBadge";
import { workCenterIcons, workCenterColors } from "@/lib/workCenterIcons";
import { Clock, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface HandoffCardProps {
  record: ShiftHandoffRecord;
  onClick?: () => void;
  onViewWorkOrder?: (workOrder: string) => void;
}

export function HandoffCard({ record, onClick, onViewWorkOrder }: HandoffCardProps) {
  const createdDate = new Date(record.createdAt);
  const Icon = workCenterIcons[record.workCenterType];
  const iconColor = workCenterColors[record.workCenterType];

  return (
    <div 
      className="border border-border rounded-lg p-4 bg-card hover:border-primary/30 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg bg-secondary", iconColor)}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-semibold text-foreground">
                {record.machineId}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="font-mono text-xs text-muted-foreground">
                {record.workOrder}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary">
                {record.workCenterType}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Clock className="w-3 h-3" />
              <span>{format(createdDate, "MMM d, yyyy HH:mm")}</span>
              <span className="text-muted-foreground/50">•</span>
              <span>{record.shift} Shift</span>
            </div>
          </div>
        </div>
        <StatusBadge status={getJobStateStatus(record.jobState.primaryState)}>
          {getJobStateShortName(record.jobState.primaryState)}
        </StatusBadge>
      </div>

      {/* Part Info */}
      <div className="flex items-center gap-4 mb-3 text-xs flex-wrap">
        <div>
          <span className="text-muted-foreground">Part: </span>
          <span className="font-mono text-foreground">{record.part.partNumber}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Rev: </span>
          <span className="font-mono text-foreground">{record.part.revision}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Op: </span>
          <span className="font-mono text-foreground">{record.part.operationNumber}</span>
        </div>
      </div>

      {/* Personnel */}
      <div className="flex items-center gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <User className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">Out:</span>
          <span className="text-foreground">{record.personnel.outgoingOperator}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-primary">→</span>
          <span className="text-muted-foreground">In:</span>
          <span className="text-foreground">{record.personnel.incomingOperator}</span>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-start gap-2 pt-3 border-t border-border">
        <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground line-clamp-2">
          {record.handoffSummary}
        </p>
      </div>

      {/* Quality Stats */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs flex-wrap">
        <div>
          <span className="text-muted-foreground">Completed: </span>
          <span className="font-mono text-status-ok">{record.qualityStatus.partsCompletedThisShift}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Scrap: </span>
          <span className={`font-mono ${record.qualityStatus.scrapCount > 0 ? 'text-status-critical' : 'text-foreground'}`}>
            {record.qualityStatus.scrapCount}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Rework: </span>
          <span className={`font-mono ${record.qualityStatus.reworkCount > 0 ? 'text-status-warning' : 'text-foreground'}`}>
            {record.qualityStatus.reworkCount}
          </span>
        </div>
        {onViewWorkOrder && (
          <button
            className="ml-auto text-primary hover:underline text-xs font-medium"
            onClick={(e) => {
              e.stopPropagation();
              onViewWorkOrder(record.workOrder);
            }}
          >
            View Work Order →
          </button>
        )}
      </div>
    </div>
  );
}
