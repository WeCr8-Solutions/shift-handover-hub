import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface IssueDetailData {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  reporter_display_name: string | null;
  reporter_email: string | null;
  page_url: string | null;
  error_message: string | null;
  error_stack: string | null;
  console_logs: ConsoleLogEntry[];
  metadata: Record<string, unknown> | null;
  user_agent: string | null;
  environment: string | null;
  app_version: string | null;
  build_id: string | null;
  commit_hash: string | null;
  created_at: string;
  organization_id: string | null;
}

export interface ConsoleLogEntry {
  level: "log" | "warn" | "error" | "info" | "debug";
  message: string;
  timestamp: string;
  stack?: string | null;
}

export function useIssueDetail(issueId: string | null) {
  const [issue, setIssue] = useState<IssueDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!issueId) {
      setIssue(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from("issues")
        .select(
          "id, title, description, severity, status, reporter_display_name, reporter_email, page_url, error_message, error_stack, console_logs, metadata, user_agent, environment, app_version, build_id, commit_hash, created_at, organization_id"
        )
        .eq("id", issueId)
        .single();

      if (queryError) throw queryError;

      // Parse console_logs from JSONB safely
      let parsedLogs: ConsoleLogEntry[] = [];
      if (data?.console_logs && Array.isArray(data.console_logs)) {
        parsedLogs = (data.console_logs as unknown[]).map((entry) => {
          if (typeof entry === "object" && entry !== null) {
            const e = entry as Record<string, unknown>;
            return {
              level: (typeof e.level === "string" ? e.level : "log") as ConsoleLogEntry["level"],
              message: typeof e.message === "string" ? e.message : String(e.message ?? ""),
              timestamp: typeof e.timestamp === "string" ? e.timestamp : "",
              stack: typeof e.stack === "string" ? e.stack : null,
            };
          }
          return { level: "log" as const, message: String(entry), timestamp: "", stack: null };
        });
      }

      setIssue({
        ...(data as Omit<IssueDetailData, "console_logs">),
        console_logs: parsedLogs,
        metadata: (data?.metadata as Record<string, unknown>) ?? null,
      });
    } catch (err) {
      console.error("Failed to fetch issue detail:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { issue, loading, error, refetch: fetchDetail };
}
