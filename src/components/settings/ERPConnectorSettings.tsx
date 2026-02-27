import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Loader2, Plug, RefreshCw, Zap, CheckCircle2, XCircle, Clock, AlertTriangle, Trash2, Plus, Sparkles, CreditCard } from "lucide-react";
import { useERPConnector } from "@/hooks/useERPConnector";
import { useStations } from "@/hooks/useStations";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useSubscription, ERP_ADDON_TIERS } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";

const ERP_VENDORS = [
  { value: "jobboss", label: "JobBOSS" },
  { value: "epicor", label: "Epicor" },
  { value: "plex", label: "Plex" },
  { value: "proshop", label: "ProShop" },
  { value: "e2", label: "E2 Shop System" },
  { value: "other", label: "Other" },
];

const JOBLINE_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "queued", label: "Queued" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const SYNC_INTERVALS = [
  { value: 5, label: "Every 5 minutes" },
  { value: 10, label: "Every 10 minutes" },
  { value: 15, label: "Every 15 minutes" },
  { value: 30, label: "Every 30 minutes" },
  { value: 60, label: "Every 60 minutes" },
];

function ConnectionStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "connected":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Connected</Badge>;
    case "error":
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
    default:
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  }
}

export function ERPConnectorSettings() {
  const {
    connection, syncLogs, workCenterMappings, statusMappings,
    loading, syncing, testing,
    saveConnection, testConnection, runSync,
    updateWorkCenterMapping, saveStatusMapping, deleteStatusMapping,
  } = useERPConnector();
  const { currentTeam } = useCurrentTeam();
  const { organization } = useUserOrganization();
  const { stations } = useStations(currentTeam?.id, organization?.id);
  const { features, plan } = useEntitlements();
  const { createCheckout } = useSubscription();

  // ERP usage metering state
  const [erpUsage, setErpUsage] = useState<{ sync_count: number; sync_limit: number; erp_tier: string } | null>(null);

  const erpTier = (features as Record<string, unknown>)?.erp_tier as string | undefined;
  const hasErpAddon = erpTier && erpTier !== 'none' && erpTier !== undefined;
  const isEnterprise = plan === 'enterprise';

  useEffect(() => {
    if (!organization?.id) return;
    supabase
      .from("erp_usage_metering")
      .select("sync_count")
      .eq("organization_id", organization.id)
      .eq("period_start", new Date().toISOString().slice(0, 7) + "-01")
      .maybeSingle()
      .then(({ data }) => {
        const tierConfig = erpTier ? ERP_ADDON_TIERS[erpTier as keyof typeof ERP_ADDON_TIERS] : null;
        setErpUsage({
          sync_count: data?.sync_count ?? 0,
          sync_limit: tierConfig?.syncLimit ?? 0,
          erp_tier: erpTier ?? 'none',
        });
      });
  }, [organization?.id, erpTier]);

  // Connection form state
  const [vendor, setVendor] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [oauthEndpoint, setOauthEndpoint] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [scopes, setScopes] = useState("read-only");
  const [tenantId, setTenantId] = useState("");
  const [syncInterval, setSyncInterval] = useState(10);
  const [isActive, setIsActive] = useState(false);

  // Status mapping form
  const [newErpStatus, setNewErpStatus] = useState("");
  const [newJoblineStatus, setNewJoblineStatus] = useState("pending");

  useEffect(() => {
    if (connection) {
      setVendor(connection.erp_vendor);
      setApiBaseUrl(connection.api_base_url || "");
      setOauthEndpoint(connection.oauth_token_endpoint || "");
      setClientId(connection.client_id_encrypted || "");
      setScopes(connection.scopes || "read-only");
      setTenantId(connection.tenant_identifier || "");
      setSyncInterval(connection.sync_interval_minutes);
      setIsActive(connection.is_active);
      // Don't populate secret on load
    }
  }, [connection]);

  const handleSaveConnection = async () => {
    const result = await saveConnection({
      erp_vendor: vendor,
      api_base_url: apiBaseUrl || null,
      oauth_token_endpoint: oauthEndpoint || null,
      client_id_encrypted: clientId || null,
      client_secret_encrypted: clientSecret || null,
      scopes: scopes || null,
      tenant_identifier: tenantId || null,
      sync_interval_minutes: syncInterval,
      is_active: isActive,
    });
    if (result.error) return;
    setClientSecret(""); // Clear secret after save
  };

  const handleAddStatusMapping = async () => {
    if (!newErpStatus.trim()) return;
    await saveStatusMapping(newErpStatus.trim(), newJoblineStatus);
    setNewErpStatus("");
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  const lastSync = syncLogs[0];

  return (
    <div className="space-y-6">
      {/* Enterprise plan gate */}
      {!isEnterprise ? (
        <Card className="border-dashed border-amber-500/30 bg-amber-500/5">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <CardTitle className="text-xl">Enterprise Plan Required</CardTitle>
            <CardDescription>
              The ERP Connector is exclusively available to Enterprise plan subscribers.
              Upgrade your organization to Enterprise to unlock ERP integration.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => createCheckout("price_1SthDUCyekafHX78MIJEHfCG")} className="gap-2">
              <CreditCard className="w-4 h-4" />
              Upgrade to Enterprise — $49.99/mo
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Enterprise includes 10 users, API access, and eligibility for ERP Connector add-ons ($100–$200/mo).
            </p>
          </CardContent>
        </Card>
      ) : !hasErpAddon ? (
        <Card className="border-dashed border-primary/30 bg-primary/5">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Plug className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Choose Your ERP Connector Plan</CardTitle>
            <CardDescription>Select a tier to enable ERP integration for your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.entries(ERP_ADDON_TIERS) as [string, typeof ERP_ADDON_TIERS[keyof typeof ERP_ADDON_TIERS]][]).map(([key, tier]) => (
                <Card key={key} className="relative border hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                    <div className="text-2xl font-bold text-primary">${tier.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="text-sm space-y-1.5">
                      {tier.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full gap-2" onClick={() => createCheckout(tier.priceId)}>
                      <CreditCard className="w-4 h-4" />
                      Subscribe - ${tier.price}/mo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              ERP Connector is an add-on available exclusively for Enterprise plan subscribers. Billed separately from your base subscription.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  ERP Connector — {ERP_ADDON_TIERS[erpTier as keyof typeof ERP_ADDON_TIERS]?.name ?? erpTier}
                </CardTitle>
                <CardDescription>
                  ${ERP_ADDON_TIERS[erpTier as keyof typeof ERP_ADDON_TIERS]?.price ?? '?'}/mo add-on
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-primary text-primary">Active</Badge>
            </div>
          </CardHeader>
          {erpUsage && erpUsage.sync_limit > 0 && (
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Syncs this month</span>
                  <span className="font-medium">{erpUsage.sync_count} / {erpUsage.sync_limit}</span>
                </div>
                <Progress value={Math.min((erpUsage.sync_count / erpUsage.sync_limit) * 100, 100)} />
                {erpUsage.sync_count >= erpUsage.sync_limit * 0.8 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Approaching sync limit — consider upgrading your ERP tier
                  </p>
                )}
              </div>
            </CardContent>
          )}
          {erpUsage && erpUsage.sync_limit === -1 && (
            <CardContent>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Syncs this month</span>
                <span className="font-medium">{erpUsage.sync_count} (Unlimited)</span>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Connection Setup */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Plug className="w-5 h-5" />ERP Connection</CardTitle>
              <CardDescription>Connect your cloud ERP system for read-only work order sync</CardDescription>
            </div>
            {connection && <ConnectionStatusBadge status={connection.connection_status} />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ERP Vendor</Label>
              <Select value={vendor} onValueChange={setVendor}>
                <SelectTrigger><SelectValue placeholder="Select ERP vendor" /></SelectTrigger>
                <SelectContent>
                  {ERP_VENDORS.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>API Base URL</Label>
              <Input value={apiBaseUrl} onChange={e => setApiBaseUrl(e.target.value)} placeholder="https://your-erp.example.com" />
            </div>
            <div className="space-y-2">
              <Label>OAuth Token Endpoint</Label>
              <Input value={oauthEndpoint} onChange={e => setOauthEndpoint(e.target.value)} placeholder="https://auth.erp.com/oauth/token" />
            </div>
            <div className="space-y-2">
              <Label>Tenant / Org ID</Label>
              <Input value={tenantId} onChange={e => setTenantId(e.target.value)} placeholder="Optional tenant identifier" />
            </div>
            <div className="space-y-2">
              <Label>Client ID</Label>
              <Input value={clientId} onChange={e => setClientId(e.target.value)} placeholder="OAuth client ID" />
            </div>
            <div className="space-y-2">
              <Label>Client Secret</Label>
              <Input type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder={connection ? "••••••• (unchanged)" : "OAuth client secret"} />
            </div>
            <div className="space-y-2">
              <Label>Scopes</Label>
              <Input value={scopes} onChange={e => setScopes(e.target.value)} placeholder="read-only" />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Button onClick={handleSaveConnection} disabled={!vendor}>Save Connection</Button>
            <Button variant="outline" onClick={testConnection} disabled={testing || !connection}>
              {testing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Testing...</> : <><Zap className="w-4 h-4 mr-2" />Test Connection</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync Configuration */}
      {connection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RefreshCw className="w-5 h-5" />Sync Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch checked={isActive} onCheckedChange={async (v) => { setIsActive(v); await saveConnection({ is_active: v }); }} />
                <Label>Enable automatic sync</Label>
              </div>
              <Select value={String(syncInterval)} onValueChange={async (v) => { setSyncInterval(Number(v)); await saveConnection({ sync_interval_minutes: Number(v) }); }}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SYNC_INTERVALS.map(i => <SelectItem key={i.value} value={String(i.value)}>{i.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                {lastSync ? (
                  <p className="text-sm text-muted-foreground">
                    Last sync: {formatDistanceToNow(new Date(lastSync.started_at), { addSuffix: true })} —{" "}
                    <span className={lastSync.status === "success" ? "text-green-600" : lastSync.status === "failed" ? "text-red-600" : "text-yellow-600"}>
                      {lastSync.status}
                    </span>
                    {lastSync.records_fetched != null && ` (${lastSync.records_fetched} records)`}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No sync history yet</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => runSync("incremental")} disabled={syncing}>
                  {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Incremental Sync
                </Button>
                <Button variant="outline" size="sm" onClick={() => runSync("full")} disabled={syncing}>
                  Full Sync
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Center Mapping */}
      {workCenterMappings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Work Center Mapping</CardTitle>
            <CardDescription>Map ERP work centers to JobLine stations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ERP Work Center</TableHead>
                  <TableHead>ERP ID</TableHead>
                  <TableHead>JobLine Station</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workCenterMappings.map(wc => (
                  <TableRow key={wc.id} className={!wc.jobline_station_id ? "bg-yellow-50/50 dark:bg-yellow-900/10" : ""}>
                    <TableCell className="font-medium">
                      {wc.erp_work_center_name || "—"}
                      {!wc.jobline_station_id && <AlertTriangle className="w-3 h-3 text-yellow-500 inline ml-1" />}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">{wc.erp_work_center_id}</TableCell>
                    <TableCell>
                      <Select
                        value={wc.jobline_station_id || "none"}
                        onValueChange={(v) => updateWorkCenterMapping(wc.id, v === "none" ? null : v)}
                      >
                        <SelectTrigger className="w-48"><SelectValue placeholder="Select station" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Unmapped —</SelectItem>
                          {stations.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Status Mapping */}
      <Card>
        <CardHeader>
          <CardTitle>Status Mapping</CardTitle>
          <CardDescription>Map ERP statuses to JobLine workflow states</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusMappings.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ERP Status</TableHead>
                  <TableHead>JobLine Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusMappings.map(sm => (
                  <TableRow key={sm.id}>
                    <TableCell className="font-mono text-sm">{sm.erp_status}</TableCell>
                    <TableCell>
                      <Select value={sm.jobline_status} onValueChange={(v) => saveStatusMapping(sm.erp_status, v)}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {JOBLINE_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteStatusMapping(sm.id)}>
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex items-center gap-2">
            <Input value={newErpStatus} onChange={e => setNewErpStatus(e.target.value)} placeholder="ERP status value" className="flex-1" />
            <Select value={newJoblineStatus} onValueChange={setNewJoblineStatus}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {JOBLINE_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleAddStatusMapping} disabled={!newErpStatus.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync History */}
      {syncLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sync History</CardTitle>
            <CardDescription>Last 20 sync runs</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {syncLogs.map(log => (
                <AccordionItem key={log.id} value={log.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-sm w-full pr-4">
                      <Badge variant={log.status === "success" ? "default" : log.status === "failed" ? "destructive" : "secondary"} className="text-xs">
                        {log.status}
                      </Badge>
                      <span className="text-muted-foreground">{format(new Date(log.started_at), "MMM d, HH:mm")}</span>
                      <span className="text-xs text-muted-foreground">{log.sync_type}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {log.records_fetched ?? 0} fetched · {log.records_created ?? 0} new · {log.records_updated ?? 0} updated
                        {(log.errors_count ?? 0) > 0 && <span className="text-red-500 ml-1">· {log.errors_count} errors</span>}
                        {log.duration_ms != null && <span className="ml-1">· {(log.duration_ms / 1000).toFixed(1)}s</span>}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {log.error_details ? (
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-40">
                        {JSON.stringify(log.error_details, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-muted-foreground">No errors recorded</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
