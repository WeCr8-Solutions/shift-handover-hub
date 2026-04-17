import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrainingMedia } from "./TrainingMedia";
import type { InspectionTool } from "@/hooks/useInspectionTools";

interface Props {
  /** Either a slug (e.g. "digital-caliper") or an inspection_tool id */
  reference: string;
  compact?: boolean;
  className?: string;
}

/**
 * Inline learner-facing renderer for an inspection tool. Drop into any OAP
 * lesson, GCA question, or quiz screen by referencing the tool slug.
 *
 * Example:
 *   <InspectionToolReference reference="digital-caliper" />
 */
export function InspectionToolReference({ reference, compact, className }: Props) {
  const [tool, setTool] = useState<InspectionTool | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const isUuid = /^[0-9a-f-]{36}$/i.test(reference);
      const query = supabase.from("inspection_tools").select("*");
      const { data } = isUuid
        ? await query.eq("id", reference).maybeSingle()
        : await query.eq("slug", reference).maybeSingle();
      if (!cancelled) {
        setTool((data as InspectionTool) ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (loading) return <Skeleton className={`h-32 w-full ${className ?? ""}`} />;
  if (!tool) {
    return (
      <p className={`text-xs text-muted-foreground italic ${className ?? ""}`}>
        Inspection tool "{reference}" not found.
      </p>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-semibold">{tool.name}</h4>
          {tool.difficulty && (
            <Badge variant="secondary" className="text-[10px]">
              {tool.difficulty}
            </Badge>
          )}
          {tool.precision_spec && (
            <Badge variant="outline" className="text-[10px]">
              {tool.precision_spec}
            </Badge>
          )}
        </div>
        {!compact && tool.description && (
          <p className="text-xs text-muted-foreground">{tool.description}</p>
        )}
        {!compact && tool.typical_use && (
          <p className="text-[11px] text-muted-foreground">
            <strong>Typical use:</strong> {tool.typical_use}
          </p>
        )}
        <TrainingMedia
          entityType="inspection_tool"
          entityId={tool.id}
          primaryOnly={compact}
          emptyHint={compact ? undefined : "No media yet."}
        />
        {!compact && tool.safety_notes && (
          <p className="text-[11px] text-destructive border-l-2 border-destructive pl-2">
            <strong>Safety:</strong> {tool.safety_notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
