import { useState, useEffect, useCallback } from "react";
import { useUrlState } from "@/hooks/useUrlState";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAccess } from "@/hooks/useAdminData";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, RefreshCw, Shield, Search } from "lucide-react";
import { format } from "date-fns";

interface DataAccessLogRow {
  id: string;
  user_id: string;
  organization_id: string | null;
  table_name: string;
  record_id: string | null;
  operation: string;
  created_at: string;
  user_display_name: string | null;
  user_email: string | null;
  metadata: Record<string, unknown> | null;
}

const OPERATION_COLORS: Record<string, string> = {
  READ: "bg-blue-500/10 text-blue-600",
  WRITE: "bg-green-500/10 text-green-600",
  DELETE: "bg-red-500/10 text-red-600",
  EXPORT: "bg-purple-500/10 text-purple-600",
};

const SENSITIVE_TABLES = [
  "queue_items",
  "handoff_records",
  "stations",
  "work_order_routing",
  "ncr_reports",
  "data_access_logs",
];

/**
 * Admin panel for viewing the ITAR data access audit log.
 * Only visible to platform admins, developers, and org admins/owners.
 */
export function DataAccessLogs() {
  const { isAdmin } = useAdminAccess();
  const [logs, setLogs] = useState<DataAccessLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState("");
  const [filterTable, setFilterTable] = useUrlState<string>("tbl", "all");
  const [filterOp, setFilterOp] = useUrlState<string>("op", "all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("data_access_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (filterTable !== "all") query = query.eq("table_name", filterTable);
    if (filterOp !== "all") query = query.eq("operation", filterOp);

    const { data } = await query;
    setLogs((data as DataAccessLogRow[]) ?? []);
    setLoading(false);
  }, [filterTable, filterOp]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const exportCSV = () => {
    const headers = ["Timestamp", "User", "Email", "Table", "Record ID", "Operation", "Org ID"];
    const rows = logs.map((l) => [
      l.created_at,
      l.user_display_name ?? l.user_id,
      l.user_email ?? "",
      l.table_name,
      l.record_id ?? "",
      l.operation,
      l.organization_id ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `data-access-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((l) => {
    if (!searchUser) return true;
    const q = searchUser.toLowerCase();
    return (
      (l.user_display_name ?? "").toLowerCase().includes(q) ||
      (l.user_email ?? "").toLowerCase().includes(q)
    );
  });

  if (!isAdmin) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              Data Access Audit Log
            </CardTitle>
            <CardDescription>
              ITAR compliance audit trail for reads, writes, deletes, and exports
              on controlled data tables.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user name or email…"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterTable} onValueChange={setFilterTable}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All tables" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tables</SelectItem>
              {SENSITIVE_TABLES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterOp} onValueChange={setFilterOp}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All ops" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All operations</SelectItem>
              <SelectItem value="READ">READ</SelectItem>
              <SelectItem value="WRITE">WRITE</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
              <SelectItem value="EXPORT">EXPORT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-auto max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead>Record ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No access logs found. Logs are written when users access ITAR-sensitive tables.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{log.user_display_name ?? "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{log.user_email}</div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{log.table_name}</code>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${OPERATION_COLORS[log.operation] ?? ""}`} variant="secondary">
                        {log.operation}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground">
                        {log.record_id ? log.record_id.slice(0, 8) + "…" : "bulk"}
                      </code>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground">
          Showing up to 500 most recent entries. Export CSV for full retention records.
          Log retention: 2 years (per org data retention policy).
        </p>
      </CardContent>
    </Card>
  );
}
