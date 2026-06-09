import { useState } from "react";
import { useUrlState } from "@/hooks/useUrlState";
import { useGlobalUpdates, GlobalUpdate } from "@/hooks/useGlobalUpdates";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import {
  Megaphone, Plus, Edit, Trash2, Loader2, RefreshCw, Check,
  Rocket, Bug, Lightbulb, AlertTriangle, Shield, Wrench, Eye, EyeOff
} from "lucide-react";

const categoryOptions = [
  { value: "feature", label: "Feature", icon: Rocket },
  { value: "improvement", label: "Improvement", icon: Lightbulb },
  { value: "bug_fix", label: "Bug Fix", icon: Bug },
  { value: "system_notice", label: "System Notice", icon: AlertTriangle },
  { value: "security", label: "Security", icon: Shield },
  { value: "maintenance", label: "Maintenance", icon: Wrench },
];

const statusOptions = ["live", "scheduled", "investigating", "resolved", "deprecated"];
const impactOptions = ["low", "medium", "high", "critical"];

const impactColors: Record<string, string> = {
  low: "text-status-ok", medium: "text-warning", high: "text-priority-urgent", critical: "text-status-critical",
};

const categoryColors: Record<string, string> = {
  feature: "bg-status-waiting/10 text-status-waiting border-status-waiting/30",
  improvement: "bg-warning/10 text-warning border-warning/30",
  bug_fix: "bg-status-critical/10 text-status-critical border-status-critical/30",
  system_notice: "bg-priority-urgent/10 text-priority-urgent border-priority-urgent/30",
  security: "bg-role-org-owner/10 text-role-org-owner border-role-org-owner/30",
  maintenance: "bg-muted text-muted-foreground border-border",
};

function UpdateForm({
  entry,
  onSave,
  onCancel,
  versionSuggestion,
}: {
  entry?: GlobalUpdate;
  onSave: (data: Partial<GlobalUpdate>) => Promise<boolean>;
  onCancel: () => void;
  versionSuggestion: any;
}) {
  const [title, setTitle] = useState(entry?.title || "");
  const [summary, setSummary] = useState(entry?.summary || "");
  const [fullDescription, setFullDescription] = useState(entry?.full_description || "");
  const [versionNumber, setVersionNumber] = useState(entry?.version_number || "");
  const [category, setCategory] = useState<string>(entry?.category || "improvement");
  const [status, setStatus] = useState<string>(entry?.status || "scheduled");
  const [impactLevel, setImpactLevel] = useState<string>(entry?.impact_level || "low");
  const [affectedModules, setAffectedModules] = useState(entry?.affected_modules?.join(", ") || "");
  const [howItHelps, setHowItHelps] = useState(entry?.how_it_helps_users || "");
  const [issuesAddressed, setIssuesAddressed] = useState(entry?.issues_addressed?.join("\n") || "");
  const [isVisible, setIsVisible] = useState(entry?.is_visible_to_users ?? false);
  const [requiresAck, setRequiresAck] = useState(entry?.requires_acknowledgement ?? false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const data: Partial<GlobalUpdate> = {
      title: title.trim(),
      summary: summary.trim() || null,
      full_description: fullDescription.trim() || null,
      version_number: versionNumber.trim() || null,
      category: category as GlobalUpdate["category"],
      status: status as GlobalUpdate["status"],
      impact_level: impactLevel as GlobalUpdate["impact_level"],
      affected_modules: affectedModules.split(",").map((s) => s.trim()).filter(Boolean),
      how_it_helps_users: howItHelps.trim() || null,
      issues_addressed: issuesAddressed.split("\n").map((s) => s.trim()).filter(Boolean),
      is_visible_to_users: isVisible,
      requires_acknowledgement: requiresAck,
      published_at: isVisible && !entry?.is_visible_to_users ? new Date().toISOString() : entry?.published_at,
    };
    const ok = await onSave(data);
    setSaving(false);
    if (ok) onCancel();
  };

  const suggestions = typeof versionSuggestion === "object" ? versionSuggestion : null;

  return (
    <ScrollArea className="max-h-[70vh] pr-2">
      <div className="space-y-4 p-1">
        <div className="space-y-2">
          <Label>Title *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What changed?" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Version</Label>
            <Input value={versionNumber} onChange={(e) => setVersionNumber(e.target.value)} placeholder="v1.0.0" />
            {suggestions && !entry && (
              <div className="flex gap-1 flex-wrap">
                {Object.entries(suggestions).map(([key, val]) => (
                  <Badge
                    key={key}
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-secondary"
                    onClick={() => setVersionNumber(val as string)}
                  >
                    {key}: {val as string}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Impact Level</Label>
            <Select value={impactLevel} onValueChange={setImpactLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {impactOptions.map((i) => (
                  <SelectItem key={i} value={i} className="capitalize">{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Summary</Label>
          <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Short summary..." />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Full Description (Markdown)</Label>
            <Button variant="ghost" size="sm" onClick={() => setPreviewMode(!previewMode)}>
              {previewMode ? "Edit" : "Preview"}
            </Button>
          </div>
          {previewMode ? (
            <div className="prose prose-sm dark:prose-invert max-w-none border rounded-md p-3 min-h-[100px] bg-muted/30">
              <ReactMarkdown>{fullDescription || "*No content*"}</ReactMarkdown>
            </div>
          ) : (
            <Textarea value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} placeholder="Detailed description..." rows={5} />
          )}
        </div>

        <div className="space-y-2">
          <Label>Affected Modules (comma-separated)</Label>
          <Input value={affectedModules} onChange={(e) => setAffectedModules(e.target.value)} placeholder="Shift Handoff, Work Orders" />
        </div>

        <div className="space-y-2">
          <Label>How It Helps Users</Label>
          <Textarea value={howItHelps} onChange={(e) => setHowItHelps(e.target.value)} placeholder="Explain the user benefit..." rows={2} />
        </div>

        <div className="space-y-2">
          <Label>Issues Addressed (one per line)</Label>
          <Textarea value={issuesAddressed} onChange={(e) => setIssuesAddressed(e.target.value)} placeholder="Fixed login timeout\nResolved data sync delay" rows={3} />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch checked={isVisible} onCheckedChange={setIsVisible} />
            <Label className="flex items-center gap-1">
              {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              Visible to Users
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={requiresAck} onCheckedChange={setRequiresAck} />
            <Label>Requires Acknowledgement</Label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            {entry ? "Update" : "Create"}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

export function SystemUpdatesManager() {
  const { isAdmin } = useAdminAccess();
  const { updates, loading, fetchUpdates, createUpdate, editUpdate, deleteUpdate, suggestNextVersion } = useGlobalUpdates();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<GlobalUpdate | undefined>();  const [filterCategory, setFilterCategory] = useUrlState<string>("cat", "all");

  const filtered = filterCategory === "all" ? updates : updates.filter((u) => u.category === filterCategory);
  const publishedCount = updates.filter((u) => u.is_visible_to_users).length;
  const draftCount = updates.filter((u) => !u.is_visible_to_users).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">System Updates</CardTitle>
          <Badge variant="outline" className="text-xs">{updates.length} total</Badge>
          <Badge className="text-xs bg-green-500/10 text-green-600 border-green-300" variant="outline">{publishedCount} published</Badge>
          <Badge variant="outline" className="text-xs text-muted-foreground">{draftCount} drafts</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchUpdates} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingEntry(undefined); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> New Update</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEntry ? "Edit System Update" : "New System Update"}</DialogTitle>
              </DialogHeader>
              <UpdateForm
                entry={editingEntry}
                onSave={editingEntry ? (data) => editUpdate(editingEntry.id, data) : createUpdate}
                onCancel={() => { setDialogOpen(false); setEditingEntry(undefined); }}
                versionSuggestion={suggestNextVersion()}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {["all", ...categoryOptions.map((c) => c.value)].map((c) => (
            <Badge
              key={c}
              variant={filterCategory === c ? "default" : "outline"}
              className="cursor-pointer text-xs capitalize"
              onClick={() => setFilterCategory(c)}
            >
              {c === "all" ? "All" : c.replace("_", " ")}
            </Badge>
          ))}
        </div>

        {loading && updates.length === 0 ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Megaphone className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No updates found</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {filtered.map((entry) => {
                const cfg = categoryOptions.find((c) => c.value === entry.category) || categoryOptions[1];
                const Icon = cfg.icon;
                const colorClass = categoryColors[entry.category] || "";
                return (
                  <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{entry.title}</span>
                        {entry.version_number && <Badge variant="outline" className="text-xs font-mono">{entry.version_number}</Badge>}
                        <Badge variant="outline" className={`text-xs ${colorClass}`}>{cfg.label}</Badge>
                        <Badge variant="outline" className={`text-xs capitalize ${impactColors[entry.impact_level]}`}>{entry.impact_level}</Badge>
                        {entry.is_visible_to_users ? (
                          <Badge className="text-xs bg-green-500/10 text-green-600 border-green-300" variant="outline">
                            <Eye className="w-3 h-3 mr-1" />Published
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            <EyeOff className="w-3 h-3 mr-1" />Draft
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs capitalize">{entry.status}</Badge>
                      </div>
                      {entry.summary && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{entry.summary}</p>}
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Rev #{entry.revision_number} · {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingEntry(entry); setDialogOpen(true); }}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteUpdate(entry.id)}>
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
