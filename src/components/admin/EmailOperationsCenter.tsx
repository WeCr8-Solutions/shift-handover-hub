import { useState } from "react";
import { useUrlState } from "@/hooks/useUrlState";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, ShieldOff, Layers, AlertTriangle, CheckCircle2, XCircle, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type DeliveryStatus = "sent" | "delivered" | "bounced" | "complained" | "suppressed" | "failed" | "opened" | "clicked";

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  subject: string;
  is_active: boolean;
  send_requires_approval: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

interface DeliveryEvent {
  id: string;
  recipient_email: string;
  category: string | null;
  status: DeliveryStatus;
  provider: string | null;
  error_message: string | null;
  occurred_at: string;
}

interface Suppression {
  id: string;
  email: string;
  reason: string;
  suppressed_at: string;
  notes: string | null;
}

const STATUS_ICON: Record<DeliveryStatus, React.ReactNode> = {
  delivered: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
  opened: <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
  clicked: <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />,
  sent: <Mail className="w-3.5 h-3.5 text-blue-500" />,
  bounced: <XCircle className="w-3.5 h-3.5 text-red-500" />,
  complained: <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />,
  suppressed: <ShieldOff className="w-3.5 h-3.5 text-yellow-500" />,
  failed: <XCircle className="w-3.5 h-3.5 text-red-600" />,
};

export function EmailOperationsCenter() {
  const { user } = useAuth();
  const qc = useQueryClient();  const [categoryFilter, setCategoryFilter] = useUrlState<string>("cat", "all");
  const [suppressEmail, setSuppressEmail] = useState("");
  const [suppressDialogOpen, setSuppressDialogOpen] = useState(false);

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("email_templates")
        .select("*")
        .order("category")
        .order("name");
      if (error) throw error;
      return (data ?? []) as EmailTemplate[];
    },
  });

  const { data: deliveryEvents, isLoading: deliveryLoading } = useQuery({
    queryKey: ["email-delivery-events", categoryFilter],
    queryFn: async () => {
      let query = (supabase as any)
        .from("email_delivery_events")
        .select("id, recipient_email, category, status, provider, error_message, occurred_at")
        .order("occurred_at", { ascending: false })
        .limit(200);
      if (categoryFilter !== "all") query = query.eq("category", categoryFilter);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as DeliveryEvent[];
    },
  });

  const { data: suppressions, isLoading: suppressionsLoading } = useQuery({
    queryKey: ["email-suppressions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("email_suppressions")
        .select("*")
        .order("suppressed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Suppression[];
    },
  });

  const addSuppression = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await (supabase as any).from("email_suppressions").insert({
        email: email.toLowerCase().trim(),
        reason: "manual",
        suppressed_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Email suppressed");
      setSuppressEmail("");
      setSuppressDialogOpen(false);
      void qc.invalidateQueries({ queryKey: ["email-suppressions"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Status summary counts
  const statusCounts = (deliveryEvents ?? []).reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Email Operations Center</h2>
          <p className="text-sm text-muted-foreground">
            Template library, delivery health, and suppression management.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSuppressDialogOpen(true)}>
          <ShieldOff className="w-4 h-4 mr-1" />
          Add Suppression
        </Button>
      </div>

      {/* Delivery summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["delivered", "bounced", "complained", "failed"] as DeliveryStatus[]).map((s) => (
          <Card key={s}>
            <CardContent className="flex items-center gap-3 p-4">
              {STATUS_ICON[s]}
              <div>
                <p className="text-xl font-bold">{statusCounts[s] ?? 0}</p>
                <p className="text-xs text-muted-foreground capitalize">{s}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Templates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Templates
            </CardTitle>
            <CardDescription>{templates?.length ?? 0} templates</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {templatesLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !templates?.length ? (
              <div className="py-8 text-center text-muted-foreground text-sm">No templates yet.</div>
            ) : (
              <ScrollArea className="h-64">
                <div className="divide-y">
                  {templates.map((t) => (
                    <div key={t.id} className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">{t.name}</span>
                        <Badge variant={t.is_active ? "default" : "outline"} className="text-xs shrink-0">
                          {t.is_active ? "active" : "inactive"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.category} · v{t.version}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Delivery events */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Recent Events
              </CardTitle>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-7 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {["legal", "transactional", "recruiting", "marketing", "system"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {deliveryLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !deliveryEvents?.length ? (
              <div className="py-8 text-center text-muted-foreground text-sm">No events recorded.</div>
            ) : (
              <ScrollArea className="h-64">
                <div className="divide-y">
                  {deliveryEvents.map((e) => (
                    <div key={e.id} className="px-4 py-2 flex items-center gap-2">
                      {STATUS_ICON[e.status]}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{e.recipient_email}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(e.occurred_at), "MMM d HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Suppressions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldOff className="w-4 h-4" />
              Suppressions
            </CardTitle>
            <CardDescription>{suppressions?.length ?? 0} suppressed addresses</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {suppressionsLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !suppressions?.length ? (
              <div className="py-8 text-center text-muted-foreground text-sm">No suppressions.</div>
            ) : (
              <ScrollArea className="h-64">
                <div className="divide-y">
                  {suppressions.map((s) => (
                    <div key={s.id} className="px-4 py-2">
                      <p className="text-sm font-mono truncate">{s.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.reason} · {format(new Date(s.suppressed_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add suppression dialog */}
      <Dialog open={suppressDialogOpen} onOpenChange={setSuppressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manual Suppression</DialogTitle>
            <DialogDescription>
              This email address will be blocked from all outbound sends until removed.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="user@example.com"
            value={suppressEmail}
            onChange={(e) => setSuppressEmail(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSuppressDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => addSuppression.mutate(suppressEmail)}
              disabled={!suppressEmail.trim() || addSuppression.isPending}
            >
              {addSuppression.isPending ? "Suppressing…" : "Suppress"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
