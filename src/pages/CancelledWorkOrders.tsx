import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, XCircle, MapPin, User, Calendar, Download } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { getQueueStatusBadgeColor } from "@/lib/status-colors";
import { cn } from "@/lib/utils";

interface CancelledRow {
  id: string;
  work_order: string | null;
  part_number: string | null;
  title: string;
  quantity: number | null;
  station_id: string | null;
  station_name?: string | null;
  station_code?: string | null;
  cancelled_at: string | null;
  cancelled_by_name: string | null;
  cancellation_reason: string | null;
  created_at: string;
}

export default function CancelledWorkOrders() {
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const navigate = useNavigate();
  const [rows, setRows] = useState<CancelledRow[]>([]);
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
      const { data, error } = await supabase
        .from("queue_items")
        .select(
          "id, work_order, part_number, title, quantity, station_id, cancelled_at, cancelled_by_name, cancellation_reason, created_at"
        )
        .eq("organization_id", organization.id)
        .eq("status", "cancelled")
        .order("cancelled_at", { ascending: false, nullsFirst: false })
        .limit(500);

      if (!active) return;

      if (error || !data) {
        setRows([]);
        setLoading(false);
        return;
      }

      const stationIds = [...new Set(data.map((r) => r.station_id).filter(Boolean))] as string[];
      let stationMap = new Map<string, { name: string; station_id: string }>();
      if (stationIds.length > 0) {
        const { data: stations } = await supabase
          .from("stations")
          .select("id, name, station_id")
          .in("id", stationIds);
        stations?.forEach((s) => stationMap.set(s.id, { name: s.name, station_id: s.station_id }));
      }

      setRows(
        data.map((r) => ({
          ...r,
          station_name: r.station_id ? stationMap.get(r.station_id)?.name ?? null : null,
          station_code: r.station_id ? stationMap.get(r.station_id)?.station_id ?? null : null,
        }))
      );
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [organization?.id]);

  const stations = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      if (r.station_id && r.station_name) map.set(r.station_id, r.station_name);
    });
    return [...map.entries()];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (stationFilter !== "all" && r.station_id !== stationFilter) {
        if (stationFilter === "none" && r.station_id) return false;
        if (stationFilter !== "none" && r.station_id !== stationFilter) return false;
      }
      if (!q) return true;
      return (
        (r.work_order || "").toLowerCase().includes(q) ||
        (r.part_number || "").toLowerCase().includes(q) ||
        (r.title || "").toLowerCase().includes(q) ||
        (r.cancelled_by_name || "").toLowerCase().includes(q) ||
        (r.cancellation_reason || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, stationFilter]);

  const exportCsv = () => {
    const header = ["Work Order", "Part Number", "Title", "Qty", "Station", "Cancelled At", "Cancelled By", "Reason"];
    const lines = [header.join(",")];
    filtered.forEach((r) => {
      const cells = [
        r.work_order ?? "",
        r.part_number ?? "",
        r.title ?? "",
        r.quantity ?? "",
        r.station_name ? `${r.station_name}${r.station_code ? ` (${r.station_code})` : ""}` : "Unassigned",
        r.cancelled_at ? format(new Date(r.cancelled_at), "yyyy-MM-dd HH:mm") : "",
        r.cancelled_by_name ?? "",
        (r.cancellation_reason ?? "").replace(/"/g, '""'),
      ].map((v) => `"${String(v)}"`);
      lines.push(cells.join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cancelled-work-orders-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <Helmet>
        <title>Cancelled Work Orders | JobLine.ai</title>
        <meta name="description" content="Audit and review cancelled work orders with the reason, station, and who cancelled them." />
      </Helmet>

      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/work-orders"><ArrowLeft className="w-4 h-4 mr-1" />Work Orders</Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" />
            Cancelled Work Orders
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Badge variant="outline">{rows.length} total</Badge>
            <Badge className={cn("text-[10px]", getQueueStatusBadgeColor("cancelled"))}>cancelled</Badge>
            <span className="text-xs text-muted-foreground font-normal">
              Retained for audit. Cannot be deleted.
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search WO, part, title, reason, who…"
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
              {rows.length === 0 ? "No cancelled work orders." : "No results match your filters."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Order</TableHead>
                    <TableHead>Part / Title</TableHead>
                    <TableHead><MapPin className="inline w-3 h-3 mr-1" />Station</TableHead>
                    <TableHead><Calendar className="inline w-3 h-3 mr-1" />Cancelled</TableHead>
                    <TableHead><User className="inline w-3 h-3 mr-1" />By</TableHead>
                    <TableHead>Reason</TableHead>
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
                        {r.cancelled_at ? format(new Date(r.cancelled_at), "MMM d, yyyy HH:mm") : "—"}
                      </TableCell>
                      <TableCell className="text-xs">{r.cancelled_by_name || "—"}</TableCell>
                      <TableCell className="text-xs max-w-md">
                        <span className="line-clamp-2">{r.cancellation_reason || "—"}</span>
                      </TableCell>
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
