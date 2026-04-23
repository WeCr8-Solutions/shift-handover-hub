import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HandbookCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_canonical: boolean;
  organization_id: string | null;
}

export interface HandbookReference {
  id: string;
  category_id: string;
  slug: string;
  title: string;
  summary: string | null;
  body_md: string;
  formula: string | null;
  units: string | null;
  source_citation: string | null;
  tags: string[];
  difficulty: string | null;
  is_canonical: boolean;
  organization_id: string | null;
  category?: HandbookCategory;
}

export type HandbookEntityType =
  | "inspection_tool"
  | "machining_operation"
  | "gca_question_bank"
  | "gca_question"
  | "oap_course"
  | "oap_lesson"
  | "oap_quiz_question"
  | "operator_tool";

export function useHandbookCategories() {
  return useQuery({
    queryKey: ["handbook_categories"],
    queryFn: async (): Promise<HandbookCategory[]> => {
      const { data, error } = await supabase
        .from("handbook_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as HandbookCategory[];
    },
  });
}

export function useHandbookReferences(filters?: {
  categorySlug?: string;
  tag?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["handbook_references", filters],
    queryFn: async (): Promise<HandbookReference[]> => {
      let query = supabase
        .from("handbook_references")
        .select("*, category:handbook_categories(*)")
        .order("title", { ascending: true });
      if (filters?.tag) query = query.contains("tags", [filters.tag]);
      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`
        );
      }
      const { data, error } = await query;
      if (error) throw error;
      let rows = (data ?? []) as HandbookReference[];
      if (filters?.categorySlug) {
        rows = rows.filter((r) => r.category?.slug === filters.categorySlug);
      }
      return rows;
    },
  });
}

export function useHandbookReference(slugOrId: string | undefined) {
  return useQuery({
    enabled: !!slugOrId,
    queryKey: ["handbook_reference", slugOrId],
    queryFn: async (): Promise<HandbookReference | null> => {
      if (!slugOrId) return null;
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          slugOrId
        );
      const { data, error } = await supabase
        .from("handbook_references")
        .select("*, category:handbook_categories(*)")
        .eq(isUuid ? "id" : "slug", slugOrId)
        .maybeSingle();
      if (error) throw error;
      return data as HandbookReference | null;
    },
  });
}

export function useHandbookLinksFor(
  entityType: HandbookEntityType,
  entityIdOrKey: string | undefined
) {
  return useQuery({
    enabled: !!entityIdOrKey,
    queryKey: ["handbook_links", entityType, entityIdOrKey],
    queryFn: async (): Promise<HandbookReference[]> => {
      if (!entityIdOrKey) return [];
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          entityIdOrKey
        );
      const { data, error } = await supabase
        .from("handbook_links")
        .select(
          "sort_order, reference:handbook_references(*, category:handbook_categories(*))"
        )
        .eq("entity_type", entityType)
        .eq(isUuid ? "entity_id" : "entity_key", entityIdOrKey)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as Array<{ reference: HandbookReference }>)
        .map((r) => r.reference)
        .filter(Boolean);
    },
  });
}
