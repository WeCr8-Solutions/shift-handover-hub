import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";
import { useAppSettings } from "./useAppSettings";

// ── Alert types ──────────────────────────────────────────────
export type SmartAlertType =
  | "overdue"
  | "on_hold"
  | "stale"
  | "over_time"
  | "high_priority_waiting"
  | "no_operator"
  | "bottleneck"
  | "unassigned"
  | "no_routing";

export type SmartAlertSeverity = "critical" | "warning" | "info";

export interface SmartAlert {
  id: string; // unique key for React rendering
  type: SmartAlertType;
  severity: SmartAlertSeverity;
  title: string;
  detail: string;
  /** Link target – queue item id or station id */
  targetId: string;
  /** "work_order" | "station" */
  targetType: "work_order" | "station";
  /** Numeric metric (days stale, % over, WO count, etc.) */
  metric?: number;
  /** Metric label for badge */
  metricLabel?: string;
  /** Raw priority for sorting */
  sortWeight: number;
}

// ── Configurable thresholds ──────────────────────────────────
export interface SmartAlertThresholds {
  staleDays: number;          // default 2
  staleCriticalDays: number;  // default 5
  overTimePct: number;        // default 0 (any amount over triggers)
  overTimeCriticalPct: number;// default 100 (2× estimated)
  bottleneckMinWOs: number;   // default 3
  enableOverdue: boolean;
  enableOnHold: boolean;
  enableStale: boolean;
  enableOverTime: boolean;
  enableHighPriority: boolean;
  enableNoOperator: boolean;
  enableBottleneck: boolean;
  enableUnassigned: boolean;
  enableNoRouting: boolean;
}

export const DEFAULT_THRESHOLDS: SmartAlertThresholds = {
  staleDays: 2,
  staleCriticalDays: 5,
  overTimePct: 0,
  overTimeCriticalPct: 100,
  bottleneckMinWOs: 3,
  enableOverdue: true,
  enableOnHold: true,
  enableStale: true,
  enableOverTime: true,
  enableHighPriority: true,
  enableNoOperator: true,
  enableBottleneck: true,
  enableUnassigned: true,
  enableNoRouting: true,
};

const SETTINGS_KEY = "smart_alert_thresholds";

// ── Hook ─────────────────────────────────────────────────────
export function useSmartAlerts(options?: {
  /** Restrict to a single station */
  stationId?: string;
  /** External trigger to refetch */
  refreshToken?: unknown;
}) {
  const { organization } = useOrgContext();
  const { getSetting, updateSetting } = useAppSettings();
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Read thresholds from org settings ──
  const thresholds: SmartAlertThresholds = useMemo(() => {
    const saved = getSetting(SETTINGS_KEY);
    if (!saved) return DEFAULT_THRESHOLDS;
    return { ...DEFAULT_THRESHOLDS, ...saved } as SmartAlertThresholds;
  }, [getSetting]);

  const saveThresholds = useCallback(
    async (next: Partial<SmartAlertThresholds>) => {
      const merged = { ...thresholds, ...next };
      await updateSetting(SETTINGS_KEY, merged as unknown as Record<string, unknown>, "alerts");
    },
    [thresholds, updateSetting],
  );

  // ── Fetch & compute alerts ──
  const fetchAlerts = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    const orgId = organization.id;
    const now = new Date();
    const result: SmartAlert[] = [];

    try {
      // Build base filter
      const baseFilter = (q: any) => {
        q = q.eq("organization_id", orgId);
        if (options?.stationId) q = q.eq("station_id", options.stationId);
        return q;
      };

      // Parallel queries
      const [
        overdueRes,
        holdRes,
        staleRes,
        highPriorityRes,
        inProgressRes,
        bottleneckRes,
        unassignedRes,
        noRoutingRes,
      ] = await Promise.all([
        // Overdue
        thresholds.enableOverdue
          ? baseFilter(
              supabase
                .from("queue_items")
                .select("id, title, work_order, due_date, priority")
            )
              .not("status", "in", '("completed","cancelled")')
              .not("due_date", "is", null)
              .lt("due_date", now.toISOString())
              .order("due_date", { ascending: true })
              .limit(10)
          : Promise.resolve({ data: [] }),

        // On hold
        thresholds.enableOnHold
          ? baseFilter(
              supabase
                .from("queue_items")
                .select("id, title, work_order, priority, updated_at")
            )
              .eq("status", "on_hold")
              .order("updated_at", { ascending: true })
              .limit(10)
          : Promise.resolve({ data: [] }),

        // Stale
        thresholds.enableStale
          ? baseFilter(
              supabase
                .from("queue_items")
                .select("id, title, work_order, updated_at, status")
            )
              .not("status", "in", '("completed","cancelled")')
              .lt(
                "updated_at",
                new Date(now.getTime() - thresholds.staleDays * 86400000).toISOString(),
              )
              .order("updated_at", { ascending: true })
              .limit(10)
          : Promise.resolve({ data: [] }),

        // High priority waiting
        thresholds.enableHighPriority
          ? baseFilter(
              supabase
                .from("queue_items")
                .select("id, title, work_order, priority")
            )
              .eq("status", "queued")
              .in("priority", ["critical", "urgent"])
              .order("created_at", { ascending: true })
              .limit(10)
          : Promise.resolve({ data: [] }),

        // In progress (for over-time + no-operator)
        thresholds.enableOverTime || thresholds.enableNoOperator
          ? baseFilter(
              supabase
                .from("queue_items")
                .select("id, title, work_order, started_at, estimated_duration, assigned_to")
            )
              .eq("status", "in_progress")
              .limit(50)
          : Promise.resolve({ data: [] }),

        // Bottleneck
        thresholds.enableBottleneck
          ? baseFilter(
              supabase
                .from("queue_items")
                .select("station_id, stations:station_id ( name )")
            )
              .in("status", ["queued", "in_progress"])
              .not("station_id", "is", null)
          : Promise.resolve({ data: [] }),

        // Unassigned count
        thresholds.enableUnassigned
          ? baseFilter(
              supabase
                .from("queue_items")
                .select("id", { count: "exact", head: true })
            )
              .is("station_id", null)
              .not("status", "in", '("completed","cancelled")')
          : Promise.resolve({ data: [], count: 0 }),

        // No routing
        thresholds.enableNoRouting
          ? (async () => {
              // Get active WOs
              const { data: activeWOs } = await baseFilter(
                supabase
                  .from("queue_items")
                  .select("id, title, work_order")
              )
                .not("status", "in", '("completed","cancelled")')
                .limit(50);

              if (!activeWOs || activeWOs.length === 0) return { data: [] };

              // Check which have routing
              const { data: routingItems } = await supabase
                .from("work_order_routing")
                .select("queue_item_id")
                .in(
                  "queue_item_id",
                  activeWOs.map((w: any) => w.id),
                );

              const withRouting = new Set(
                (routingItems || []).map((r: any) => r.queue_item_id),
              );
              return {
                data: activeWOs.filter((w: any) => !withRouting.has(w.id)),
              };
            })()
          : Promise.resolve({ data: [] }),
      ]);

      // ── Process results ──

      // Overdue
      ((overdueRes as any).data || []).forEach((wo: any) => {
        const daysOver = Math.floor(
          (now.getTime() - new Date(wo.due_date).getTime()) / 86400000,
        );
        result.push({
          id: `overdue-${wo.id}`,
          type: "overdue",
          severity: daysOver >= 3 || wo.priority === "critical" ? "critical" : "warning",
          title: wo.work_order || wo.title,
          detail: `Due ${new Date(wo.due_date).toLocaleDateString()} — ${daysOver}d overdue`,
          targetId: wo.id,
          targetType: "work_order",
          metric: daysOver,
          metricLabel: `${daysOver}d OVERDUE`,
          sortWeight: 100 + daysOver,
        });
      });

      // On hold
      ((holdRes as any).data || []).forEach((wo: any) => {
        const daysHeld = Math.floor(
          (now.getTime() - new Date(wo.updated_at).getTime()) / 86400000,
        );
        result.push({
          id: `hold-${wo.id}`,
          type: "on_hold",
          severity: daysHeld >= 3 ? "warning" : "info",
          title: wo.work_order || wo.title,
          detail: `On hold${daysHeld > 0 ? ` for ${daysHeld}d` : ""}`,
          targetId: wo.id,
          targetType: "work_order",
          metric: daysHeld,
          metricLabel: "ON HOLD",
          sortWeight: 60 + daysHeld,
        });
      });

      // Stale
      ((staleRes as any).data || []).forEach((wo: any) => {
        const daysStale = Math.floor(
          (now.getTime() - new Date(wo.updated_at).getTime()) / 86400000,
        );
        result.push({
          id: `stale-${wo.id}`,
          type: "stale",
          severity: daysStale >= thresholds.staleCriticalDays ? "critical" : "warning",
          title: wo.work_order || wo.title,
          detail: `No movement in ${daysStale} days (status: ${wo.status})`,
          targetId: wo.id,
          targetType: "work_order",
          metric: daysStale,
          metricLabel: `${daysStale}d STALE`,
          sortWeight: 70 + daysStale,
        });
      });

      // High priority waiting
      ((highPriorityRes as any).data || []).forEach((wo: any) => {
        result.push({
          id: `hp-${wo.id}`,
          type: "high_priority_waiting",
          severity: wo.priority === "critical" ? "critical" : "warning",
          title: wo.work_order || wo.title,
          detail: `${wo.priority === "critical" ? "Critical" : "Urgent"} WO queued — not started`,
          targetId: wo.id,
          targetType: "work_order",
          metricLabel: `${wo.priority.toUpperCase()} WAITING`,
          sortWeight: wo.priority === "critical" ? 95 : 85,
        });
      });

      // Over time + No operator
      ((inProgressRes as any).data || []).forEach((wo: any) => {
        // Over time
        if (thresholds.enableOverTime && wo.started_at && wo.estimated_duration) {
          const elapsedMs = now.getTime() - new Date(wo.started_at).getTime();
          const estimatedMs = wo.estimated_duration * 60000;
          if (elapsedMs > estimatedMs) {
            const pctOver = Math.round((elapsedMs / estimatedMs) * 100) - 100;
            if (pctOver >= thresholds.overTimePct) {
              result.push({
                id: `overtime-${wo.id}`,
                type: "over_time",
                severity: pctOver >= thresholds.overTimeCriticalPct ? "critical" : "warning",
                title: wo.work_order || wo.title,
                detail: `Running ${pctOver}% over estimated duration`,
                targetId: wo.id,
                targetType: "work_order",
                metric: pctOver,
                metricLabel: `+${pctOver}% OVER`,
                sortWeight: 80 + Math.min(pctOver, 50),
              });
            }
          }
        }

        // No operator
        if (thresholds.enableNoOperator && !wo.assigned_to) {
          result.push({
            id: `noops-${wo.id}`,
            type: "no_operator",
            severity: "warning",
            title: wo.work_order || wo.title,
            detail: "In progress but no operator checked in",
            targetId: wo.id,
            targetType: "work_order",
            metricLabel: "NO OPERATOR",
            sortWeight: 50,
          });
        }
      });

      // Bottleneck
      if (thresholds.enableBottleneck) {
        const counts: Record<string, { name: string; count: number }> = {};
        ((bottleneckRes as any).data || []).forEach((wo: any) => {
          const sid = wo.station_id;
          const name = wo.stations?.name || "Unknown";
          if (!counts[sid]) counts[sid] = { name, count: 0 };
          counts[sid].count++;
        });
        Object.entries(counts)
          .filter(([, v]) => v.count >= thresholds.bottleneckMinWOs)
          .sort(([, a], [, b]) => b.count - a.count)
          .forEach(([sid, v]) => {
            result.push({
              id: `bottleneck-${sid}`,
              type: "bottleneck",
              severity: v.count >= 5 ? "critical" : "warning",
              title: v.name,
              detail: `${v.count} work orders competing for this station`,
              targetId: sid,
              targetType: "station",
              metric: v.count,
              metricLabel: `${v.count} WOs QUEUED`,
              sortWeight: 75 + v.count,
            });
          });
      }

      // Unassigned
      if (thresholds.enableUnassigned) {
        const count = (unassignedRes as any).count || 0;
        if (count > 0) {
          result.push({
            id: "unassigned",
            type: "unassigned",
            severity: count >= 5 ? "warning" : "info",
            title: `${count} Unassigned`,
            detail: `${count} work order${count !== 1 ? "s" : ""} without a station assignment`,
            targetId: "",
            targetType: "work_order",
            metric: count,
            metricLabel: `${count} UNASSIGNED`,
            sortWeight: 40,
          });
        }
      }

      // No routing
      if (thresholds.enableNoRouting) {
        const noRouteItems = (noRoutingRes as any).data || [];
        noRouteItems.slice(0, 5).forEach((wo: any) => {
          result.push({
            id: `noroute-${wo.id}`,
            type: "no_routing",
            severity: "info",
            title: wo.work_order || wo.title,
            detail: "Active work order with no routing defined",
            targetId: wo.id,
            targetType: "work_order",
            metricLabel: "NO ROUTING",
            sortWeight: 30,
          });
        });
      }

      // Sort by severity weight descending
      result.sort((a, b) => b.sortWeight - a.sortWeight);
      setAlerts(result);
    } catch (err) {
      console.error("useSmartAlerts fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [organization?.id, options?.stationId, thresholds]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts, options?.refreshToken]);

  // Derived counts by type
  const alertCounts = useMemo(() => {
    const map: Record<SmartAlertType, number> = {
      overdue: 0,
      on_hold: 0,
      stale: 0,
      over_time: 0,
      high_priority_waiting: 0,
      no_operator: 0,
      bottleneck: 0,
      unassigned: 0,
      no_routing: 0,
    };
    alerts.forEach((a) => map[a.type]++);
    return map;
  }, [alerts]);

  return {
    alerts,
    alertCounts,
    totalAlerts: alerts.length,
    loading,
    thresholds,
    saveThresholds,
    refresh: fetchAlerts,
  };
}
