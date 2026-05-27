import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  FileText,
  Download,
  ShieldCheck,
  Loader2,
  ChevronDown,
  Calendar,
  Filter,
  History,
  Workflow,
} from "lucide-react";
import { WorkOrderHistory } from "@/components/admin/WorkOrderHistory";
import { useStations } from "@/hooks/useStations";
import { useOrgContext } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useStationHistory } from "@/hooks/useStationHistory";
import {
  fetchAuditBundle,
  AuditRecordType,
  AuditStandard,
  RECORD_TYPE_LABELS,
  STANDARD_CLAUSES,
} from "@/hooks/useAuditExportBundle";
import {
  exportAuditBundleToExcel,
  exportAuditBundleToCSVZip,
  exportAuditBundleToQuickBooksCSV,
  exportAuditBundleToJSON,
  exportAuditBundleToPDF,
  printAuditBundleHTML,
} from "@/lib/auditHistoryExport";

interface Props {
  isAdmin?: boolean;
}

const ALL_TYPES: AuditRecordType[] = [
  "work_orders",
  "routing",
  "handoffs",
  "downtime",
  "ncrs",
  "quality",
  "queue_changes",
  "station_sessions",
];

function monthBounds(month: string): { from: string; to: string } {
  // month = "YYYY-MM"
  const [y, m] = month.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 0));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

function quickRange(kind: "month" | "30d" | "quarter" | "ytd"): { from: string; to: string; month: string } {
  const now = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  if (kind === "month") {
    const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const { from, to } = monthBounds(month);
    return { from, to, month };
  }
  if (kind === "30d") {
    const from = new Date(now); from.setUTCDate(from.getUTCDate() - 30);
    return { from: iso(from), to: iso(now), month: "last-30d" };
  }
  if (kind === "quarter") {
    const q = Math.floor(now.getUTCMonth() / 3);
    const from = new Date(Date.UTC(now.getUTCFullYear(), q * 3, 1));
    return { from: iso(from), to: iso(now), month: `${now.getUTCFullYear()}-Q${q + 1}` };
  }
  return { from: `${now.getUTCFullYear()}-01-01`, to: iso(now), month: `${now.getUTCFullYear()}-YTD` };
}

export function AuditHistoryCenter({ isAdmin = false }: Props) {
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = (searchParams.get("view") === "stations" ? "stations" : "work-orders") as
    | "work-orders"
    | "stations";
  const [view, setView] = useState<"work-orders" | "stations">(initialView);

  const today = new Date();
  const defaultMonth =
    searchParams.get("month") || `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState<string>(defaultMonth);
  const [range, setRange] = useState<"month" | "30d" | "quarter" | "ytd" | "custom">(
    (searchParams.get("range") as any) || "month"
  );
  const [customFrom, setCustomFrom] = useState<string>(searchParams.get("from") || "");
  const [customTo, setCustomTo] = useState<string>(searchParams.get("to") || "");

  const [standard, setStandard] = useState<AuditStandard>(
    (searchParams.get("std") as AuditStandard) || "AS9100"
  );
  const [stationId, setStationId] = useState<string>(searchParams.get("station") || "all");
  const initialTypes = (searchParams.get("types")?.split(",").filter(Boolean) as AuditRecordType[]) || ALL_TYPES;
  const [types, setTypes] = useState<AuditRecordType[]>(initialTypes);

  const [exporting, setExporting] = useState(false);

  const { data: stations = [] } = useStations(null, organization?.id || null);

  const { from, to } = useMemo(() => {
    if (range === "custom") {
      return { from: customFrom || quickRange("month").from, to: customTo || quickRange("month").to };
    }
    if (range === "month") return monthBounds(month);
    return quickRange(range);
  }, [range, month, customFrom, customTo]);

  const stationFilterId = stationId === "all" ? undefined : stationId;
  const { bundle: stationBundle, loading: stationLoading } = useStationHistory({
    date_from: from,
    date_to: to,
    station_id: stationFilterId,
  });

  function persistParams(patch: Record<string, string | undefined>) {
    const p = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (!v) p.delete(k);
      else p.set(k, v);
    });
    setSearchParams(p, { replace: true });
  }

  function toggleType(t: AuditRecordType) {
    setTypes((prev) => {
      const next = prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t];
      persistParams({ types: next.join(",") });
      return next;
    });
  }

  async function buildBundle() {
    if (!organization?.id) {
      toast.error("No active organization");
      return null;
    }
    if (types.length === 0) {
      toast.error("Select at least one record type");
      return null;
    }
    return fetchAuditBundle({
      organization_id: organization.id,
      organization_name: organization.name || "Organization",
      date_from: from,
      date_to: to,
      month: range === "month" ? month : quickRange(range === "custom" ? "month" : range).month,
      standard,
      record_types: types,
      station_id: stationFilterId,
      generated_by: user?.email || user?.id || "unknown",
    });
  }

  async function withExport(fn: (b: any) => any | Promise<any>, label: string) {
    setExporting(true);
    try {
      const b = await buildBundle();
      if (!b) return;
      await fn(b);
      toast.success(`${label} downloaded`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || `${label} failed`);
    } finally {
      setExporting(false);
    }
  }

  const stdInfo = STANDARD_CLAUSES[standard];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Audit & History Center
              </CardTitle>
              <CardDescription>
                AS9100 / ISO 9001 / ITAR-ready evidence exports — by month, by organization, by record type.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="self-start md:self-center">
              {stdInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Audit standard</Label>
              <Select value={standard} onValueChange={(v) => { setStandard(v as AuditStandard); persistParams({ std: v }); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AS9100">AS9100 Rev D</SelectItem>
                  <SelectItem value="ISO9001">ISO 9001:2015</SelectItem>
                  <SelectItem value="ITAR">ITAR / EAR</SelectItem>
                  <SelectItem value="FDA_QSR">FDA 21 CFR 820</SelectItem>
                  <SelectItem value="CUSTOM">Internal audit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Time range</Label>
              <Select value={range} onValueChange={(v) => { setRange(v as any); persistParams({ range: v }); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Specific month</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="quarter">This quarter</SelectItem>
                  <SelectItem value="ytd">Year to date</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {range === "month" && (
              <div>
                <Label className="text-xs">Month</Label>
                <Input
                  type="month"
                  value={month}
                  onChange={(e) => { setMonth(e.target.value); persistParams({ month: e.target.value }); }}
                />
              </div>
            )}
            {range === "custom" && (
              <>
                <div>
                  <Label className="text-xs">From</Label>
                  <Input type="date" value={customFrom} onChange={(e) => { setCustomFrom(e.target.value); persistParams({ from: e.target.value }); }} />
                </div>
                <div>
                  <Label className="text-xs">To</Label>
                  <Input type="date" value={customTo} onChange={(e) => { setCustomTo(e.target.value); persistParams({ to: e.target.value }); }} />
                </div>
              </>
            )}

            <div>
              <Label className="text-xs">Station</Label>
              <Select value={stationId} onValueChange={(v) => { setStationId(v); persistParams({ station: v === "all" ? undefined : v }); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stations</SelectItem>
                  {stations.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Record types ({types.length}/{ALL_TYPES.length})</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="truncate"><Filter className="w-4 h-4 mr-2 inline" />Selected</span>
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="start">
                  <DropdownMenuLabel>Include in bundle</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ALL_TYPES.map((t) => (
                    <DropdownMenuCheckboxItem
                      key={t}
                      checked={types.includes(t)}
                      onCheckedChange={() => toggleType(t)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {RECORD_TYPE_LABELS[t]}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setTypes(ALL_TYPES); persistParams({ types: ALL_TYPES.join(",") }); }}>
                    Select all
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setTypes([]); persistParams({ types: "" }); }}>
                    Clear
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="md:col-span-2 lg:col-span-2 lg:col-start-3">
              <Label className="text-xs">Export format</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={exporting} className="w-full justify-between">
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>Export bundle</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem onClick={() => withExport(exportAuditBundleToExcel, "Excel bundle")}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel (.xlsx, multi-sheet)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => withExport(exportAuditBundleToCSVZip, "CSV bundle")}>
                    <Download className="w-4 h-4 mr-2" /> CSV bundle (.zip)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => withExport(exportAuditBundleToQuickBooksCSV, "QuickBooks CSV")}>
                    <Download className="w-4 h-4 mr-2" /> QuickBooks CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => withExport(exportAuditBundleToJSON, "JSON bundle")}>
                    <Download className="w-4 h-4 mr-2" /> JSON (eMaint / Greenlight Guru / ETQ ingest)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => withExport(exportAuditBundleToPDF, "PDF summary")}>
                    <FileText className="w-4 h-4 mr-2" /> PDF summary (Docs-ready)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => withExport(printAuditBundleHTML, "Print view")}>
                    <FileText className="w-4 h-4 mr-2" /> Print HTML
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Separator />

          {/* Clause helper strip */}
          {stdInfo.clauses.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <strong>{stdInfo.label} evidence mapped:</strong>{" "}
              {stdInfo.clauses.map((c) => `${c.code} ${c.topic}`).join(" · ")}
            </div>
          )}

          {/* Sub-view */}
          <Tabs
            value={view}
            onValueChange={(v) => { setView(v as any); persistParams({ view: v }); }}
            className="pt-2"
          >
            <TabsList>
              <TabsTrigger value="work-orders" className="gap-2"><History className="w-4 h-4" /> Work Orders</TabsTrigger>
              <TabsTrigger value="stations" className="gap-2"><Workflow className="w-4 h-4" /> Stations & Handoffs</TabsTrigger>
            </TabsList>

            <TabsContent value="work-orders" className="pt-4">
              <WorkOrderHistory isAdmin={isAdmin} showQuickBooksExport />
            </TabsContent>

            <TabsContent value="stations" className="pt-4">
              <StationHistoryPanel
                loading={stationLoading}
                bundle={stationBundle}
                from={from}
                to={to}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function StationHistoryPanel({
  loading,
  bundle,
  from,
  to,
}: {
  loading: boolean;
  bundle: { handoffs: any[]; downtime: any[]; sessions: any[] };
  from: string;
  to: string;
}) {
  const totalDowntime = bundle.downtime.reduce((sum, d) => sum + (d.duration_minutes || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Shift handoffs" value={bundle.handoffs.length} />
        <StatCard label="Downtime events" value={bundle.downtime.length} hint={`${totalDowntime} min total`} />
        <StatCard label="Station sessions" value={bundle.sessions.length} />
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Range: {from} → {to}
          </CardTitle>
          <CardDescription className="text-xs">
            Use the export dropdown above to bundle this with work orders, NCRs, quality inspections, and queue changes
            for an audit-ready package.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading station history…</div>
          ) : (
            <div className="space-y-6 text-sm">
              <HistoryList
                title="Recent shift handoffs"
                rows={bundle.handoffs.slice(0, 15).map((h) => ({
                  primary: `${h.date} · ${h.shift} · WO ${h.work_order} (op ${h.operation_number})`,
                  secondary: `${h.outgoing_operator_name} → ${h.incoming_operator_name} · ${h.station_name || "—"} · ${h.primary_state}`,
                }))}
                emptyText="No handoffs in this period."
              />
              <HistoryList
                title="Recent downtime"
                rows={bundle.downtime.slice(0, 15).map((d) => ({
                  primary: `${new Date(d.started_at).toLocaleString()} · ${d.downtime_type} · ${d.station_name || "—"}`,
                  secondary: `${d.reason_code || "no code"} · ${d.duration_minutes ?? "ongoing"} min · ${d.description || ""}`,
                }))}
                emptyText="No downtime events."
              />
              <HistoryList
                title="Station check-ins"
                rows={bundle.sessions.slice(0, 15).map((s) => ({
                  primary: `${new Date(s.checked_in_at).toLocaleString()} · ${s.shift} shift · ${s.station_name || "—"}`,
                  secondary: s.checked_out_at
                    ? `Checked out ${new Date(s.checked_out_at).toLocaleString()}`
                    : s.is_active
                      ? "Currently active"
                      : "Closed",
                }))}
                emptyText="No sessions in this period."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="p-4 rounded-lg bg-card border border-border">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function HistoryList({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: { primary: string; secondary: string }[];
  emptyText: string;
}) {
  return (
    <div>
      <h4 className="font-semibold mb-2">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
          {rows.map((r, i) => (
            <li key={i} className="px-3 py-2">
              <div className="font-medium">{r.primary}</div>
              <div className="text-xs text-muted-foreground">{r.secondary}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AuditHistoryCenter;
