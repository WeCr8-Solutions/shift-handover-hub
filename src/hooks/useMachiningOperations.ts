import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MachiningOperationCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_canonical: boolean;
  organization_id: string | null;
}

export interface MachiningOperation {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  short_description: string | null;
  long_description: string | null;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert" | null;
  profession_tags: string[];
  role_tags: string[];
  machine_tags: string[];
  typical_tooling: string[];
  common_pitfalls: string | null;
  safety_notes: string | null;
  is_canonical: boolean;
  organization_id: string | null;
  sort_order: number;
}

interface Filters {
  professionTag?: string;
  roleTag?: string;
  machineTag?: string;
  categorySlug?: string;
}

export function useMachiningOperations(filters: Filters = {}) {
  const categoriesQuery = useQuery({
    queryKey: ["machining-operation-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machining_operation_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as MachiningOperationCategory[];
    },
  });

  const operationsQuery = useQuery({
    queryKey: ["machining-operations", filters],
    queryFn: async () => {
      let q = supabase.from("machining_operations").select("*").order("sort_order");
      if (filters.professionTag) q = q.contains("profession_tags", [filters.professionTag]);
      if (filters.roleTag) q = q.contains("role_tags", [filters.roleTag]);
      if (filters.machineTag) q = q.contains("machine_tags", [filters.machineTag]);
      const { data, error } = await q;
      if (error) throw error;
      let rows = (data ?? []) as MachiningOperation[];
      if (filters.categorySlug && categoriesQuery.data) {
        const cat = categoriesQuery.data.find((c) => c.slug === filters.categorySlug);
        if (cat) rows = rows.filter((r) => r.category_id === cat.id);
      }
      return rows;
    },
    enabled: !filters.categorySlug || !!categoriesQuery.data,
  });

  return {
    categories: categoriesQuery.data ?? [],
    operations: operationsQuery.data ?? [],
    isLoading: categoriesQuery.isLoading || operationsQuery.isLoading,
    error: categoriesQuery.error || operationsQuery.error,
  };
}
