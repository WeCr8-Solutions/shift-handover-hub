import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MachineManual {
  id: string;
  slug: string;
  organization_id: string | null;
  manufacturer: string;
  controller_family: string | null;
  machine_model: string | null;
  manual_type: string;
  title: string;
  edition: string | null;
  language: string;
  source_url: string | null;
  storage_path: string;
  file_size_bytes: number | null;
  page_count: number | null;
  copyright_notice: string;
  tags: string[];
  is_canonical: boolean;
  created_at: string;
}

export function useMachineManuals(filters?: {
  manufacturer?: string;
  manualType?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["machine-manuals", filters],
    queryFn: async () => {
      let q = supabase
        .from("machine_manuals")
        .select("*")
        .order("manufacturer", { ascending: true })
        .order("title", { ascending: true });
      if (filters?.manufacturer) q = q.eq("manufacturer", filters.manufacturer);
      if (filters?.manualType) q = q.eq("manual_type", filters.manualType);
      if (filters?.search && filters.search.length >= 2) {
        q = q.or(
          `title.ilike.%${filters.search}%,machine_model.ilike.%${filters.search}%,controller_family.ilike.%${filters.search}%`,
        );
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as MachineManual[];
    },
  });
}

export function useMachineManual(slug: string | undefined) {
  return useQuery({
    queryKey: ["machine-manual", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machine_manuals")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data as MachineManual | null;
    },
  });
}

export function useManualSignedUrl(storagePath: string | undefined) {
  return useQuery({
    queryKey: ["machine-manual-url", storagePath],
    enabled: !!storagePath,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("machine-manuals")
        .createSignedUrl(storagePath!, 60 * 60);
      if (error) throw error;
      return data?.signedUrl || null;
    },
  });
}

export function useManualPageSearch(manualId: string | undefined, query: string) {
  return useQuery({
    queryKey: ["manual-page-search", manualId, query],
    enabled: !!manualId && query.length >= 3,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machine_manual_pages")
        .select("page_number, text_content")
        .eq("manual_id", manualId!)
        .textSearch("search_vector", query, { type: "websearch", config: "english" })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });
}
