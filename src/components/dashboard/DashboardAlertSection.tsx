import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SmartAlertPanel } from "@/components/alerts/SmartAlertPanel";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Wrench,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import type { SmartAlert } from "@/hooks/useSmartAlerts";

interface AttentionItem {
  label: string;
  detail: string;
  severity: "critical" | "warning" | "info";
  stationId: string;
  stationName: string;
}

interface DashboardAlertSectionProps {
  woAlerts: SmartAlert[];
  stationAlerts: SmartAlert[];
  attentionItems: AttentionItem[];
  smartAlertsLoading: boolean;
  woAlertsOpen: boolean;
  onWoAlertsOpenChange: (open: boolean) => void;
  stationAlertsOpen: boolean;
  onStationAlertsOpenChange: (open: boolean) => void;
  onViewStation?: (stationId: string, stationName: string) => void;
}

export function DashboardAlertSection({
  woAlerts,
  stationAlerts,
  attentionItems,
  smartAlertsLoading,
  woAlertsOpen,
  onWoAlertsOpenChange,
  stationAlertsOpen,
  onStationAlertsOpenChange,
  onViewStation,
}: DashboardAlertSectionProps) {
  const handleAttentionItemClick = useCallback(
    (item: AttentionItem) => {
      onViewStation?.(item.stationId, item.stationName);
    },
    [onViewStation],
  );

  if (woAlerts.length === 0 && stationAlerts.length === 0 && attentionItems.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Work Order Alerts */}
      {woAlerts.length > 0 && (
        <Collapsible open={woAlertsOpen} onOpenChange={onWoAlertsOpenChange}>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <CollapsibleTrigger asChild>
              <button className="w-full px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Work Order Alerts</span>
                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0">{woAlerts.length}</Badge>
                </div>
                {woAlertsOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SmartAlertPanel
                alerts={woAlerts}
                loading={smartAlertsLoading}
                variant="sidebar"
                maxVisible={5}
              />
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* Station / Machine Alerts */}
      {(stationAlerts.length > 0 || attentionItems.length > 0) && (
        <Collapsible open={stationAlertsOpen} onOpenChange={onStationAlertsOpenChange}>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <CollapsibleTrigger asChild>
              <button className="w-full px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Station Alerts</span>
                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0">{stationAlerts.length + attentionItems.length}</Badge>
                </div>
                {stationAlertsOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {/* Attention items (machine down, waiting, idle) */}
              {attentionItems.length > 0 && (
                <div className="p-3 space-y-1.5">
                  {attentionItems.map((item, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md border cursor-pointer transition-colors",
                        item.severity === "critical"
                          ? "bg-destructive/10 border-destructive/30 hover:bg-destructive/20"
                          : item.severity === "warning"
                          ? "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
                          : "bg-muted/50 border-border hover:bg-muted",
                      )}
                      onClick={() => handleAttentionItemClick(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleAttentionItemClick(item);
                        }
                      }}
                      aria-label={`View ${item.stationName} details`}
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          item.severity === "critical" ? "bg-destructive"
                            : item.severity === "warning" ? "bg-amber-500"
                            : "bg-muted-foreground/50",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{item.label}</span>
                        <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
              {/* Smart station alerts */}
              {stationAlerts.length > 0 && (
                <SmartAlertPanel
                  alerts={stationAlerts}
                  loading={smartAlertsLoading}
                  variant="sidebar"
                  maxVisible={5}
                />
              )}
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </div>
  );
}
