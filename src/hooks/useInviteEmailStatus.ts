import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type InviteEmailStatus =
  | "not_sent"
  | "pending"
  | "sent"
  | "failed"
  | "dlq"
  | "bounced"
  | "complained"
  | "suppressed";

export interface InviteEmailRecord {
  email: string;
  status: InviteEmailStatus;
  lastEventAt: string | null;
  errorMessage: string | null;
  suppressed: boolean;
  suppressedReason?: string | null;
}

/**
 * Fetches the latest email_send_log row per recipient (for the claim-account
 * template) plus suppression flags, scoped to a roster of emails.
 */
export function useInviteEmailStatus(engagementId: string | null, emails: string[]) {
  const key = emails.map((e) => e.toLowerCase()).sort().join(",");
  return useQuery({
    queryKey: ["concierge-invite-email-status", engagementId, key],
    enabled: !!engagementId && emails.length > 0,
    queryFn: async (): Promise<Record<string, InviteEmailRecord>> => {
      const normalized = emails.map((e) => e.toLowerCase());

      const [{ data: logs }, { data: supp }] = await Promise.all([
        supabase
          .from("email_send_log")
          .select("recipient_email, status, error_message, created_at, template_name, message_id")
          .eq("template_name", "claim-account")
          .in("recipient_email", normalized)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("suppressed_emails")
          .select("email, reason")
          .in("email", normalized),
      ]);

      const latest = new Map<string, any>();
      for (const row of logs ?? []) {
        const e = (row.recipient_email ?? "").toLowerCase();
        if (!latest.has(e)) latest.set(e, row);
      }
      const suppMap = new Map((supp ?? []).map((s: any) => [s.email.toLowerCase(), s.reason]));

      const out: Record<string, InviteEmailRecord> = {};
      for (const e of normalized) {
        const row = latest.get(e);
        const isSupp = suppMap.has(e);
        out[e] = {
          email: e,
          status: isSupp ? "suppressed" : ((row?.status as InviteEmailStatus) ?? "not_sent"),
          lastEventAt: row?.created_at ?? null,
          errorMessage: row?.error_message ?? null,
          suppressed: isSupp,
          suppressedReason: suppMap.get(e) ?? null,
        };
      }
      return out;
    },
  });
}
