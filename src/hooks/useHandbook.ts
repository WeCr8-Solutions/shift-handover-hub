import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  getFallbackHandbookCategories,
  getFallbackHandbookLinks,
  getFallbackHandbookReference,
  getFallbackHandbookReferences,
  OPERATOR_TOOL_KEY_ALIASES,
} from "@/lib/handbookFallback";

const HANDBOOK_STALE_TIME = 10 * 60_000;
const HANDBOOK_GC_TIME = 30 * 60_000;

const handbookQueryOptions = {
  staleTime: HANDBOOK_STALE_TIME,
  gcTime: HANDBOOK_GC_TIME,
  refetchOnWindowFocus: false as const,
  refetchOnReconnect: false as const,
};

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
  created_at: string;
  slug: string;
  title: string;
  summary: string | null;
  body_md: string;
  formula: string | null;
  units: string | null;
  source_citation: string | null;
  source_url?: string | null;
  tags: string[];
  difficulty: string | null;
  is_canonical: boolean;
  organization_id: string | null;
  updated_at: string;
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
    ...handbookQueryOptions,
    queryKey: ["handbook_categories"],
    queryFn: async (): Promise<HandbookCategory[]> => {
      const { data, error } = await supabase
        .from("handbook_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) {
        console.warn("Falling back to bundled handbook categories", error.message);
        return getFallbackHandbookCategories();
      }

      const rows = (data as HandbookCategory[] | null) ?? [];
      return rows.length > 0 ? rows : getFallbackHandbookCategories();
    },
  });
}

export function useHandbookReferences(filters?: {
  categorySlug?: string;
  tag?: string;
  search?: string;
}) {
  return useQuery({
    ...handbookQueryOptions,
    placeholderData: (previousData) => previousData,
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
      if (error) {
        console.warn("Falling back to bundled handbook references", error.message);
        return getFallbackHandbookReferences(filters);
      }
      let rows = (data ?? []) as HandbookReference[];
      if (filters?.categorySlug) {
        rows = rows.filter((r) => r.category?.slug === filters.categorySlug);
      }
      return rows.length > 0 ? rows : getFallbackHandbookReferences(filters);
    },
  });
}

export function useHandbookReference(slugOrId: string | undefined) {
  return useQuery({
    ...handbookQueryOptions,
    enabled: !!slugOrId,
    placeholderData: (previousData) => previousData,
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
      if (error) {
        console.warn(`Falling back to bundled handbook reference for ${slugOrId}`, error.message);
        return getFallbackHandbookReference(slugOrId);
      }
      return (data as HandbookReference | null) ?? getFallbackHandbookReference(slugOrId);
    },
  });
}

export function useHandbookLinksFor(
  entityType: HandbookEntityType,
  entityIdOrKey: string | undefined
) {
  return useQuery({
    ...handbookQueryOptions,
    enabled: !!entityIdOrKey,
    placeholderData: (previousData) => previousData,
    queryKey: ["handbook_links", entityType, entityIdOrKey],
    queryFn: async (): Promise<HandbookReference[]> => {
      if (!entityIdOrKey) return [];
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          entityIdOrKey
        );
      const keyAliases = !isUuid && entityType === "operator_tool"
        ? [entityIdOrKey, ...(OPERATOR_TOOL_KEY_ALIASES[entityIdOrKey] ?? [])]
        : [entityIdOrKey];

      let query = supabase
        .from("handbook_links")
        .select(
          "sort_order, reference:handbook_references(*, category:handbook_categories(*))"
        )
        .eq("entity_type", entityType)
        .order("sort_order", { ascending: true });

      query = isUuid
        ? query.eq("entity_id", entityIdOrKey)
        : query.in("entity_key", keyAliases);

      const { data, error } = await query;
      if (error) {
        console.warn(`Falling back to bundled handbook links for ${entityType}:${entityIdOrKey}`, error.message);
        return getFallbackHandbookLinks(entityType, entityIdOrKey);
      }

      const rows = ((data ?? []) as Array<{ reference: HandbookReference }>)
        .map((r) => r.reference)
        .filter(Boolean);

      return rows.length > 0 ? rows : getFallbackHandbookLinks(entityType, entityIdOrKey);
    },
  });
}
