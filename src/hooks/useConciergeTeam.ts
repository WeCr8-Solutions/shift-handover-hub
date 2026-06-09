import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lists JobLine concierge staff (platform admins + developers) for handoff.
 * Readable by platform admins via the `Admins can view all user roles` RLS
 * policy on `user_roles`. Operators and supervisors will get an empty array.
 */
export interface ConciergeTeammate {
  userId: string;
  displayName: string | null;
  email: string | null;
  roles: string[];
}

export function useConciergeTeam() {
  return useQuery({
    queryKey: ["concierge-team"],
    staleTime: 60_000,
    queryFn: async (): Promise<ConciergeTeammate[]> => {
      const { data: rolesRows, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin", "developer"]);
      if (error) throw error;
      const map = new Map<string, Set<string>>();
      for (const r of rolesRows ?? []) {
        const key = (r as any).user_id as string;
        if (!map.has(key)) map.set(key, new Set());
        map.get(key)!.add((r as any).role as string);
      }
      const ids = Array.from(map.keys());
      if (ids.length === 0) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, email, display_name")
        .in("user_id", ids);
      const profMap = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
      return ids
        .map((id) => {
          const p = profMap.get(id);
          return {
            userId: id,
            displayName: p?.display_name ?? null,
            email: p?.email ?? null,
            roles: Array.from(map.get(id) ?? []),
          };
        })
        .sort((a, b) => (a.displayName ?? a.email ?? "").localeCompare(b.displayName ?? b.email ?? ""));
    },
  });
}
