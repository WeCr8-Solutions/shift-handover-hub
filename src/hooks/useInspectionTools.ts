import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";
import { Database } from "@/integrations/supabase/types";

export type InspectionProfessionTag =
  Database["public"]["Enums"]["inspection_profession_tag"];
export type InspectionRoleTag =
  Database["public"]["Enums"]["inspection_role_tag"];

export interface InspectionToolCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  icon: string | null;
  is_canonical: boolean;
  organization_id: string | null;
}

export interface InspectionTool {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  description: string | null;
  typical_use: string | null;
  precision_spec: string | null;
  measurement_range: string | null;
  manufacturer_examples: string[] | null;
  safety_notes: string | null;
  profession_tags: InspectionProfessionTag[];
  role_tags: InspectionRoleTag[];
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  is_canonical: boolean;
  organization_id: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface InspectionToolOverride {
  id: string;
  organization_id: string;
  tool_id: string;
  is_hidden: boolean;
  custom_notes: string | null;
  custom_precision_spec: string | null;
  required_for_roles: InspectionRoleTag[];
}

interface Filters {
  professionTag?: InspectionProfessionTag;
  roleTag?: InspectionRoleTag;
  categorySlug?: string;
  includeHidden?: boolean;
}

export function useInspectionTools(filters: Filters = {}) {
  const { organization } = useOrgContext();
  const [categories, setCategories] = useState<InspectionToolCategory[]>([]);
  const [tools, setTools] = useState<InspectionTool[]>([]);
  const [overrides, setOverrides] = useState<InspectionToolOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: cats, error: catErr }, { data: tls, error: tlErr }] =
        await Promise.all([
          supabase
            .from("inspection_tool_categories")
            .select("*")
            .order("sort_order", { ascending: true }),
          supabase
            .from("inspection_tools")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
        ]);
      if (catErr) throw catErr;
      if (tlErr) throw tlErr;
      setCategories((cats ?? []) as InspectionToolCategory[]);
      setTools((tls ?? []) as InspectionTool[]);

      if (organization?.id) {
        const { data: ovs } = await supabase
          .from("org_inspection_tool_overrides")
          .select("*")
          .eq("organization_id", organization.id);
        setOverrides((ovs ?? []) as InspectionToolOverride[]);
      } else {
        setOverrides([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inspection tools");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredTools = useMemo(() => {
    const overrideMap = new Map(overrides.map((o) => [o.tool_id, o]));
    return tools.filter((t) => {
      const ov = overrideMap.get(t.id);
      if (!filters.includeHidden && ov?.is_hidden) return false;
      if (filters.categorySlug) {
        const cat = categories.find((c) => c.id === t.category_id);
        if (cat?.slug !== filters.categorySlug) return false;
      }
      if (
        filters.professionTag &&
        !t.profession_tags.includes(filters.professionTag)
      )
        return false;
      if (filters.roleTag && !t.role_tags.includes(filters.roleTag))
        return false;
      return true;
    });
  }, [tools, overrides, categories, filters]);

  return {
    categories,
    tools: filteredTools,
    allTools: tools,
    overrides,
    loading,
    error,
    refresh: fetchAll,
  };
}
