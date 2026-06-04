/**
 * OperatorMyNumbers — personal KPI strip for the operator dashboard.
 *
 * Pulls the current user's handoff_records for the last 7 days and surfaces
 * the numbers operators most want to see about themselves:
 *  - Pieces completed (sum of parts_completed_this_shift)
 *  - Handoffs given (count)
 *  - Scrap pieces + scrap %
 *
 * Lightweight, single query, no realtime — refreshes when the operator
 * dashboard remounts or when the user re-checks-in.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, FileText, AlertTriangle, Sparkles } from "lucide-react";

interface MyNumbers {
  piecesCompleted: number;
  handoffsGiven: number;
  scrapPieces: number;
  reworkPieces: number;
  scrapPct: number;
}

export function OperatorMyNumbers() {
  const { user, profile } = useAuth();
  const { organization } = useOrgContext();
  const [data, setData] = useState<MyNumbers | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !organization?.id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: rows } = await supabase
        .from("handoff_records")
        .select("parts_completed_this_shift, scrap_count, rework_count")
        .eq("organization_id", organization.id)
        .eq("outgoing_operator_id", user.id)
        .gte("created_at", since)
        .limit(500);

      if (cancelled) return;

      const list = rows ?? [];
      const piecesCompleted = list.reduce((s, r) => s + (r.parts_completed_this_shift ?? 0), 0);
      const scrapPieces = list.reduce((s, r) => s + (r.scrap_count ?? 0), 0);
      const reworkPieces = list.reduce((s, r) => s + (r.rework_count ?? 0), 0);
      const denom = piecesCompleted + scrapPieces + reworkPieces;
      const scrapPct = denom > 0 ? Math.round((scrapPieces / denom) * 1000) / 10 : 0;

      setData({
        piecesCompleted,
        handoffsGiven: list.length,
        scrapPieces,
        reworkPieces,
        scrapPct,
      });
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, organization?.id]);

  if (!user?.id || !organization?.id) return null;

  const displayName = profile?.display_name?.split(" ")[0] ?? "you";

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 via-card to-card border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">My Numbers — last 7 days</h2>
        </div>
        <span className="text-[11px] text-muted-foreground">Hi, {displayName}</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            label="Pieces"
            value={data?.piecesCompleted ?? 0}
            tone="success"
          />
          <Stat
            icon={<FileText className="w-3.5 h-3.5" />}
            label="Handoffs"
            value={data?.handoffsGiven ?? 0}
            tone="primary"
          />
          <Stat
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            label="Scrap"
            value={data?.scrapPieces ?? 0}
            tone="destructive"
          />
          <Stat
            label="Scrap %"
            value={`${data?.scrapPct ?? 0}%`}
            tone={(data?.scrapPct ?? 0) > 5 ? "destructive" : "muted"}
          />
        </div>
      )}
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon?: React.ReactNode;
  label: string;
  value: number | string;
  tone: "success" | "primary" | "destructive" | "muted";
}) {
  const toneClass = {
    success: "text-[hsl(var(--success))]",
    primary: "text-primary",
    destructive: "text-destructive",
    muted: "text-muted-foreground",
  }[tone];
  return (
    <div className="rounded-md bg-card/60 border border-border/50 p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`text-xl font-bold tabular-nums leading-tight ${toneClass}`}>{value}</div>
    </div>
  );
}
