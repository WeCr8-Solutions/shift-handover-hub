import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert } from "lucide-react";
import { useAdminCustomers, setupPathLabel } from "@/hooks/useAdminCustomers";

export function SelfServeList({
  onAssist,
}: {
  onAssist: (organizationId: string) => void;
}) {
  const { data, isLoading } = useAdminCustomers();
  const rows = useMemo(
    () => (data ?? []).filter((r) => r.setup_path === "self_serve" || r.setup_path === "complimentary"),
    [data],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Self-serve & complimentary accounts</CardTitle>
        <CardDescription>
          Organizations setting themselves up — no paid concierge engagement. Use Assist to step in without
          creating billing artifacts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : !rows.length ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No self-serve accounts right now.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Trial ends</TableHead>
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
                      <Badge variant="outline">{setupPathLabel(r.setup_path)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {r.subscription_tier ?? "—"}{" "}
                      <span className="text-muted-foreground">· {r.subscription_status ?? "—"}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.trial_ends_at ? new Date(r.trial_ends_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => onAssist(r.organization_id)}>
                        Assist setup
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
