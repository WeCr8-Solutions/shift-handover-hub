import { useMemo, useState } from "react";
import { useUrlState } from "@/hooks/useUrlState";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, ExternalLink, CheckCircle2, XCircle, Eye, Plus, Trash2, Rocket, Search,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Status = "new" | "under_review" | "shortlisted" | "declined" | "published";

interface Nomination {
  id: string;
  created_at: string;
  nominee_name: string;
  nominee_company: string | null;
  nominee_role: string | null;
  nominee_linkedin: string | null;
  nominee_website: string | null;
  category: string;
  reason: string;
  evidence_links: any;
  nominator_name: string;
  nominator_email: string;
  interest_flags: any;
  status: Status;
  notes: string | null;
  display_blurb: string | null;
  rank: number | null;
  previous_rank: number | null;
  published_at: string | null;
  slug: string | null;
  score_impact: number | null;
  score_innovation: number | null;
  score_visibility: number | null;
  score_education: number | null;
  score_smb: number | null;
  score_momentum: number | null;
  score_total: number | null;
  edition: string | null;
  archived_at: string | null;
}

const SCORE_FIELDS: { key: keyof Nomination; label: string; max: number }[] = [
  { key: "score_impact",     label: "Practical impact",      max: 25 },
  { key: "score_innovation", label: "Modernization",         max: 20 },
  { key: "score_visibility", label: "Public visibility",     max: 20 },
  { key: "score_education",  label: "Education / mentorship", max: 15 },
  { key: "score_smb",        label: "SMB relevance",         max: 10 },
  { key: "score_momentum",   label: "Momentum (12 mo)",      max: 10 },
];

const STATUS_TABS: { value: Status | "all"; label: string }[] = [
  { value: "new", label: "New" },
  { value: "under_review", label: "Under Review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "published", label: "Published" },
  { value: "declined", label: "Declined" },
  { value: "all", label: "All" },
];

const STATUS_COLORS: Record<Status, string> = {
  new: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  under_review: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  shortlisted: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  published: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  declined: "bg-muted text-muted-foreground",
};

const CATEGORIES = [
  "smb_owner",
  "machinist",
  "educator",
  "creator",
  "founder",
  "executive",
  "engineer",
  "advocate",
  "other",
];

const EMPTY_NEW: Partial<Nomination> = {
  nominee_name: "",
  nominee_company: "",
  nominee_role: "",
  nominee_linkedin: "",
  nominee_website: "",
  category: "smb_owner",
  reason: "",
  display_blurb: "",
  edition: "2026",
  status: "shortlisted",
};

export default function ManufacturingVisibility100Admin() {
  const [tab, setTab] = useUrlState<Status | "all">("tab", "new");
  const [selected, setSelected] = useState<Nomination | null>(null);
  const [creating, setCreating] = useState<Partial<Nomination> | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useUrlState<"recent" | "score" | "rank">("sort", "recent");
  const [edition, setEdition] = useUrlState<string>("ed", "2026");
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["mfg-100-nominations", tab],
    queryFn: async (): Promise<Nomination[]> => {
      let q = supabase.from("mfg_100_nominations" as any).select("*").is("archived_at", null);
      if (tab !== "all") q = q.eq("status", tab);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Nomination[];
    },
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const arr = s
      ? rows.filter(r =>
          [r.nominee_name, r.nominee_company, r.nominee_role, r.category, r.nominator_name, r.nominator_email]
            .filter(Boolean)
            .some(v => String(v).toLowerCase().includes(s)),
        )
      : rows;
    return [...arr].sort((a, b) => {
      if (sort === "score") return (b.score_total ?? 0) - (a.score_total ?? 0);
      if (sort === "rank")  return (a.rank ?? 999) - (b.rank ?? 999);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [rows, search, sort]);

  const update = useMutation({
    mutationFn: async (patch: Partial<Nomination> & { id: string }) => {
      const { id, ...rest } = patch;
      const payload: any = { ...rest, reviewed_at: new Date().toISOString() };
      if (rest.status === "published" && !rest.published_at) {
        payload.published_at = new Date().toISOString();
      }
      const { error } = await supabase.from("mfg_100_nominations" as any).update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mfg-100-nominations"] });
      qc.invalidateQueries({ queryKey: ["mfg-100-counts"] });
      toast.success("Nomination updated");
      setSelected(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  const create = useMutation({
    mutationFn: async (payload: Partial<Nomination>) => {
      const { data: u } = await supabase.auth.getUser();
      const editorEmail = u.user?.email ?? "editor@jobline.ai";
      const editorName  = u.user?.user_metadata?.full_name ?? "Editorial Team";
      const insert: any = {
        nominee_name: payload.nominee_name?.trim(),
        nominee_company: payload.nominee_company || null,
        nominee_role: payload.nominee_role || null,
        nominee_linkedin: payload.nominee_linkedin || null,
        nominee_website: payload.nominee_website || null,
        category: payload.category || "smb_owner",
        reason: payload.reason?.trim() || "Added directly by editorial team.",
        display_blurb: payload.display_blurb || null,
        edition: payload.edition || "2026",
        status: payload.status || "shortlisted",
        nominator_name: editorName,
        nominator_email: editorEmail,
        consent: true,
        evidence_links: [],
        interest_flags: { editor_added: true },
      };
      const { error } = await supabase.from("mfg_100_nominations" as any).insert(insert);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mfg-100-nominations"] });
      qc.invalidateQueries({ queryKey: ["mfg-100-counts"] });
      toast.success("Honoree added");
      setCreating(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Create failed"),
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mfg_100_nominations" as any)
        .update({ archived_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mfg-100-nominations"] });
      qc.invalidateQueries({ queryKey: ["mfg-100-counts"] });
      toast.success("Archived");
      setSelected(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Archive failed"),
  });

  const publishEdition = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("mfg_100_publish_edition" as any, { _edition: edition } as any);
      if (error) throw error;
      return data as number;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["mfg-100-nominations"] });
      qc.invalidateQueries({ queryKey: ["mfg-100-counts"] });
      toast.success(`Published ${n ?? 0} honorees for ${edition}`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Publish failed"),
  });

  const counts = useQuery({
    queryKey: ["mfg-100-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mfg_100_nominations" as any)
        .select("status, archived_at");
      if (error) throw error;
      const c: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        if (r.archived_at) return;
        c[r.status] = (c[r.status] || 0) + 1;
      });
      return c;
    },
  });

  return (
    <div className="container max-w-7xl px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
      <Helmet>
        <title>Manufacturing 100 — Nominations Review</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Manufacturing Visibility 100</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Review nominations, add honorees directly, rank them, and publish the edition.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={edition}
            onChange={(e) => setEdition(e.target.value)}
            className="w-20 sm:w-24"
            aria-label="Edition"
          />
          <Button
            variant="outline"
            onClick={() => publishEdition.mutate()}
            disabled={publishEdition.isPending}
          >
            {publishEdition.isPending
              ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              : <Rocket className="h-4 w-4 mr-1" />}
            <span className="hidden sm:inline">Publish edition</span>
            <span className="sm:hidden">Publish</span>
          </Button>
          <Button onClick={() => setCreating({ ...EMPTY_NEW })}>
            <Plus className="h-4 w-4 mr-1" /> Add honoree
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline</CardTitle>
          <CardDescription>
            {counts.data && (
              <span className="flex flex-wrap gap-3 mt-2">
                {STATUS_TABS.filter(s => s.value !== "all").map(s => (
                  <span key={s.value} className="text-sm">
                    <strong>{counts.data?.[s.value] ?? 0}</strong> {s.label}
                  </span>
                ))}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search nominee, company, nominator…"
                className="pl-8"
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as any)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="score">Highest score</SelectItem>
                <SelectItem value="rank">Lowest rank #</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="flex-wrap h-auto">
              {STATUS_TABS.map(s => (
                <TabsTrigger key={s.value} value={s.value}>{s.label}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={tab} className="mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No nominations in this bucket.</p>
              ) : (
                <div className="-mx-3 sm:mx-0 overflow-x-auto">
                  <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Rank</TableHead>
                      <TableHead>Nominee</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="w-[70px]">Score</TableHead>
                      <TableHead>Nominator</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(n => (
                      <TableRow key={n.id}>
                        <TableCell className="font-semibold tabular-nums">
                          {n.rank ? `#${n.rank}` : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{n.nominee_name}</div>
                          {n.nominee_company && (
                            <div className="text-xs text-muted-foreground">{n.nominee_company}</div>
                          )}
                        </TableCell>
                        <TableCell><Badge variant="outline">{n.category}</Badge></TableCell>
                        <TableCell className="tabular-nums text-sm">
                          {n.score_total != null && n.score_total > 0 ? `${n.score_total}/100` : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{n.nominator_name}</div>
                          <div className="text-xs text-muted-foreground">{n.nominator_email}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[n.status]}`}>
                            {n.status.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => setSelected(n)}>
                            <Eye className="h-4 w-4 mr-1" /> Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ---------- Review dialog ---------- */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100vw-1rem)] p-4 sm:p-6">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.nominee_name}</DialogTitle>
                <DialogDescription>
                  {selected.nominee_role && <>{selected.nominee_role} · </>}
                  {selected.nominee_company} · <Badge variant="outline" className="ml-1">{selected.category}</Badge>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Why they belong on the list</Label>
                  <p className="whitespace-pre-wrap mt-1">{selected.reason}</p>
                </div>

                {Array.isArray(selected.evidence_links) && selected.evidence_links.length > 0 && (
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Evidence</Label>
                    <ul className="mt-1 space-y-1">
                      {selected.evidence_links.map((l: string, i: number) => (
                        <li key={i}>
                          <a href={l} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> {l}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selected.nominee_linkedin && (
                    <a href={selected.nominee_linkedin} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> LinkedIn
                    </a>
                  )}
                  {selected.nominee_website && (
                    <a href={selected.nominee_website} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Website
                    </a>
                  )}
                </div>

                <div className="pt-3 border-t space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={selected.status}
                        onValueChange={(v) => setSelected({ ...selected, status: v as Status })}
                      >
                        <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="under_review">Under review</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edition-sel">Edition</Label>
                      <Input
                        id="edition-sel"
                        value={selected.edition ?? ""}
                        onChange={(e) => setSelected({ ...selected, edition: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={selected.slug ?? ""}
                      onChange={(e) => setSelected({ ...selected, slug: e.target.value })}
                      placeholder="auto-generated from name if blank"
                    />
                  </div>

                  <div>
                    <Label htmlFor="blurb">Public blurb (shown on /manufacturing-100/honorees)</Label>
                    <Textarea
                      id="blurb"
                      rows={3}
                      value={selected.display_blurb ?? ""}
                      onChange={(e) => setSelected({ ...selected, display_blurb: e.target.value })}
                      placeholder="One sentence editorial summary (publish-ready)"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="rank">Rank</Label>
                      <Input
                        id="rank"
                        type="number"
                        min={1}
                        max={100}
                        value={selected.rank ?? ""}
                        onChange={(e) => setSelected({ ...selected, rank: e.target.value ? parseInt(e.target.value) : null })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="prev-rank">Previous rank</Label>
                      <Input
                        id="prev-rank"
                        type="number"
                        min={1}
                        max={100}
                        value={selected.previous_rank ?? ""}
                        onChange={(e) => setSelected({ ...selected, previous_rank: e.target.value ? parseInt(e.target.value) : null })}
                      />
                    </div>
                  </div>

                  <div className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs uppercase text-muted-foreground">Editorial scoring</Label>
                      <span className="text-sm font-semibold tabular-nums">
                        {SCORE_FIELDS.reduce((sum, f) => sum + (Number(selected[f.key]) || 0), 0)}/100
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SCORE_FIELDS.map(f => (
                        <div key={String(f.key)}>
                          <Label htmlFor={String(f.key)} className="text-xs">
                            {f.label} <span className="text-muted-foreground">(0–{f.max})</span>
                          </Label>
                          <Input
                            id={String(f.key)}
                            type="number"
                            min={0}
                            max={f.max}
                            value={(selected[f.key] as number | null) ?? ""}
                            onChange={(e) => setSelected({ ...selected, [f.key]: e.target.value === "" ? null : Math.min(f.max, Math.max(0, parseInt(e.target.value) || 0)) } as Nomination)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Internal notes</Label>
                    <Textarea
                      id="notes"
                      rows={2}
                      value={selected.notes ?? ""}
                      onChange={(e) => setSelected({ ...selected, notes: e.target.value })}
                      placeholder="Editor-only notes"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Archive "${selected.nominee_name}"? This removes them from the editorial pipeline.`)) {
                      archive.mutate(selected.id);
                    }
                  }}
                  disabled={archive.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Archive
                </Button>
                <div className="flex-1" />
                <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
                <Button
                  variant="outline"
                  onClick={() => update.mutate({ id: selected.id, status: "declined" })}
                  disabled={update.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Decline
                </Button>
                <Button
                  onClick={() => update.mutate({
                    id: selected.id,
                    status: selected.status,
                    display_blurb: selected.display_blurb,
                    rank: selected.rank,
                    previous_rank: selected.previous_rank,
                    notes: selected.notes,
                    slug: selected.slug || null,
                    edition: selected.edition,
                    score_impact: selected.score_impact,
                    score_innovation: selected.score_innovation,
                    score_visibility: selected.score_visibility,
                    score_education: selected.score_education,
                    score_smb: selected.score_smb,
                    score_momentum: selected.score_momentum,
                  } as any)}
                  disabled={update.isPending}
                >
                  {update.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                  Save
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- Manual add dialog ---------- */}
      <Dialog open={!!creating} onOpenChange={(o) => !o && setCreating(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100vw-1rem)] p-4 sm:p-6">
          {creating && (
            <>
              <DialogHeader>
                <DialogTitle>Add honoree directly</DialogTitle>
                <DialogDescription>
                  Editorial entries skip the public nomination form and land straight in the pipeline.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="c-name">Name *</Label>
                    <Input id="c-name" value={creating.nominee_name ?? ""} onChange={(e) => setCreating({ ...creating, nominee_name: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="c-role">Role / title</Label>
                    <Input id="c-role" value={creating.nominee_role ?? ""} onChange={(e) => setCreating({ ...creating, nominee_role: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="c-company">Company / shop</Label>
                    <Input id="c-company" value={creating.nominee_company ?? ""} onChange={(e) => setCreating({ ...creating, nominee_company: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="c-cat">Category</Label>
                    <Select value={creating.category ?? "smb_owner"} onValueChange={(v) => setCreating({ ...creating, category: v })}>
                      <SelectTrigger id="c-cat"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="c-li">LinkedIn URL</Label>
                    <Input id="c-li" value={creating.nominee_linkedin ?? ""} onChange={(e) => setCreating({ ...creating, nominee_linkedin: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="c-web">Website</Label>
                    <Input id="c-web" value={creating.nominee_website ?? ""} onChange={(e) => setCreating({ ...creating, nominee_website: e.target.value })} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="c-reason">Why they belong on the list</Label>
                  <Textarea id="c-reason" rows={3} value={creating.reason ?? ""} onChange={(e) => setCreating({ ...creating, reason: e.target.value })} />
                </div>

                <div>
                  <Label htmlFor="c-blurb">Public blurb (optional)</Label>
                  <Textarea id="c-blurb" rows={2} value={creating.display_blurb ?? ""} onChange={(e) => setCreating({ ...creating, display_blurb: e.target.value })} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="c-ed">Edition</Label>
                    <Input id="c-ed" value={creating.edition ?? "2026"} onChange={(e) => setCreating({ ...creating, edition: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="c-status">Initial status</Label>
                    <Select value={creating.status ?? "shortlisted"} onValueChange={(v) => setCreating({ ...creating, status: v as Status })}>
                      <SelectTrigger id="c-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="under_review">Under review</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setCreating(null)}>Cancel</Button>
                <Button
                  onClick={() => {
                    if (!creating.nominee_name?.trim()) {
                      toast.error("Name is required");
                      return;
                    }
                    create.mutate(creating);
                  }}
                  disabled={create.isPending}
                >
                  {create.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                  Add to pipeline
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
