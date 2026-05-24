import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Download, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type EventCategory = "legal" | "billing" | "org" | "support" | "security" | "talent" | "system";

interface AuditEvent {
  id: string;
  actor_id: string;
  actor_email: string | null;
  event_category: EventCategory;
  event_action: string;
  target_type: string | null;
  target_id: string | null;
  target_label: string | null;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown> | null;
  reason: string | null;
  organization_id: string | null;
  created_at: string;
}

const CATEGORY_VARIANT: Record<EventCategory, "default" | "secondary" | "destructive" | "outline"> = {
  legal: "default",
  billing: "secondary",
  org: "outline",
  support: "outline",
  security: "destructive",
  talent: "secondary",
  system: "outline",
};

export function AdminAuditLog() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-audit-events", categoryFilter],
    queryFn: async () => {
      let query = (supabase as any)
        .from("admin_audit_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (categoryFilter !== "all") query = query.eq("event_category", categoryFilter);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AuditEvent[];
    },
  });

  const filtered = (events ?? []).filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.event_action.toLowerCase().includes(q) ||
      (e.actor_email ?? "").toLowerCase().includes(q) ||
      (e.target_label ?? "").toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    if (!filtered.length) return;
    const header = "id,actor_email,category,action,target_type,target_label,organization_id,created_at\n";
    const rows = filtered
      .map((e) =>
        [
          e.id,
          e.actor_email ?? "",
          e.event_category,
          e.event_action,
          e.target_type ?? "",
          e.target_label ?? "",
          e.organization_id ?? "",
          e.created_at,
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-audit-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Admin Audit Log</h2>
          <p className="text-sm text-muted-foreground">
            Immutable record of sensitive platform-admin actions across all categories.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!filtered.length}>
          <Download className="w-4 h-4 mr-1" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search action, actor, target…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(["legal", "billing", "org", "support", "security", "talent", "system"] as EventCategory[]).map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground shrink-0">
          {filtered.length} events
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : !filtered.length ? (
            <div className="py-14 text-center text-muted-foreground">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No audit events</p>
              <p className="text-sm mt-1">
                {events?.length
                  ? "No events match your filter."
                  : "Admin actions will appear here as they occur."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[560px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b z-10">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Action</th>
                    <th className="px-4 py-2.5 font-medium hidden md:table-cell">Actor</th>
                    <th className="px-4 py-2.5 font-medium hidden lg:table-cell">Target</th>
                    <th className="px-4 py-2.5 font-medium">Category</th>
                    <th className="px-4 py-2.5 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelectedEvent(e)}
                    >
                      <td className="px-4 py-2.5 font-mono text-xs">{e.event_action}</td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell text-xs">
                        {e.actor_email ?? e.actor_id.slice(0, 8) + "…"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden lg:table-cell text-xs">
                        {e.target_label ?? (e.target_type ? `${e.target_type}:${e.target_id?.slice(0, 8)}` : "—")}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={CATEGORY_VARIANT[e.event_category]} className="text-xs">
                          {e.event_category}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                        {format(new Date(e.created_at), "MMM d HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(o) => { if (!o) setSelectedEvent(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">{selectedEvent?.event_action}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Actor</p>
                  <p>{selectedEvent.actor_email ?? selectedEvent.actor_id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Category</p>
                  <Badge variant={CATEGORY_VARIANT[selectedEvent.event_category]}>
                    {selectedEvent.event_category}
                  </Badge>
                </div>
                {selectedEvent.target_label && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Target</p>
                    <p>{selectedEvent.target_label}</p>
                  </div>
                )}
                {selectedEvent.reason && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Reason</p>
                    <p>{selectedEvent.reason}</p>
                  </div>
                )}
              </div>
              {selectedEvent.previous_state && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Previous State</p>
                  <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-32">
                    {JSON.stringify(selectedEvent.previous_state, null, 2)}
                  </pre>
                </div>
              )}
              {selectedEvent.new_state && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-1">New State</p>
                  <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-32">
                    {JSON.stringify(selectedEvent.new_state, null, 2)}
                  </pre>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {format(new Date(selectedEvent.created_at), "MMMM d, yyyy 'at' HH:mm:ss")}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
