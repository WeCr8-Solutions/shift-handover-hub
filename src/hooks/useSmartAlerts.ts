import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  id: string;
  type: SmartAlertType;
  severity: SmartAlertSeverity;
  title: string;
  detail: string;
  targetId: string;
  targetType: "work_order" | "station";
  metric?: number;
  metricLabel?: string;
  sortWeight: number;
}

// ── Configurable thresholds ──────────────────────────────────
export interface SmartAlertThresholds {
  staleDays: number;
  staleCriticalDays: number;
  overTimePct: number;
  overTimeCriticalPct: number;
  bottleneckMinWOs: number;
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
  stationId?: string;
  refreshToken?: unknown;
}) {
  const { organization } = useOrgContext();
  const { getSetting, updateSetting } = useAppSettings();
  const queryClient = useQueryClient();

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

  // ── Single RPC call replaces 8 parallel queries ──
  const queryKey = useMemo(
    () => ["smart-alerts", organization?.id || "none", options?.stationId || "all"],
    [organization?.id, options?.stationId],
  );

  const { data: alerts = [], isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<SmartAlert[]> => {
      if (!organization?.id) return [];

      const { data, error } = await supabase.rpc("compute_smart_alerts", {
        _org_id: organization.id,
        _station_id: options?.stationId ?? null,
        _stale_days: thresholds.staleDays,
        _stale_critical_days: thresholds.staleCriticalDays,
        _over_time_pct: thresholds.overTimePct,
        _over_time_critical_pct: thresholds.overTimeCriticalPct,
        _bottleneck_min_wos: thresholds.bottleneckMinWOs,
        _enable_overdue: thresholds.enableOverdue,
        _enable_on_hold: thresholds.enableOnHold,
        _enable_stale: thresholds.enableStale,
        _enable_over_time: thresholds.enableOverTime,
        _enable_high_priority: thresholds.enableHighPriority,
        _enable_no_operator: thresholds.enableNoOperator,
        _enable_bottleneck: thresholds.enableBottleneck,
        _enable_unassigned: thresholds.enableUnassigned,
        _enable_no_routing: thresholds.enableNoRouting,
      });

      if (error) {
        console.error("compute_smart_alerts RPC error:", error);
        return [];
      }

      // RPC returns jsonb array — cast to SmartAlert[]
      return (data as unknown as SmartAlert[]) || [];
    },
    enabled: !!organization?.id,
    staleTime: 60_000, // alerts can be 1min stale
    refetchInterval: 300_000, // 5min fallback
    refetchIntervalInBackground: false,
  });

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

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    alerts,
    alertCounts,
    totalAlerts: alerts.length,
    loading: isLoading,
    thresholds,
    saveThresholds,
    refresh,
  };
}
