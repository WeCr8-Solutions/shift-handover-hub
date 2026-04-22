/**
 * src/pages/dev/SapSandboxTest.tsx
 *
 * Developer-only test harness for the Phase 1 SAP sandbox connector.
 * Mounted at /dev/sap-test. Gated to platform/developer roles via
 * useAdminAccess — the route itself is not advertised in nav.
 */

import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useOrganization } from "@/hooks/useOrganization";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useSapTestConnection, useSapProductionOrders } from "@/hooks/useSapSandbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlugZap, RefreshCw, ShieldAlert } from "lucide-react";

export default function SapSandboxTest() {
  const { organization } = useOrganization();
  const { hasAdminAccess, hasOrgAdminAccess } = useAdminAccess();
  const [plant, setPlant] = useState("");
  const [fetchEnabled, setFetchEnabled] = useState(false);

  const test = useSapTestConnection(organization?.id);
  const orders = useSapProductionOrders(organization?.id, plant || undefined, fetchEnabled);

  const allowed = hasAdminAccess || hasOrgAdminAccess;

  if (!allowed) {
    return (
      <div className="container max-w-2xl py-10">
        <Card>
          <CardContent className="flex items-center gap-3 py-8">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Developer access required.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <Helmet>
        <title>SAP Sandbox Test · Dev</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div>
        <h1 className="text-2xl font-semibold">SAP Sandbox Connector</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Phase 1 — calls <code>sandbox.api.sap.com</code> via the{" "}
          <code>sap-sync</code> edge function. Read-only.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PlugZap className="h-4 w-4" /> Connection probe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => test.mutate()}
            disabled={test.isPending || !organization?.id}
            size="sm"
          >
            {test.isPending && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
            Test connection
          </Button>
          {test.data && (
            <div className="text-sm">
              <Badge variant={test.data.ok ? "default" : "destructive"}>
                {test.data.ok ? "OK" : "Failed"}
              </Badge>
              {test.data.error && (
                <p className="text-destructive mt-2 font-mono text-xs">
                  {test.data.error.code}: {test.data.error.message}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Production orders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Plant (optional, e.g. 1010)"
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              className="max-w-xs"
            />
            <Button
              size="sm"
              onClick={() => {
                setFetchEnabled(true);
                orders.refetch();
              }}
              disabled={orders.isFetching || !organization?.id}
            >
              {orders.isFetching && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
              Fetch
            </Button>
          </div>

          {orders.error && (
            <p className="text-sm text-destructive">
              {orders.error instanceof Error ? orders.error.message : "Fetch failed"}
            </p>
          )}

          {orders.data && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-2">
                {orders.data.length} order{orders.data.length === 1 ? "" : "s"}
              </p>
              <div className="border rounded-md divide-y max-h-[480px] overflow-auto">
                {orders.data.map((o) => (
                  <div key={o.id} className="p-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{o.workOrder}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {o.partNumber ?? "—"} · {o.description ?? "no description"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Plant {o.plant ?? "—"} · {o.totalQty ?? "?"} {o.unit ?? ""}
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 capitalize">
                      {o.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
                {orders.data.length === 0 && (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No rows returned by sandbox.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
