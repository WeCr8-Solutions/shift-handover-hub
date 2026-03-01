import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserOrganization } from "./useUserOrganization";
import type { Json } from "@/integrations/supabase/types";

export type DataAccessOperation = "READ" | "WRITE" | "DELETE" | "EXPORT";

export interface DataAccessLogEntry {
  tableName: string;
  recordId?: string;
  operation: DataAccessOperation;
  metadata?: Record<string, Json>;
}

/**
 * Logs data access events to the data_access_logs table for ITAR audit trail.
 *
 * Usage:
 *   const { logAccess } = useDataAccessLog();
 *   await logAccess({ tableName: 'queue_items', recordId: item.id, operation: 'READ' });
 */
export function useDataAccessLog() {
  const { user, profile } = useAuth();
  const { organization } = useUserOrganization();

  const logAccess = useCallback(
    async (entry: DataAccessLogEntry): Promise<void> => {
      if (!user) return;

      try {
        await supabase.from("data_access_logs").insert({
          user_id: user.id,
          organization_id: organization?.id ?? null,
          table_name: entry.tableName,
          record_id: entry.recordId ?? null,
          operation: entry.operation,
          user_display_name: profile?.display_name ?? null,
          user_email: user.email ?? null,
          metadata: (entry.metadata ?? null) as Json,
        });
      } catch (err) {
        // Data access logging is non-blocking — never throw errors that would
        // interrupt the user's workflow. Log to console only.
        console.warn("[useDataAccessLog] Failed to write audit log:", err);
      }
    },
    [user, profile, organization]
  );

  /**
   * Log multiple records accessed in a single bulk operation (e.g., list views).
   * Creates a single log entry with count in metadata rather than N entries.
   */
  const logBulkAccess = useCallback(
    async (tableName: string, count: number, operation: DataAccessOperation = "READ"): Promise<void> => {
      if (!user) return;
      await logAccess({
        tableName,
        operation,
        metadata: { record_count: count, bulk: true },
      });
    },
    [user, logAccess]
  );

  return { logAccess, logBulkAccess };
}
