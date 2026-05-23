import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Send, Trash2, Eye, AlertTriangle, Mail, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type PolicyType = "terms" | "privacy" | "cookies" | "billing" | "combined";
type Status = "draft" | "scheduled" | "sending" | "sent" | "cancelled";

interface Announcement {
  id: string;
  policy_type: PolicyType;
  version_label: string;
  effective_date: string;
  title: string;
  summary: string;
  change_highlights: string[];
  full_policy_url: string | null;
  status: Status;
  scheduled_for: string | null;
  sent_at: string | null;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

const POLICY_LABEL: Record<PolicyType, string> = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  cookies: "Cookie Policy",
  billing: "Billing & Payment Terms",
  combined: "Combined Agreements",
};

const STATUS_VARIANT: Record<Status, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  scheduled: "secondary",
  sending: "default",
  sent: "default",
  cancelled: "destructive",
};

const emptyDraft = {
  policy_type: "terms" as PolicyType,
  version_label: "",
  effective_date: format(new Date(), "yyyy-MM-dd"),
  title: "",
  summary: "",
  change_highlights: [""] as string[],
  full_policy_url: "",
};

export function PolicyNotificationsManager() {
  const qc = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<typeof emptyDraft & { id?: string }>(emptyDraft);
  const [sendConfirm, setSendConfirm] = useState<Announcement | null>(null);

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["policy-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policy_change_announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Announcement[];
    },
  });

  const saveDraft = useMutation({
    mutationFn: async (d: typeof draft) => {
      const payload = {
        policy_type: d.policy_type,
        version_label: d.version_label.trim(),
        effective_date: d.effective_date,
        title: d.title.trim(),
        summary: d.summary.trim(),
        change_highlights: d.change_highlights.map((h) => h.trim()).filter(Boolean),
        full_policy_url: d.full_policy_url.trim() || null,
      };
      if (!payload.version_label || !payload.title || !payload.summary) {
        throw new Error("Version, title, and summary are required");
      }
      if (d.id) {
        const { error } = await supabase
          .from("policy_change_announcements")
          .update(payload)
          .eq("id", d.id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("policy_change_announcements")
          .insert({ ...payload, created_by: u.user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Announcement saved");
      setEditorOpen(false);
      setDraft(emptyDraft);
      qc.invalidateQueries({ queryKey: ["policy-announcements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendNow = useMutation({
    mutationFn: async ({ id, testOnly }: { id: string; testOnly?: boolean }) => {
      const { data, error } = await supabase.functions.invoke("send-policy-change-notification", {
        body: { announcementId: id, testOnly: !!testOnly },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, vars) => {
      toast.success(
        vars.testOnly
          ? "Test email sent to your address"
          : `Sent to ${data?.sent ?? 0} of ${data?.recipients ?? 0} users`,
      );
      setSendConfirm(null);
      qc.invalidateQueries({ queryKey: ["policy-announcements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("policy_change_announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["policy-announcements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setDraft(emptyDraft);
    setEditorOpen(true);
  };
  const openEdit = (a: Announcement) => {
    setDraft({
      id: a.id,
      policy_type: a.policy_type,
      version_label: a.version_label,
      effective_date: a.effective_date,
      title: a.title,
      summary: a.summary,
      change_highlights: a.change_highlights.length ? a.change_highlights : [""],
      full_policy_url: a.full_policy_url ?? "",
    });
    setEditorOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" /> Policy Change Notifications
            </CardTitle>
            <CardDescription>
              Send Terms / Privacy / Cookies / Billing change notices to every active user. These
              are legally required account notifications — not marketing.
            </CardDescription>
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="w-4 h-4" /> New Announcement
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !announcements?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No announcements yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline" className="text-xs">
                          {POLICY_LABEL[a.policy_type]}
                        </Badge>
                        <Badge variant={STATUS_VARIANT[a.status]} className="text-xs capitalize">
                          {a.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {a.version_label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          effective {a.effective_date}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm">{a.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {a.summary}
                      </p>
                      {a.status === "sent" && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Sent {a.sent_at && format(new Date(a.sent_at), "PPp")} —{" "}
                          {a.sent_count}/{a.recipient_count} delivered
                          {a.failed_count > 0 && ` · ${a.failed_count} failed`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {a.status === "draft" && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => openEdit(a)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => sendNow.mutate({ id: a.id, testOnly: true })}
                            disabled={sendNow.isPending}
                            title="Send test to me"
                          >
                            Test
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setSendConfirm(a)}
                            className="gap-1"
                          >
                            <Send className="w-3.5 h-3.5" /> Send
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Delete this draft?")) remove.mutate(a.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit Announcement" : "New Policy Change Announcement"}</DialogTitle>
            <DialogDescription>
              Drafts are not sent automatically. Use Test to email yourself, then Send to notify all users.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Policy Type</Label>
                  <Select
                    value={draft.policy_type}
                    onValueChange={(v) => setDraft({ ...draft, policy_type: v as PolicyType })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(POLICY_LABEL) as PolicyType[]).map((k) => (
                        <SelectItem key={k} value={k}>{POLICY_LABEL[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Effective Date</Label>
                  <Input
                    type="date"
                    value={draft.effective_date}
                    onChange={(e) => setDraft({ ...draft, effective_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Version Label</Label>
                <Input
                  placeholder="e.g. v2.3 — 2026-05-23"
                  value={draft.version_label}
                  onChange={(e) => setDraft({ ...draft, version_label: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email Subject / Title</Label>
                <Input
                  placeholder="We've updated our Terms of Service"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Summary (shown in email body)</Label>
                <Textarea
                  rows={3}
                  placeholder="Brief one-paragraph summary of what changed and why."
                  value={draft.summary}
                  onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>What's Changing (one bullet per line)</Label>
                <Textarea
                  rows={5}
                  placeholder={"Clarified data retention period for ITAR-controlled records\nUpdated payment dispute window from 30 to 60 days"}
                  value={draft.change_highlights.join("\n")}
                  onChange={(e) =>
                    setDraft({ ...draft, change_highlights: e.target.value.split("\n") })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Full Policy URL (optional)</Label>
                <Input
                  placeholder="https://jobline.ai/terms"
                  value={draft.full_policy_url}
                  onChange={(e) => setDraft({ ...draft, full_policy_url: e.target.value })}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={() => saveDraft.mutate(draft)} disabled={saveDraft.isPending}>
              {saveDraft.isPending ? "Saving…" : "Save Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send confirm */}
      <Dialog open={!!sendConfirm} onOpenChange={(o) => !o && setSendConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Send to all users?
            </DialogTitle>
            <DialogDescription>
              This will email <strong>every active user</strong> with a confirmed email address.
              Each user receives one email — duplicates are blocked. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {sendConfirm && (
            <div className="rounded-md border p-3 text-sm space-y-1 bg-muted/30">
              <div><strong>{sendConfirm.title}</strong></div>
              <div className="text-xs text-muted-foreground">
                {POLICY_LABEL[sendConfirm.policy_type]} · {sendConfirm.version_label} · effective {sendConfirm.effective_date}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSendConfirm(null)}>Cancel</Button>
            <Button
              onClick={() => sendConfirm && sendNow.mutate({ id: sendConfirm.id })}
              disabled={sendNow.isPending}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {sendNow.isPending ? "Sending…" : "Send to all users"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
