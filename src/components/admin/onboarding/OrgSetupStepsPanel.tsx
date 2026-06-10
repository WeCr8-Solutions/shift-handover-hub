import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ListChecks, Loader2 } from "lucide-react";
import { useOrgSetupSteps } from "@/hooks/useOrgProfileAdmin";

interface Props { organizationId: string | null }

export function OrgSetupStepsPanel({ organizationId }: Props) {
  const { query, set, knownSteps } = useOrgSetupSteps(organizationId);
  const { map = new Map(), rows = [] } = query.data ?? {};
  const extraSteps = rows.map((r) => r.step).filter((s) => !knownSteps.includes(s));
  const all = [...knownSteps, ...extraSteps];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="w-4 h-4" /> Organization setup steps
          <Badge variant="secondary" className="text-[10px]">{rows.length}/{all.length}</Badge>
        </CardTitle>
        <CardDescription>
          Mark setup steps complete on behalf of the customer so the readiness gate clears without forcing them to click through the welcome modal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading…
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-2">
          {all.map((step) => {
            const row = map.get(step);
            const done = !!row;
            return (
              <div key={step} className="flex items-center justify-between border rounded-md px-3 py-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={done}
                    onCheckedChange={(v) => set.mutate({ step, completed: !!v })}
                    disabled={set.isPending}
                  />
                  <span className="text-xs capitalize">{step.replace(/_/g, " ")}</span>
                </div>
                {done && (
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(row!.completed_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm" variant="outline"
            onClick={() => knownSteps.forEach((s) => set.mutate({ step: s, completed: true }))}
            disabled={set.isPending}
          >Mark all complete</Button>
          <Button
            size="sm" variant="ghost"
            onClick={() => rows.forEach((r) => set.mutate({ step: r.step, completed: false }))}
            disabled={set.isPending || rows.length === 0}
          >Clear all</Button>
        </div>
      </CardContent>
    </Card>
  );
}
