/**
 * src/components/machine/AlarmFeed.tsx
 *
 * Per CONTEXT.docx §8:
 *   AlarmFeed uses useJobLineAlarms({ shiftStart, shiftEnd })
 *   Time-window alarm list sorted newest-first.
 *   Severity colour coding. Acknowledge button.
 *   CLEARED label on active:false alarms.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useJobLineAlarms, useMachineStatusStore } from "@/store/machineStatusStore";
import { ALARM_SEVERITY_CONFIG } from "@/types/machine";
import type { AppAlarm } from "@/types/machine";

interface AlarmFeedProps {
  shiftStart?: Date;
  shiftEnd?: Date;
  maxItems?: number;
  compact?: boolean;
}

/**
 * AlarmFeed — time-window alarm list with severity coding and acknowledge action.
 * Per CONTEXT.docx §8 component spec.
 */
export function AlarmFeed({
  shiftStart,
  shiftEnd,
  maxItems = 50,
  compact = false,
}: AlarmFeedProps) {
  const alarms = useJobLineAlarms(shiftStart, shiftEnd);
  const acknowledgeAlarm = useMachineStatusStore((s) => s.acknowledgeAlarm);

  const displayAlarms = alarms.slice(0, maxItems);
  const activeCount = displayAlarms.filter((a) => a.active && !a.acknowledged).length;

  if (displayAlarms.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <BellOff className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm">No alarms this shift</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className={cn("pb-3", compact && "pb-2")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alarm Feed
            {activeCount > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                {activeCount}
              </Badge>
            )}
          </CardTitle>
          {shiftStart && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Since {shiftStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className={cn(compact ? "h-48" : "h-72")}>
          <div className="space-y-1.5">
            {displayAlarms.map((alarm) => (
              <AlarmRow
                key={alarm.id}
                alarm={alarm}
                onAcknowledge={() => acknowledgeAlarm(alarm.id)}
                compact={compact}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function AlarmRow({
  alarm,
  onAcknowledge,
  compact,
}: {
  alarm: AppAlarm;
  onAcknowledge: () => void;
  compact?: boolean;
}) {
  const config = ALARM_SEVERITY_CONFIG[alarm.severity] || ALARM_SEVERITY_CONFIG.alarm;
  const isCleared = !alarm.active;
  const isAcknowledged = alarm.acknowledged;

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2 text-xs transition-colors",
        config.bgClass,
        config.borderClass,
        isCleared && "opacity-50",
        isAcknowledged && "opacity-60",
      )}
    >
      {/* Severity icon */}
      <AlertTriangle
        className={cn(
          "w-3.5 h-3.5 mt-0.5 shrink-0",
          config.colorClass,
          alarm.active && alarm.severity === "fault" && "animate-pulse",
        )}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Severity badge */}
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] px-1 py-0 font-bold tracking-wider",
              config.colorClass,
            )}
          >
            {config.label}
          </Badge>

          {/* Alarm code */}
          <span className="font-mono font-semibold">{alarm.code}</span>

          {/* CLEARED label per CONTEXT.docx */}
          {isCleared && (
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 text-muted-foreground border-muted-foreground/30"
            >
              CLEARED
            </Badge>
          )}
        </div>

        {!compact && (
          <>
            <p className="mt-0.5 text-muted-foreground truncate">{alarm.message}</p>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-0.5">
                    <Cpu className="w-2.5 h-2.5" />
                    {alarm.machineLabel}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Machine: {alarm.machineId}
                </TooltipContent>
              </Tooltip>
              <span>·</span>
              <span>{alarm.timestamp.toLocaleTimeString()}</span>
              {alarm.workOrderNumber && (
                <>
                  <span>·</span>
                  <span>WO: {alarm.workOrderNumber}</span>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Acknowledge button */}
      {alarm.active && !isAcknowledged && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onAcknowledge();
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            Acknowledge alarm
          </TooltipContent>
        </Tooltip>
      )}

      {/* Acknowledged indicator */}
      {isAcknowledged && (
        <Badge
          variant="outline"
          className="text-[9px] px-1 py-0 text-muted-foreground shrink-0"
        >
          ACK
        </Badge>
      )}
    </div>
  );
}
