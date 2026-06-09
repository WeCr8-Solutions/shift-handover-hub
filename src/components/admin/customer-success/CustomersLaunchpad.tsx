import { useMemo, useState } from "react";
import { useUrlState } from "@/hooks/useUrlState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ShieldAlert, ExternalLink } from "lucide-react";
import { useAdminCustomers, setupPathLabel, type SetupPath } from "@/hooks/useAdminCustomers";

type Filter = "all" | SetupPath | "itar";

const PATH_VARIANT: Record<SetupPath, "default" | "secondary" | "outline" | "destructive"> = {
  concierge: "default",
  concierge_unpaid: "destructive",
  complimentary: "secondary",
  self_serve: "outline",
};

export function CustomersLaunchpad({
  onOpenConcierge,
  onOpenSelfServe,
}: {
  onOpenConcierge: (engagementId: string) => void;
  onOpenSelfServe: (organizationId: string) => void;
}) {
  const { data, isLoading } = useAdminCustomers();
  const [q, setQ] = useState("");  const [filter, setFilter] = useUrlState<Filter>("f", "all");

  const rows = useMemo(() => {
    const list = data ?? [];
    return list.filter((r) => {
      if (filter === "itar" && !r.itar) return false;
      if (filter !== "all" && filter !== "itar" && r.setup_path !== filter) return false;
      if (q && !r.organization_name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [data, q, filter]);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div>
          <CardTitle>Customers</CardTitle>
          <CardDescription>
            Every organization on the platform. Concierge = paid setup assistance. Self-serve = signed up and
            running their own checklist. Jump in to assist any account.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search by org name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-xs"
          />
          <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All setup paths</SelectItem>
              <SelectItem value="concierge">Concierge</SelectItem>
              <SelectItem value="concierge_unpaid">Concierge (unpaid)</SelectItem>
              <SelectItem value="self_serve">Self-serve</SelectItem>
              <SelectItem value="complimentary">Complimentary</SelectItem>
              <SelectItem value="itar">ITAR only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : !rows.length ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No matching organizations.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Setup path</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead className="w-40">Progress</TableHead>
                  <TableHead>Signed up</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.organization_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {r.organization_name}
                        {r.itar && (
                          <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
                            <ShieldAlert className="w-3 h-3" /> ITAR
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={PATH_VARIANT[r.setup_path]} className="capitalize">
                        {setupPathLabel(r.setup_path)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="capitalize">{r.subscription_tier ?? "—"}</span>
                      <span className="text-muted-foreground"> · {r.subscription_status ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      {r.engagement_id ? (
                        <div className="flex items-center gap-2">
                          <Progress value={r.engagement_percent ?? 0} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-8">
                            {r.engagement_percent ?? 0}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() =>
                          r.engagement_id
                            ? onOpenConcierge(r.engagement_id)
                            : onOpenSelfServe(r.organization_id)
                        }
                      >
                        <ExternalLink className="w-3 h-3" /> Assist setup
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
