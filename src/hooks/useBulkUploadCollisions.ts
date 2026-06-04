/**
 * useBulkUploadCollisions — pre-flight collision check for bulk upload.
 * Compares parsed rows against existing org data so users see exactly what
 * will be skipped vs created BEFORE they click "Upload".
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";
import type { ParsedExcelData } from "@/lib/excelTemplates";

export interface CollisionReport {
  teamDuplicates: string[];
  stationDuplicates: string[];
  workOrderDuplicates: string[];
  totalNew: number;
  totalSkip: number;
  loading: boolean;
}

const empty: CollisionReport = {
  teamDuplicates: [],
  stationDuplicates: [],
  workOrderDuplicates: [],
  totalNew: 0,
  totalSkip: 0,
  loading: false,
};

export function useBulkUploadCollisions(data: ParsedExcelData | null): CollisionReport {
  const { organization } = useOrgContext();
  const [report, setReport] = useState<CollisionReport>(empty);

  useEffect(() => {
    if (!data || !organization?.id) {
      setReport(empty);
      return;
    }
    let cancelled = false;
    (async () => {
      setReport({ ...empty, loading: true });

      const [teamsRes, stationsRes, wosRes] = await Promise.all([
        supabase.from("teams").select("name").eq("organization_id", organization.id),
        supabase.from("stations").select("station_id").eq("organization_id", organization.id),
        supabase.from("queue_items").select("work_order").eq("organization_id", organization.id),
      ]);

      const existingTeams = new Set((teamsRes.data ?? []).map((r: any) => r.name.toLowerCase()));
      const existingStations = new Set((stationsRes.data ?? []).map((r: any) => r.station_id.toLowerCase()));
      const existingWOs = new Set(
        (wosRes.data ?? []).map((r: any) => (r.work_order ?? "").toLowerCase()).filter(Boolean),
      );

      const teamDuplicates = data.teams.filter((t) => existingTeams.has(t.name.toLowerCase())).map((t) => t.name);
      const stationDuplicates = data.stations
        .filter((s) => existingStations.has(s.station_id.toLowerCase()))
        .map((s) => s.station_id);
      const workOrderDuplicates = data.workOrders
        .filter((w) => w.work_order && existingWOs.has(w.work_order.toLowerCase()))
        .map((w) => w.work_order);

      const totalParsed =
        data.teams.length +
        data.departments.length +
        data.stations.length +
        data.users.length +
        data.workOrders.length +
        (data.routingTemplates?.length ?? 0);
      const totalSkip = teamDuplicates.length + stationDuplicates.length + workOrderDuplicates.length;
      const totalNew = Math.max(0, totalParsed - totalSkip);

      if (!cancelled) {
        setReport({
          teamDuplicates,
          stationDuplicates,
          workOrderDuplicates,
          totalNew,
          totalSkip,
          loading: false,
        });
      }
    })().catch(() => {
      if (!cancelled) setReport({ ...empty });
    });
    return () => {
      cancelled = true;
    };
  }, [data, organization?.id]);

  return report;
}
