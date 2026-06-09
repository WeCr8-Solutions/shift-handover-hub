/**
 * ConciergeActivityLogPanel — read-only audit feed of every setup/concierge
 * action taken on the active organization. Visible to owners/admins only.
 * Powers QA, continuous improvement, and ITAR audit traceability.
 */
import { useEffect, useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { formatDistanceToNow } from "date-fns";

interface Row {
  id: string;
  action: string;
  summary: string | null;
  actor_role: string | null;
  created_at: string;
}

export function ConciergeActivityLogPanel({ limit = 25 }: { limit?: number }) {
  const { organization, organizationRole } = useOrganization();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization) return;
    setLoading(true);
    (supabase.from("concierge_activity_log") as any)
      .select("id, action, summary, actor_role, created_at")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data }: any) => {
        setRows((data ?? []) as Row[]);
        setLoading(false);
      });
  }, [organization, limit]);

  if (!organization || (organizationRole !== "owner" && organizationRole !== "admin")) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-4 h-4 text-primary" /> Setup & concierge activity
        </CardTitle>
        <CardDescription>
          Audit trail of every change made during setup and concierge — for quality
          assurance and continuous improvement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading activity…
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No activity logged yet.
          </p>
        ) : (
          <ScrollArea className="max-h-[360px] pr-2">
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r.id} className="flex items-start gap-3 border rounded-md p-2.5">
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {r.actor_role ?? "system"}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {r.summary ?? r.action}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.action} ·{" "}
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
