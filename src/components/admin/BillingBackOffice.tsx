import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, StickyNote, Pin, AlertTriangle, TrendingUp, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { AdminComponentAccess } from "@/types/admin";

interface BillingEvent {
  id: string;
  organization_id: string;
  event_type: string;
  description: string;
  amount_cents: number | null;
  seat_delta: number | null;
  previous_value: string | null;
  new_value: string | null;
  reason: string | null;
  performed_by: string | null;
  created_at: string;
}

interface BillingNote {
  id: string;
  organization_id: string;
  note: string;
  note_type: string;
  is_pinned: boolean;
  authored_by: string | null;
  created_at: string;
}

const EVENT_TYPE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  payment_failed: "destructive",
  cancellation: "destructive",
  downgrade: "destructive",
  credit_applied: "secondary",
  complimentary_access: "secondary",
  plan_change: "default",
  upgrade: "default",
  renewal: "default",
  seat_change: "outline",
  payment_recovered: "default",
  manual_adjustment: "outline",
};

const NOTE_TYPE_COLOR: Record<string, string> = {
  general: "text-muted-foreground",
  payment_exception: "text-yellow-600",
  contract: "text-blue-600",
  churn_risk: "text-red-600",
  vip: "text-purple-600",
  collection: "text-red-800",
};

interface Props {
  access: AdminComponentAccess;
}

export function BillingBackOffice({ access }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [noteBody, setNoteBody] = useState("");
  const [noteType, setNoteType] = useState<string>("general");
  const [addingNote, setAddingNote] = useState(false);

  const orgFilter = access.organizationId;

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["billing-events", orgFilter],
    queryFn: async () => {
      let query = (supabase as any)
        .from("billing_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (orgFilter) query = query.eq("organization_id", orgFilter);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as BillingEvent[];
    },
  });

  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ["billing-notes", orgFilter],
    queryFn: async () => {
      let query = (supabase as any)
        .from("billing_notes")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (orgFilter) query = query.eq("organization_id", orgFilter);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as BillingNote[];
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      if (!orgFilter) throw new Error("Select an organization scope first");
      if (!noteBody.trim()) throw new Error("Note body is required");
      const { error } = await (supabase as any).from("billing_notes").insert({
        organization_id: orgFilter,
        note: noteBody.trim(),
        note_type: noteType,
        authored_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Note added");
      setNoteBody("");
      setAddingNote(false);
      void qc.invalidateQueries({ queryKey: ["billing-notes"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Billing Back-Office</h2>
        <p className="text-sm text-muted-foreground">
          Billing event history and account notes.{" "}
          {!orgFilter && <span className="text-yellow-600">Select an org scope above to filter.</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Billing events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Event History
            </CardTitle>
            <CardDescription>
              {eventsLoading ? "Loading…" : `${events?.length ?? 0} events`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {eventsLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : !events?.length ? (
              <div className="py-10 text-center text-muted-foreground">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No billing events recorded.</p>
              </div>
            ) : (
              <ScrollArea className="h-80">
                <div className="divide-y">
                  {events.map((e) => (
                    <div key={e.id} className="px-4 py-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={EVENT_TYPE_VARIANT[e.event_type] ?? "outline"}
                          className="text-xs shrink-0"
                        >
                          {e.event_type.replace(/_/g, " ")}
                        </Badge>
                        {e.amount_cents != null && (
                          <span className="text-xs text-muted-foreground">
                            ${(e.amount_cents / 100).toFixed(2)}
                          </span>
                        )}
                        {e.seat_delta != null && (
                          <span className={`text-xs ${e.seat_delta > 0 ? "text-green-600" : "text-red-600"}`}>
                            {e.seat_delta > 0 ? "+" : ""}{e.seat_delta} seats
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{e.description}</p>
                      {e.reason && <p className="text-xs text-muted-foreground">{e.reason}</p>}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(e.created_at), "MMM d, yyyy HH:mm")}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Billing notes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <StickyNote className="w-4 h-4" />
                  Account Notes
                </CardTitle>
                <CardDescription>
                  {notesLoading ? "Loading…" : `${notes?.length ?? 0} notes`}
                </CardDescription>
              </div>
              {access.isPlatformAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddingNote((p) => !p)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Note
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {addingNote && (
              <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["general", "payment_exception", "contract", "churn_risk", "vip", "collection"].map((t) => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Add a billing note…"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setAddingNote(false)}>Cancel</Button>
                  <Button size="sm" onClick={() => addNote.mutate()} disabled={addNote.isPending}>
                    {addNote.isPending ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            )}
            {notesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : !notes?.length ? (
              <div className="py-10 text-center text-muted-foreground">
                <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No notes on this account.</p>
              </div>
            ) : (
              <ScrollArea className="h-72">
                <div className="space-y-2">
                  {notes.map((n) => (
                    <div key={n.id} className="p-3 border rounded-lg space-y-1">
                      <div className="flex items-center gap-2">
                        {n.is_pinned && <Pin className="w-3 h-3 text-primary" />}
                        <span className={`text-xs font-medium uppercase ${NOTE_TYPE_COLOR[n.note_type] ?? ""}`}>
                          {n.note_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(n.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-sm">{n.note}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
