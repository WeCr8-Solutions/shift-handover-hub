import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, Plug, RefreshCw, Factory } from "lucide-react";
import { useERPConnector } from "@/hooks/useERPConnector";
import { Header } from "@/components/Header";
import { format, formatDistanceToNow } from "date-fns";

export default function JobBossIntegration() {
  const { connection, syncLogs, testing, syncing, testConnection, runSync, loading } = useERPConnector();
  const isJobBoss = connection?.erp_vendor === "jobboss";

  return (
    <>
      <Helmet>
        <title>JobBOSS Integration · JobLine.ai</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />
      <main className="container max-w-4xl py-8 space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/settings">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Settings
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Factory className="w-8 h-8 text-primary" /> JobBOSS Integration
          </h1>
          <p className="text-muted-foreground mt-1">
            Sync work orders and routing from your JobBOSS instance into Lovable Cloud (read-only).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>• JobBOSS remains your source of truth for orders, routing, and customer data.</p>
            <p>• JobLine.ai pulls work orders on a configurable interval (default 10 min).</p>
            <p>• Operators interact with synced WOs through JobLine dashboards, handoffs, and station cards.</p>
            <p>• Configure credentials in <Link to="/settings" className="text-primary underline">Settings → Integrations</Link>.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Connection Status</CardTitle>
                <CardDescription>
                  {loading
                    ? "Loading…"
                    : isJobBoss
                      ? `Vendor: JobBOSS · Status: ${connection?.connection_status}`
                      : connection
                        ? `Configured for ${connection.erp_vendor} (not JobBOSS)`
                        : "No ERP connection configured yet."}
                </CardDescription>
              </div>
              {connection && (
                <Badge
                  variant={connection.connection_status === "connected" ? "default" : "secondary"}
                  className={connection.connection_status === "connected" ? "bg-status-ok" : ""}
                >
                  {connection.connection_status === "connected" ? (
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                  ) : (
                    <XCircle className="w-3 h-3 mr-1" />
                  )}
                  {connection.connection_status}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={testConnection} disabled={testing || !isJobBoss}>
              {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plug className="w-4 h-4 mr-2" />}
              Test Connection
            </Button>
            <Button variant="secondary" onClick={() => runSync("incremental")} disabled={syncing || !isJobBoss}>
              {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Dry-Run Sync (incremental)
            </Button>
            {!isJobBoss && (
              <Button variant="outline" asChild>
                <Link to="/settings">Configure JobBOSS in Settings</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sync Activity</CardTitle>
            <CardDescription>Last 5 sync attempts for this organization.</CardDescription>
          </CardHeader>
          <CardContent>
            {syncLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sync runs yet.</p>
            ) : (
              <ul className="space-y-2">
                {syncLogs.slice(0, 5).map((log) => (
                  <li key={log.id} className="rounded-md border bg-card p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">
                        {log.sync_type} · {log.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.started_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fetched {log.records_fetched ?? 0} · Created {log.records_created ?? 0} · Updated{" "}
                      {log.records_updated ?? 0}
                      {log.errors_count ? ` · ${log.errors_count} errors` : ""}
                      {log.duration_ms ? ` · ${log.duration_ms}ms` : ""}
                    </p>
                    {log.completed_at && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {format(new Date(log.completed_at), "PPpp")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
