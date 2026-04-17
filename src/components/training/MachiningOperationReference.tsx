import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrainingMedia } from "./TrainingMedia";
import type { MachiningOperation } from "@/hooks/useMachiningOperations";

interface Props {
  /** Either a slug (e.g. "face-milling") or an operation id */
  reference: string;
  /** When true, hides body & shows only name + primary media */
  compact?: boolean;
  className?: string;
}

/**
 * Inline learner-facing renderer for a machining operation. Drop this into
 * any OAP lesson or GCA test screen by referencing the operation slug or id.
 *
 * Example:
 *   <MachiningOperationReference reference="pocketing" />
 */
export function MachiningOperationReference({
  reference,
  compact,
  className,
}: Props) {
  const [op, setOp] = useState<MachiningOperation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const isUuid = /^[0-9a-f-]{36}$/i.test(reference);
      const query = supabase.from("machining_operations").select("*");
      const { data } = isUuid
        ? await query.eq("id", reference).maybeSingle()
        : await query.eq("slug", reference).maybeSingle();
      if (!cancelled) {
        setOp((data as MachiningOperation) ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (loading) return <Skeleton className={`h-32 w-full ${className ?? ""}`} />;
  if (!op) {
    return (
      <p className={`text-xs text-muted-foreground italic ${className ?? ""}`}>
        Operation "{reference}" not found.
      </p>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-semibold">{op.name}</h4>
          {op.difficulty && (
            <Badge variant="secondary" className="text-[10px]">
              {op.difficulty}
            </Badge>
          )}
          {op.machine_tags.slice(0, 3).map((m) => (
            <Badge key={m} variant="outline" className="text-[10px]">
              {m.replace(/-/g, " ")}
            </Badge>
          ))}
        </div>
        {!compact && op.short_description && (
          <p className="text-xs text-muted-foreground">{op.short_description}</p>
        )}
        <TrainingMedia
          entityType="machining_operation"
          entityId={op.id}
          primaryOnly={compact}
          emptyHint={compact ? undefined : "No media yet."}
        />
        {!compact && op.safety_notes && (
          <p className="text-[11px] text-destructive border-l-2 border-destructive pl-2">
            <strong>Safety:</strong> {op.safety_notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
