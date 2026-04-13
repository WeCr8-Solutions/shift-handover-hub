import { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Map,
  QrCode,
  ClipboardList,
  BarChart2,
  Download,
  Copy,
  Check,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Users,
  Link,
  XCircle,
} from "lucide-react";
import { FLYER_ZONES, exportZonesToCsv, type FlyerZone } from "./flyerZoneData";
import { FieldChecklist } from "./FieldChecklist";
import { ContactsExportTab } from "./ContactsExportTab";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DbZone {
  id: string;
  zone_number: number;
  zone_name: string;
  city: string;
  utm_content: string;
  full_utm_url: string;
  bitly_short_url: string | null;
  qr_filename: string | null;
  status: string;
  flyer_count: number;
  total_scans: number;
  total_signups: number;
  total_hires: number;
  notes: string | null;
}

interface DbDropLog {
  id: string;
  zone_id: string;
  dropped_at: string;
  flyer_count: number;
  business_count: number;
  notes: string | null;
  zone_name?: string;
}

interface ResultsRow {
  zone_id: string;
  scans: number;
  signups: number;
  hires: number;
}

interface DbAssignment {
  id: string;
  assignee_name: string;
  assignee_email: string | null;
  zone_numbers: number[];
  invite_token: string;
  assigned_to_user_id: string | null;
  is_active: boolean;
  created_at: string;
}

// ─── Status badge ──────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending:  "outline",
  printed:  "secondary",
  dropped:  "default",
  active:   "default",
  complete: "secondary",
};

const STATUS_COLOR: Record<string, string> = {
  pending:  "text-muted-foreground",
  printed:  "text-yellow-600 dark:text-yellow-400",
  dropped:  "text-blue-600 dark:text-blue-400",
  active:   "text-green-600 dark:text-green-400",
  complete: "text-muted-foreground",
};

function ZoneStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "outline"} className={`capitalize text-xs ${STATUS_COLOR[status] ?? ""}`}>
      {status}
    </Badge>
  );
}

// ─── QR panel (renders SVG inline, can download as PNG) ───────────────────────

function QrPanel({ zone, url }: { zone: FlyerZone; url: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [copied, setCopied] = useState(false);

  function copyUrl() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function downloadPng() {
    const svg = svgRef.current;
    if (!svg) return;
    const SIZE = 1000;
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = zone.qrFilename;
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <QRCodeSVG
        ref={svgRef}
        value={url}
        size={180}
        level="H"
        fgColor="#0d1b2a"
        bgColor="#ffffff"
        includeMargin
      />
      <p className="text-xs text-muted-foreground text-center max-w-[200px] break-all">{url}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={copyUrl}>
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy URL"}
        </Button>
        <Button size="sm" variant="outline" onClick={downloadPng}>
          <Download className="w-3 h-3" />
          PNG
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FlyerCampaigns() {
  const { user, profile } = useAuth();
  const [activeView, setActiveView] = useState("overview");
  const [dbZones, setDbZones] = useState<DbZone[]>([]);
  const [dropLogs, setDropLogs] = useState<DbDropLog[]>([]);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Drop log form state
  const [dropDialogOpen, setDropDialogOpen] = useState(false);
  const [dropZoneId, setDropZoneId] = useState("");
  const [dropFlyerCount, setDropFlyerCount] = useState("");
  const [dropBusinessCount, setDropBusinessCount] = useState("");
  const [dropNotes, setDropNotes] = useState("");
  const [dropSaving, setDropSaving] = useState(false);

  // Results editing state
  const [editingResultsId, setEditingResultsId] = useState<string | null>(null);
  const [resultsEdit, setResultsEdit] = useState<ResultsRow>({ zone_id: "", scans: 0, signups: 0, hires: 0 });

  // QR detail dialog
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrZone, setQrZone] = useState<FlyerZone | null>(null);

  // CSV export flag for download
  const [exportExpanded, setExportExpanded] = useState(false);

  // Assignments state (Assign tab)
  const [assignments, setAssignments] = useState<DbAssignment[]>([]);
  const [asgName, setAsgName] = useState("");
  const [asgEmail, setAsgEmail] = useState("");
  const [asgZones, setAsgZones] = useState<string>(""); // comma-separated zone numbers
  const [asgSaving, setAsgSaving] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);

    // Get campaign
    const { data: campaigns } = await supabase
      .from("flyer_campaigns" as never)
      .select("id")
      .eq("slug" as never, "san_diego_drop" as never)
      .limit(1 as never) as unknown as { data: { id: string }[] | null };

    const cid = campaigns?.[0]?.id ?? null;
    setCampaignId(cid);

    if (cid) {
      const [zonesRes, logsRes, asgRes] = await Promise.all([
        supabase
          .from("flyer_zones" as never)
          .select("id,zone_number,zone_name,city,utm_content,full_utm_url,bitly_short_url,qr_filename,status,flyer_count,total_scans,total_signups,total_hires,notes")
          .eq("campaign_id" as never, cid as never)
          .order("zone_number" as never) as unknown as Promise<{ data: DbZone[] | null; error: unknown }>,
        supabase
          .from("flyer_drop_logs" as never)
          .select("id,zone_id,dropped_at,flyer_count,business_count,notes")
          .eq("campaign_id" as never, cid as never)
          .order("dropped_at" as never, { ascending: false } as never)
          .limit(200 as never) as unknown as Promise<{ data: DbDropLog[] | null; error: unknown }>,
        supabase
          .from("flyer_zone_assignments" as never)
          .select("id,assignee_name,assignee_email,zone_numbers,invite_token,assigned_to_user_id,is_active,created_at")
          .eq("campaign_id" as never, cid as never)
          .order("created_at" as never, { ascending: false } as never) as unknown as Promise<{ data: DbAssignment[] | null; error: unknown }>,
      ]);

      if (zonesRes.data) setDbZones(zonesRes.data);
      if (logsRes.data) setDropLogs(logsRes.data);
      if (asgRes.data) setAssignments(asgRes.data);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Merge static zone data with live DB status */
  function mergedZones() {
    return FLYER_ZONES.map(fz => {
      const db = dbZones.find(d => d.zone_number === fz.zoneNumber);
      return { fz, db };
    });
  }

  function activeUrl(fz: FlyerZone, db?: DbZone) {
    return db?.bitly_short_url ?? fz.bitlyShortUrl ?? fz.fullUtmUrl;
  }

  // ── Drop log submit ────────────────────────────────────────────────────────

  async function submitDrop() {
    if (!campaignId || !dropZoneId) {
      toast.error("Select a zone first.");
      return;
    }
    setDropSaving(true);
    const { error } = await (supabase.from("flyer_drop_logs" as never).insert({
      campaign_id: campaignId,
      zone_id: dropZoneId,
      flyer_count: parseInt(dropFlyerCount) || 0,
      business_count: parseInt(dropBusinessCount) || 0,
      notes: dropNotes || null,
    } as never) as unknown as Promise<{ error: unknown }>);

    setDropSaving(false);
    if (error) {
      toast.error("Failed to log drop.");
      return;
    }
    toast.success("Drop logged.");
    setDropDialogOpen(false);
    setDropZoneId("");
    setDropFlyerCount("");
    setDropBusinessCount("");
    setDropNotes("");
    fetchData(true);
  }

  // ── Results save ───────────────────────────────────────────────────────────

  async function saveResults() {
    if (!editingResultsId) return;
    const { error } = await (supabase
      .from("flyer_zones" as never)
      .update({ total_scans: resultsEdit.scans, total_signups: resultsEdit.signups, total_hires: resultsEdit.hires } as never)
      .eq("id" as never, editingResultsId as never) as unknown as Promise<{ error: unknown }>);
    if (error) { toast.error("Save failed."); return; }
    toast.success("Results updated.");
    setEditingResultsId(null);
    fetchData(true);
  }

  // ── CSV download ───────────────────────────────────────────────────────────

  function downloadCsv() {
    const csv = exportZonesToCsv();
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "jobline_utm_master.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("CSV downloaded.");
  }

  // ── Assignments ────────────────────────────────────────────────────────────

  async function createAssignment() {
    if (!campaignId || !user) return;
    const name = asgName.trim();
    if (!name) { toast.error("Enter a name for the helper."); return; }
    const parsedZones = asgZones
      .split(/[,\s]+/)
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 1 && n <= 22);
    if (parsedZones.length === 0) {
      toast.error("Enter at least one valid zone number (1–22).");
      return;
    }
    setAsgSaving(true);
    const { error } = await (supabase
      .from("flyer_zone_assignments" as never)
      .insert({
        campaign_id: campaignId,
        assignee_name: name,
        assignee_email: asgEmail.trim() || null,
        zone_numbers: parsedZones,
        assigned_by: user.id,
      } as never) as unknown as Promise<{ error: unknown }>);
    setAsgSaving(false);
    if (error) { toast.error("Failed to create assignment."); return; }
    toast.success(`Assignment created for ${name}.`);
    setAsgName("");
    setAsgEmail("");
    setAsgZones("");
    fetchData(true);
  }

  async function deactivateAssignment(id: string) {
    const { error } = await (supabase
      .from("flyer_zone_assignments" as never)
      .update({ is_active: false } as never)
      .eq("id" as never, id as never) as unknown as Promise<{ error: unknown }>);
    if (error) { toast.error("Failed to deactivate."); return; }
    toast.success("Assignment deactivated.");
    fetchData(true);
  }

  function assignmentUrl(token: string) {
    return `${window.location.origin}/field/${token}`;
  }

  function copyAssignmentLink(token: string) {
    navigator.clipboard.writeText(assignmentUrl(token)).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 1800);
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4 py-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const merged = mergedZones();
  const totalFlyers = dbZones.reduce((s, z) => s + z.flyer_count, 0);
  const totalDropped = dbZones.filter(z => ["dropped", "active", "complete"].includes(z.status)).length;
  const totalScans = dbZones.reduce((s, z) => s + z.total_scans, 0);
  const totalSignups = dbZones.reduce((s, z) => s + z.total_signups, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Flyer Campaigns</h2>
          <p className="text-sm text-muted-foreground">San Diego County drop — 22 zones · 190+ target businesses</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" variant="outline" onClick={downloadCsv}>
            <Download className="w-3.5 h-3.5 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Zones Dropped", value: `${totalDropped}/22` },
          { label: "Total Flyers", value: totalFlyers.toLocaleString() },
          { label: "Total Scans",  value: totalScans.toLocaleString() },
          { label: "Signups",      value: totalSignups.toLocaleString() },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold mt-0.5">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Views */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <Map className="w-3.5 h-3.5" />
            Campaign Overview
          </TabsTrigger>
          <TabsTrigger value="qr-library" className="gap-1.5">
            <QrCode className="w-3.5 h-3.5" />
            QR Library
          </TabsTrigger>
          <TabsTrigger value="drop-log" className="gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" />
            Drop Log
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" />
            Results
          </TabsTrigger>
          <TabsTrigger value="field" className="gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            Field
          </TabsTrigger>
          <TabsTrigger value="assign" className="gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Assign
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" />
            Contacts
          </TabsTrigger>
        </TabsList>

        {/* ─── Campaign Overview ─── */}
        <TabsContent value="overview">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Zone Status — san_diego_drop</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead className="hidden md:table-cell">City</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">UTM Content</TableHead>
                      <TableHead className="hidden lg:table-cell">Bitly URL</TableHead>
                      <TableHead className="w-12 text-right">QR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {merged.map(({ fz, db }) => (
                      <TableRow key={fz.zoneNumber}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{String(fz.zoneNumber).padStart(2, "0")}</TableCell>
                        <TableCell className="font-medium text-sm">{fz.zoneName}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{fz.city}</TableCell>
                        <TableCell>
                          <ZoneStatusBadge status={db?.status ?? "pending"} />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-mono text-xs text-muted-foreground">{fz.utmContent}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {db?.bitly_short_url
                            ? <span className="font-mono text-xs text-blue-600 dark:text-blue-400">{db.bitly_short_url}</span>
                            : <span className="text-xs text-muted-foreground italic">pending</span>
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => { setQrZone(fz); setQrDialogOpen(true); }}
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── QR Library ─── */}
        <TabsContent value="qr-library">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {merged.map(({ fz, db }) => {
              const url = activeUrl(fz, db);
              return (
                <Card
                  key={fz.zoneNumber}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => { setQrZone(fz); setQrDialogOpen(true); }}
                >
                  <CardContent className="flex flex-col items-center gap-2 p-3">
                    <QRCodeSVG
                      value={url}
                      size={100}
                      level="H"
                      fgColor="#0d1b2a"
                      bgColor="#ffffff"
                      includeMargin
                    />
                    <div className="text-center">
                      <p className="text-xs font-semibold leading-tight">{fz.city}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{`z${String(fz.zoneNumber).padStart(2, "0")}`}</p>
                    </div>
                    <ZoneStatusBadge status={db?.status ?? "pending"} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ─── Drop Log ─── */}
        <TabsContent value="drop-log">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-muted-foreground">{dropLogs.length} drop events recorded</h3>
              <Button size="sm" onClick={() => setDropDialogOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Log Drop
              </Button>
            </div>

            {dropLogs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground text-sm">
                  No drops logged yet. Use "Log Drop" to record each zone visit.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Zone</TableHead>
                          <TableHead className="text-right">Flyers</TableHead>
                          <TableHead className="text-right">Businesses</TableHead>
                          <TableHead className="hidden md:table-cell">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dropLogs.map(log => {
                          const zoneStatic = FLYER_ZONES.find(z => dbZones.find(d => d.id === log.zone_id)?.zone_number === z.zoneNumber);
                          return (
                            <TableRow key={log.id}>
                              <TableCell className="text-sm">
                                {new Date(log.dropped_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </TableCell>
                              <TableCell className="text-sm font-medium">{zoneStatic?.zoneName ?? log.zone_id.slice(0, 8)}</TableCell>
                              <TableCell className="text-right font-mono text-sm">{log.flyer_count}</TableCell>
                              <TableCell className="text-right font-mono text-sm">{log.business_count}</TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{log.notes ?? "—"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ─── Results ─── */}
        <TabsContent value="results">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Results by Zone — enter weekly scan / signup / hire counts</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead className="text-right">Scans</TableHead>
                      <TableHead className="text-right">Signups</TableHead>
                      <TableHead className="text-right">Hires</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Conv %</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {merged.map(({ fz, db }) => {
                      const isEditing = editingResultsId === db?.id;
                      const scans   = isEditing ? resultsEdit.scans   : (db?.total_scans   ?? 0);
                      const signups = isEditing ? resultsEdit.signups : (db?.total_signups ?? 0);
                      const hires   = isEditing ? resultsEdit.hires   : (db?.total_hires   ?? 0);
                      const conv    = scans > 0 ? ((signups / scans) * 100).toFixed(1) + "%" : "—";

                      return (
                        <TableRow key={fz.zoneNumber}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{String(fz.zoneNumber).padStart(2, "0")}</TableCell>
                          <TableCell className="text-sm font-medium">{fz.zoneName}</TableCell>
                          <TableCell className="text-right">
                            {isEditing
                              ? <Input type="number" min={0} value={resultsEdit.scans} onChange={e => setResultsEdit(r => ({ ...r, scans: parseInt(e.target.value) || 0 }))} className="h-7 w-20 text-right ml-auto" />
                              : <span className="font-mono text-sm">{scans}</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing
                              ? <Input type="number" min={0} value={resultsEdit.signups} onChange={e => setResultsEdit(r => ({ ...r, signups: parseInt(e.target.value) || 0 }))} className="h-7 w-20 text-right ml-auto" />
                              : <span className="font-mono text-sm">{signups}</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing
                              ? <Input type="number" min={0} value={resultsEdit.hires} onChange={e => setResultsEdit(r => ({ ...r, hires: parseInt(e.target.value) || 0 }))} className="h-7 w-20 text-right ml-auto" />
                              : <span className="font-mono text-sm">{hires}</span>}
                          </TableCell>
                          <TableCell className="text-right hidden sm:table-cell font-mono text-sm">{conv}</TableCell>
                          <TableCell className="text-right">
                            {db ? (
                              isEditing ? (
                                <div className="flex gap-1 justify-end">
                                  <Button size="sm" className="h-7 text-xs px-2" onClick={saveResults}>Save</Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setEditingResultsId(null)}>Cancel</Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs px-2"
                                  onClick={() => {
                                    setEditingResultsId(db.id);
                                    setResultsEdit({ zone_id: db.id, scans: db.total_scans, signups: db.total_signups, hires: db.total_hires });
                                  }}
                                >
                                  Edit
                                </Button>
                              )
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* ─── Field ─── */}
        <TabsContent value="field" className="p-0">
          {campaignId && user ? (
            <FieldChecklist
              campaignId={campaignId}
              dbZones={dbZones}
              currentUserId={user.id}
              displayName={profile?.display_name ?? user.email ?? "Admin"}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                Campaign data loading…
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Assign ─── */}
        <TabsContent value="assign">
          <div className="space-y-6">
            {/* Create assignment form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Create Zone Assignment</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Assign one or more zones to an authenticated helper. They'll get a shareable link
                  that requires them to sign in before accessing the field checklist.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Helper Name</Label>
                    <Input
                      placeholder="e.g. Alex M."
                      value={asgName}
                      onChange={e => setAsgName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email (optional)</Label>
                    <Input
                      type="email"
                      placeholder="helper@example.com"
                      value={asgEmail}
                      onChange={e => setAsgEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Zone Numbers</Label>
                  <Input
                    placeholder="e.g. 3, 4, 5  or  7 8 9"
                    value={asgZones}
                    onChange={e => setAsgZones(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma or space separated. Valid values: 1–22.
                  </p>
                </div>
                <Button onClick={createAssignment} disabled={asgSaving} className="w-full sm:w-auto">
                  {asgSaving ? "Creating…" : "Create Assignment"}
                </Button>
              </CardContent>
            </Card>

            {/* Assignments list */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {assignments.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No assignments created yet.
                  </p>
                ) : (
                  <div className="divide-y">
                    {assignments.map(asg => {
                      const url = assignmentUrl(asg.invite_token);
                      const isCopied = copiedToken === asg.invite_token;
                      return (
                        <div
                          key={asg.id}
                          className={`px-4 py-3 flex items-start gap-3 ${!asg.is_active ? "opacity-50" : ""}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{asg.assignee_name}</span>
                              {asg.assignee_email && (
                                <span className="text-xs text-muted-foreground">{asg.assignee_email}</span>
                              )}
                              <Badge variant={asg.is_active ? "default" : "secondary"} className="text-xs">
                                {asg.is_active ? "Active" : "Inactive"}
                              </Badge>
                              {asg.assigned_to_user_id && (
                                <Badge variant="outline" className="text-xs text-green-600">Claimed</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Zones: {(asg.zone_numbers ?? []).sort((a, b) => a - b).map(n => `Z${n}`).join(", ")}
                            </p>
                            <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">{url}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              title="Copy link"
                              onClick={() => copyAssignmentLink(asg.invite_token)}
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Link className="w-3.5 h-3.5" />}
                            </Button>
                            {asg.is_active && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                title="Deactivate"
                                onClick={() => deactivateAssignment(asg.id)}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Role note */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 px-4 py-3 text-sm space-y-1">
              <p className="font-medium text-amber-800 dark:text-amber-300">Helper access setup</p>
              <p className="text-amber-700 dark:text-amber-400 text-xs">
                Helpers must have a Supabase account <strong>and</strong> a <code>flyer_worker</code> role
                in <code>user_roles</code>, or existing <code>admin</code>/<code>developer</code> access.
                To grant the role, run in Supabase SQL Editor:
              </p>
              <pre className="text-xs bg-amber-100 dark:bg-amber-900/40 rounded p-2 overflow-x-auto whitespace-pre-wrap">
{`INSERT INTO user_roles (user_id, role)
VALUES ('<their-user-id>', 'flyer_worker')
ON CONFLICT (user_id, role) DO NOTHING;`}
              </pre>
            </div>
          </div>
        </TabsContent>

        {/* ─── Contacts / Export ─── */}
        <TabsContent value="contacts">
          <ContactsExportTab campaignId={campaignId} />
        </TabsContent>
      </Tabs>

      {/* ─── QR Detail Dialog ─── */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {qrZone ? `Z${String(qrZone.zoneNumber).padStart(2, "0")} — ${qrZone.zoneName}` : "QR Code"}
            </DialogTitle>
          </DialogHeader>
          {qrZone && (
            <QrPanel
              zone={qrZone}
              url={activeUrl(qrZone, dbZones.find(d => d.zone_number === qrZone.zoneNumber))}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Log Drop Dialog ─── */}
      <Dialog open={dropDialogOpen} onOpenChange={setDropDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Log Flyer Drop</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Zone</Label>
              <Select value={dropZoneId} onValueChange={setDropZoneId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select zone…" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[200]">
                  {dbZones.map(z => (
                    <SelectItem key={z.id} value={z.id}>
                      Z{String(z.zone_number).padStart(2, "0")} — {z.zone_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Flyers dropped</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={dropFlyerCount}
                  onChange={e => setDropFlyerCount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Businesses visited</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={dropBusinessCount}
                  onChange={e => setDropBusinessCount(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Observations, gate access issues, contacts made…"
                rows={3}
                value={dropNotes}
                onChange={e => setDropNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDropDialogOpen(false)}>Cancel</Button>
              <Button onClick={submitDrop} disabled={dropSaving}>
                {dropSaving ? "Saving…" : "Log Drop"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
