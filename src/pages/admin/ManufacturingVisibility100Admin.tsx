import { useState } from "react";
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
import { Loader2, ExternalLink, CheckCircle2, XCircle, Eye } from "lucide-react";
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

export default function ManufacturingVisibility100Admin() {
  const [tab, setTab] = useState<Status | "all">("new");
  const [selected, setSelected] = useState<Nomination | null>(null);
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["mfg-100-nominations", tab],
    queryFn: async (): Promise<Nomination[]> => {
      let q = supabase.from("mfg_100_nominations" as any).select("*").order("created_at", { ascending: false });
      if (tab !== "all") q = q.eq("status", tab);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Nomination[];
    },
  });

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
      toast.success("Nomination updated");
      setSelected(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  const counts = useQuery({
    queryKey: ["mfg-100-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mfg_100_nominations" as any).select("status");
      if (error) throw error;
      const c: Record<string, number> = {};
      (data ?? []).forEach((r: any) => { c[r.status] = (c[r.status] || 0) + 1; });
      return c;
    },
  });

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <Helmet>
        <title>Manufacturing 100 — Nominations Review</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manufacturing Visibility 100</h1>
        <p className="text-muted-foreground mt-1">
          Review nominations, move them through the editorial pipeline, and publish honorees.
        </p>
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
        <CardContent>
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
              ) : rows.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No nominations in this bucket.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nominee</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Nominator</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(n => (
                      <TableRow key={n.id}>
                        <TableCell>
                          <div className="font-medium">{n.nominee_name}</div>
                          {n.nominee_company && (
                            <div className="text-xs text-muted-foreground">{n.nominee_company}</div>
                          )}
                        </TableCell>
                        <TableCell><Badge variant="outline">{n.category}</Badge></TableCell>
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
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

                <div className="grid grid-cols-2 gap-3">
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
                    <Label htmlFor="blurb">Public blurb (shown on /manufacturing-100/honorees)</Label>
                    <Textarea
                      id="blurb"
                      rows={3}
                      value={selected.display_blurb ?? ""}
                      onChange={(e) => setSelected({ ...selected, display_blurb: e.target.value })}
                      placeholder="One sentence editorial summary (publish-ready)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
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
                    <div className="grid grid-cols-2 gap-2">
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

              <DialogFooter className="gap-2">
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
    </div>
  );
}
