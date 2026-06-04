/**
 * useSkillsGapMatrix — supervisor view of operator skills vs station needs.
 * Cross-references operator_skills with the work_center_type required by each
 * station in the org so gaps and over-coverage are immediately visible.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";

export interface OperatorRow {
  user_id: string;
  display_name: string;
  skills: { skill: string; proficiency: string }[];
}

export interface StationCol {
  id: string;
  name: string;
  station_id: string;
  work_center_type: string;
}

export interface MatrixCell {
  has: boolean;
  proficiency?: string;
}

export interface SkillsGapMatrix {
  operators: OperatorRow[];
  stations: StationCol[];
  // Map keyed by `${userId}::${stationId}` for O(1) lookup
  cells: Record<string, MatrixCell>;
  // Coverage = operators-per-station
  coverage: Record<string, number>;
  totalGaps: number;
}

function normalizeSkill(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "_");
}

export function useSkillsGapMatrix() {
  const { organization } = useOrgContext();
  const orgId = organization?.id;

  return useQuery({
    enabled: !!orgId,
    queryKey: ["skills-gap-matrix", orgId],
    queryFn: async (): Promise<SkillsGapMatrix> => {
      // Fetch members + stations + skills in parallel.
      const [membersRes, stationsRes] = await Promise.all([
        supabase
          .from("organization_members")
          .select("user_id, profiles:user_id(display_name, full_name)")
          .eq("organization_id", orgId!),
        supabase
          .from("stations")
          .select("id, name, station_id, work_center_type")
          .eq("organization_id", orgId!)
          .eq("is_active", true)
          .order("name"),
      ]);

      const members = (membersRes.data ?? []) as any[];
      const stations = (stationsRes.data ?? []) as StationCol[];
      const userIds = members.map((m) => m.user_id);

      const { data: skillRows } = userIds.length
        ? await supabase
            .from("operator_skills")
            .select("user_id, skill, proficiency")
            .in("user_id", userIds)
        : { data: [] as any[] };

      // Group skills per operator
      const skillsByUser: Record<string, { skill: string; proficiency: string }[]> = {};
      for (const r of (skillRows ?? []) as any[]) {
        (skillsByUser[r.user_id] ||= []).push({ skill: r.skill, proficiency: r.proficiency });
      }

      const operators: OperatorRow[] = members.map((m) => ({
        user_id: m.user_id,
        display_name:
          m.profiles?.display_name ||
          m.profiles?.full_name ||
          `Operator ${m.user_id.slice(0, 6)}`,
        skills: skillsByUser[m.user_id] ?? [],
      }));

      const cells: Record<string, MatrixCell> = {};
      const coverage: Record<string, number> = {};
      let totalGaps = 0;

      for (const station of stations) {
        const needed = normalizeSkill(station.work_center_type);
        let count = 0;
        for (const op of operators) {
          const match = op.skills.find((s) => normalizeSkill(s.skill) === needed);
          const key = `${op.user_id}::${station.id}`;
          cells[key] = { has: !!match, proficiency: match?.proficiency };
          if (match) count++;
        }
        coverage[station.id] = count;
        if (count === 0) totalGaps++;
      }

      return { operators, stations, cells, coverage, totalGaps };
    },
  });
}
