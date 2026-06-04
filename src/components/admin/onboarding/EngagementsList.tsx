import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ShieldAlert } from "lucide-react";
import { useEngagementsList, type Engagement } from "@/hooks/useOnboardingEngagements";
import { NewEngagementDialog } from "./NewEngagementDialog";
import { EngagementDetail } from "./EngagementDetail";

const STATUS_VARIANT: Record<Engagement["status"], "default" | "secondary" | "outline" | "destructive"> = {
  intake: "outline",
  in_progress: "default",
  review: "secondary",
  ready_for_production: "default",
  live: "secondary",
  cancelled: "destructive",
};

export function EngagementsList() {
  const { data, isLoading } = useEngagementsList();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  if (selected) {
    return <EngagementDetail engagementId={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Onboarding Services</CardTitle>
            <CardDescription>
              Concierge customer onboarding — equipment, users, roles, routing, documents, and handoff.
            </CardDescription>
          </div>
          <Button onClick={() => setCreating(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New engagement
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !data?.length ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No engagements yet. Start one when JobLine is taking on a new customer setup.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-48">Progress</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>ITAR</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((e) => (
                  <TableRow key={e.id} className="cursor-pointer" onClick={() => setSelected(e.id)}>
                    <TableCell className="font-medium">{e.organizations?.name ?? e.organization_id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[e.status]} className="capitalize">
                        {e.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={e.percent_complete} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-8">{e.percent_complete}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-sm">{e.plan_tier}</TableCell>
                    <TableCell>
                      {e.organizations?.requires_us_person_declaration ? (
                        <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
                          <ShieldAlert className="w-3 h-3" /> ITAR
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(e.started_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={(ev) => { ev.stopPropagation(); setSelected(e.id); }}>
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NewEngagementDialog open={creating} onOpenChange={setCreating} onCreated={(id) => setSelected(id)} />
    </>
  );
}
