import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MyIssue {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  page_url: string | null;
  created_at: string;
  resolved_at: string | null;
  dev_queue: {
    status: string;
    assigned_developer_name: string | null;
    notes: string | null;
  } | null;
}

export function useMyIssues() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<MyIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchIssues = useCallback(async () => {
    if (!user) {
      setIssues([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from("issues")
        .select(`
          id, title, description, severity, status, page_url, created_at, resolved_at,
          dev_issue_queue (status, assigned_developer_name, notes)
        `)
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (queryError) throw queryError;

      const mapped: MyIssue[] = (data || []).map((row) => {
        const devQueue = Array.isArray(row.dev_issue_queue)
          ? row.dev_issue_queue[0] ?? null
          : row.dev_issue_queue ?? null;

        return {
          id: row.id,
          title: row.title,
          description: row.description,
          severity: row.severity,
          status: row.status,
          page_url: row.page_url,
          created_at: row.created_at,
          resolved_at: row.resolved_at,
          dev_queue: devQueue
            ? {
                status: devQueue.status,
                assigned_developer_name: devQueue.assigned_developer_name,
                notes: devQueue.notes,
              }
            : null,
        };
      });

      setIssues(mapped);
    } catch (err) {
      console.error("Failed to fetch my issues:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  return { issues, loading, error, refetch: fetchIssues };
}
