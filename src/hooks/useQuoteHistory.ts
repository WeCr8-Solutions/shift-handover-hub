import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { QueueItem } from "@/hooks/useQueue";

export interface QuoteWithLinkedData extends QueueItem {
  station_name?: string;
  team_name?: string;
}

export interface QuoteHistoryFilters {
  search?: string;
  quote_number?: string;
  part_number?: string;
  date_from?: string;
  date_to?: string;
  status?: string[];
}

export function useQuoteHistory(filters?: QuoteHistoryFilters) {
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const [quotes, setQuotes] = useState<QuoteWithLinkedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    if (!user || !organization?.id) {
      setQuotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("queue_items")
        .select(`
          *,
          stations:station_id (name),
          teams:team_id (name)
        `)
        .eq("organization_id", organization.id)
        .eq("item_type", "quote")
        .order("updated_at", { ascending: false });

      if (filters?.status && filters.status.length > 0) {
        query = query.in("status", filters.status as ("cancelled" | "completed" | "in_progress" | "on_hold" | "pending" | "queued")[]);
      } else {
        query = query.in("status", ["completed", "cancelled"] as const);
      }

      if (filters?.quote_number) {
        query = query.ilike("work_order", `%${filters.quote_number}%`);
      }

      if (filters?.part_number) {
        query = query.ilike("part_number", `%${filters.part_number}%`);
      }

      if (filters?.search) {
        query = query.or(`work_order.ilike.%${filters.search}%,part_number.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
      }

      if (filters?.date_from) {
        query = query.gte("completed_at", filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte("completed_at", filters.date_to);
      }

      const { data, error: fetchError } = await query.limit(100);

      if (fetchError) throw fetchError;

      const transformed: QuoteWithLinkedData[] = (data || []).map((item: any) => ({
        ...item,
        station_name: item.stations?.name || null,
        team_name: item.teams?.name || null,
      }));

      setQuotes(transformed);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching quote history:", err);
    }

    setLoading(false);
  }, [user, organization?.id, filters?.search, filters?.quote_number, filters?.part_number, filters?.date_from, filters?.date_to, filters?.status]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  return {
    quotes,
    loading,
    error,
    fetchQuotes,
  };
}
