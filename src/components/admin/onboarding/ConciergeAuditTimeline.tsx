import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AuditRow {
  id: string;
  event_category: string;
  event_action: string;
  target_id: string | null;
  actor_email: string | null;
  reason: string | null;
  new_state: Record<string, unknown> | null;
  previous_state: Record<string, unknown> | null;
  created_at: string;
}

export function ConciergeAuditTimeline({ engagementId }: { engagementId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["concierge-audit", engagementId],
    queryFn: async (): Promise<AuditRow[]> => {
      const { data, error } = await supabase
        .from("admin_audit_events" as any)
        .select("id, event_category, event_action, target_id, actor_email, reason, new_state, previous_state, created_at")
        .eq("target_id", engagementId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as AuditRow[];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="w-4 h-4" /> Activity log
        </CardTitle>
        <CardDescription>Engagement-scoped audit trail (last 50 events).</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : !data || data.length === 0 ? (
          <div className="text-sm text-muted-foreground">No events yet.</div>
        ) : (
          <ScrollArea className="h-72 pr-3">
            <ol className="relative border-l pl-4 space-y-3">
              {data.map((row) => (
                <li key={row.id} className="text-sm">
                  <span className="absolute -left-1.5 mt-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] uppercase">{row.event_category}</Badge>
                    <span className="font-mono text-xs">{row.event_action.replace(/^concierge\./, "")}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(row.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {row.actor_email ?? "system"} {row.reason ? `· ${row.reason}` : ""}
                  </div>
                  {row.new_state && Object.keys(row.new_state).length > 0 && (
                    <pre className="mt-1 text-[10px] bg-muted/40 rounded p-2 overflow-x-auto">
                      {JSON.stringify(row.new_state, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ol>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
