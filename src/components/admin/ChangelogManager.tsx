import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  BookOpen, Plus, Edit, Trash2, Loader2, RefreshCw,
  Rocket, Bug, Lightbulb, AlertTriangle, Check
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { useDraftPersistence } from "@/hooks/useDraftPersistence";

interface ChangelogEntry {
  id: string;
  title: string;
  description: string | null;
  version: string | null;
  change_type: string;
  author_id: string | null;
  author_name: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const changeTypeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  feature: { label: "Feature", icon: Rocket, color: "bg-status-waiting/10 text-status-waiting border-status-waiting/30" },
  fix: { label: "Fix", icon: Bug, color: "bg-status-critical/10 text-status-critical border-status-critical/30" },
  improvement: { label: "Improvement", icon: Lightbulb, color: "bg-warning/10 text-warning border-warning/30" },
  breaking: { label: "Breaking", icon: AlertTriangle, color: "bg-destructive/10 text-destructive border-destructive/30" },
};

function ChangelogForm({
  entry,
  onSave,
  onCancel,
}: {
  entry?: ChangelogEntry;
  onSave: (data: Partial<ChangelogEntry>) => Promise<void>;
  onCancel: () => void;
}) {
  // Drafts auto-persist while creating new entries (cleared on save). Edits skip drafts.
  const draftKey = `changelog:${entry?.id ?? "new"}`;
  const [draft, setDraft, { clear: clearDraft }] = useDraftPersistence(
    draftKey,
    {
      title: entry?.title || "",
      description: entry?.description || "",
      version: entry?.version || "",
      changeType: entry?.change_type || "improvement",
      isPublished: entry?.is_published || false,
    },
  );
  const { title, description, version, changeType, isPublished } = draft;
  const setTitle = (v: string) => setDraft((p) => ({ ...p, title: v }));
  const setDescription = (v: string) => setDraft((p) => ({ ...p, description: v }));
  const setVersion = (v: string) => setDraft((p) => ({ ...p, version: v }));
  const setChangeType = (v: string) => setDraft((p) => ({ ...p, changeType: v }));
  const setIsPublished = (v: boolean) => setDraft((p) => ({ ...p, isPublished: v }));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      description: description.trim() || null,
      version: version.trim() || null,
      change_type: changeType,
      is_published: isPublished,
      published_at: isPublished && !entry?.is_published ? new Date().toISOString() : entry?.published_at,
    });
    clearDraft();
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What changed?" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Version</Label>
          <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g. v1.2.0" />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={changeType} onValueChange={setChangeType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(changeTypeConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description..." rows={4} />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isPublished} onCheckedChange={setIsPublished} />
        <Label>Published</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          {entry ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

export function ChangelogManager() {
  const { user } = useAuth();
  const { isAdmin } = useAdminAccess();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ChangelogEntry | undefined>();

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("changelogs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("Error fetching changelogs:", error);
    } else {
      setEntries((data || []) as ChangelogEntry[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleSave = async (data: Partial<ChangelogEntry>) => {
    if (editingEntry) {
      const { error } = await supabase
        .from("changelogs")
        .update(data as any)
        .eq("id", editingEntry.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Changelog updated");
    } else {
      const profile = user ? (await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle()).data : null;
      const { error } = await supabase
        .from("changelogs")
        .insert({ ...data, author_id: user?.id, author_name: profile?.display_name || user?.email } as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Changelog created");
    }
    setDialogOpen(false);
    setEditingEntry(undefined);
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("changelogs").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Changelog deleted");
    fetchEntries();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Changelog</CardTitle>
          <Badge variant="outline" className="text-xs">{entries.length} entries</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchEntries} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingEntry(undefined); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> New Entry</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEntry ? "Edit Changelog" : "New Changelog Entry"}</DialogTitle>
              </DialogHeader>
              <ChangelogForm
                entry={editingEntry}
                onSave={handleSave}
                onCancel={() => { setDialogOpen(false); setEditingEntry(undefined); }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading && entries.length === 0 ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <AdminEmptyState
            title="No changelog entries yet"
            description="Publish your first release note to keep the org informed."
            showPermissionHint={!isAdmin}
          />
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {entries.map((entry) => {
                const cfg = changeTypeConfig[entry.change_type] || changeTypeConfig.improvement;
                const Icon = cfg.icon;
                return (
                  <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className={`p-2 rounded-lg ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{entry.title}</span>
                        {entry.version && <Badge variant="outline" className="text-xs">{entry.version}</Badge>}
                        <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                        {entry.is_published ? (
                          <Badge className="text-xs bg-status-ok/10 text-status-ok border-status-ok/30" variant="outline">Published</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Draft</Badge>
                        )}
                      </div>
                      {entry.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{entry.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {entry.author_name || "Unknown"} · {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingEntry(entry); setDialogOpen(true); }}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(entry.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
