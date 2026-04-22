import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, MapPin, User, Calendar, Download, type LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { getQueueStatusBadgeColor } from "@/lib/status-colors";
import { cn } from "@/lib/utils";
import type { QueueStatus } from "@/hooks/useQueue";

export interface WorkOrderStatusListConfig {
  status: QueueStatus;
  title: string;
  metaDescription: string;
  icon: LucideIcon;
  iconClassName?: string;
  /** Field used to sort + display in the timestamp column */
  timestampField: "cancelled_at" | "on_hold_at" | "completed_at";
  timestampLabel: string;
  /** Field used to display the actor */
  actorField: "cancelled_by_name" | "on_hold_by_name" | null;
  actorLabel?: string;
  /** Reason field (cancellation_reason / hold_reason / null) */
  reasonField: "cancellation_reason" | "hold_reason" | null;
  reasonLabel?: string;
  /** Banner message above the table */
  banner?: string;
  /** CSV file prefix */
  csvPrefix: string;
  /** Back-link override */
  backTo?: { to: string; label: string };
}

interface Row {
  id: string;
  work_order: string | null;
  part_number: string | null;
  title: string;
  quantity: number | null;
  station_id: string | null;
  station_name?: string | null;
  station_code?: string | null;
  // dynamic
  timestamp: string | null;
  actor: string | null;
  reason: string | null;
  created_at: string;
  status: string;
}

export function WorkOrderStatusList({ config }: { config: WorkOrderStatusListConfig }) {
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  useEffect(() => {
    if (!organization?.id) return;
    let active = true;

    (async () => {
      setLoading(true);
      const selectCols = [
        "id", "work_order", "part_number", "title", "quantity", "station_id", "status", "created_at",
        config.timestampField,
        config.actorField,
        config.reasonField,
      ].filter(Boolean).join(", ");

      const { data, error } = await supabase
        .from("queue_items")
        .select(selectCols)
        .eq("organization_id", organization.id)
        .eq("status", config.status)
        .eq("item_type", "work_order")
        .order(config.timestampField, { ascending: false, nullsFirst: false })
        .limit(500);

      if (!active) return;

      if (error || !data) {
        setRows([]);
        setLoading(false);
        return;
      }

      const stationIds = [...new Set((data as any[]).map((r) => r.station_id).filter(Boolean))] as string[];
      const stationMap = new Map<string, { name: string; station_id: string }>();
      if (stationIds.length > 0) {
        const { data: stations } = await supabase
          .from("stations")
          .select("id, name, station_id")
          .in("id", stationIds);
        stations?.forEach((s) => stationMap.set(s.id, { name: s.name, station_id: s.station_id }));
      }

      setRows(
        (data as any[]).map((r) => ({
          id: r.id,
          work_order: r.work_order,
          part_number: r.part_number,
          title: r.title,
          quantity: r.quantity,
          station_id: r.station_id,
          status: r.status,
          created_at: r.created_at,
          timestamp: r[config.timestampField] ?? null,
          actor: config.actorField ? r[config.actorField] ?? null : null,
          reason: config.reasonField ? r[config.reasonField] ?? null : null,
          station_name: r.station_id ? stationMap.get(r.station_id)?.name ?? null : null,
          station_code: r.station_id ? stationMap.get(r.station_id)?.station_id ?? null : null,
        }))
      );
      setLoading(false);
    })();

    return () => { active = false; };
  }, [organization?.id, config.status, config.timestampField, config.actorField, config.reasonField]);

  const stations = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => { if (r.station_id && r.station_name) map.set(r.station_id, r.station_name); });
    return [...map.entries()];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (stationFilter === "none" && r.station_id) return false;
      if (stationFilter !== "all" && stationFilter !== "none" && r.station_id !== stationFilter) return false;
      if (!q) return true;
      return (
        (r.work_order || "").toLowerCase().includes(q) ||
        (r.part_number || "").toLowerCase().includes(q) ||
        (r.title || "").toLowerCase().includes(q) ||
        (r.actor || "").toLowerCase().includes(q) ||
        (r.reason || "").toLowerCase().includes(q) ||
        (r.station_name || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, stationFilter]);

  const exportCsv = () => {
    const header = ["Work Order", "Part Number", "Title", "Qty", "Station", config.timestampLabel];
    if (config.actorField) header.push(config.actorLabel || "By");
    if (config.reasonField) header.push(config.reasonLabel || "Reason");
    const lines = [header.join(",")];
    filtered.forEach((r) => {
      const cells: (string | number)[] = [
        r.work_order ?? "",
        r.part_number ?? "",
        r.title ?? "",
        r.quantity ?? "",
        r.station_name ? `${r.station_name}${r.station_code ? ` (${r.station_code})` : ""}` : "Unassigned",
        r.timestamp ? format(new Date(r.timestamp), "yyyy-MM-dd HH:mm") : "",
      ];
      if (config.actorField) cells.push(r.actor ?? "");
      if (config.reasonField) cells.push((r.reason ?? "").replace(/"/g, '""'));
      lines.push(cells.map((v) => `"${String(v)}"`).join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${config.csvPrefix}-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!user) return null;

  const Icon = config.icon;
  const back = config.backTo ?? { to: "/work-orders", label: "Work Orders" };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <Helmet>
        <title>{config.title} | JobLine.ai</title>
        <meta name="description" content={config.metaDescription} />
      </Helmet>

      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to={back.to}><ArrowLeft className="w-4 h-4 mr-1" />{back.label}</Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <Icon className={cn("w-5 h-5", config.iconClassName)} />
            {config.title}
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{rows.length} total</Badge>
            <Badge className={cn("text-[10px]", getQueueStatusBadgeColor(config.status))}>
              {config.status}
            </Badge>
            {config.banner && (
              <span className="text-xs text-muted-foreground font-normal">{config.banner}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search WO, part, title, station, reason, who…"
                className="pl-8"
              />
            </div>
            <Select value={stationFilter} onValueChange={setStationFilter}>
              <SelectTrigger className="sm:w-64">
                <SelectValue placeholder="Filter by station" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stations</SelectItem>
                <SelectItem value="none">Unassigned</SelectItem>
                {stations.map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {rows.length === 0 ? `No ${config.status} work orders.` : "No results match your filters."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Order</TableHead>
                    <TableHead>Part / Title</TableHead>
                    <TableHead><MapPin className="inline w-3 h-3 mr-1" />Station</TableHead>
                    <TableHead><Calendar className="inline w-3 h-3 mr-1" />{config.timestampLabel}</TableHead>
                    {config.actorField && (
                      <TableHead><User className="inline w-3 h-3 mr-1" />{config.actorLabel || "By"}</TableHead>
                    )}
                    {config.reasonField && (
                      <TableHead>{config.reasonLabel || "Reason"}</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">
                        <Link to={`/queue?item=${r.id}`} className="hover:underline">
                          {r.work_order || "—"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium">{r.part_number || "—"}</div>
                        <div className="text-muted-foreground line-clamp-1">{r.title}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.station_name ? (
                          <>
                            {r.station_name}
                            {r.station_code && (
                              <span className="text-muted-foreground"> · {r.station_code}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {r.timestamp ? format(new Date(r.timestamp), "MMM d, yyyy HH:mm") : "—"}
                      </TableCell>
                      {config.actorField && (
                        <TableCell className="text-xs">{r.actor || "—"}</TableCell>
                      )}
                      {config.reasonField && (
                        <TableCell className="text-xs max-w-md">
                          <span className="line-clamp-2">{r.reason || "—"}</span>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
