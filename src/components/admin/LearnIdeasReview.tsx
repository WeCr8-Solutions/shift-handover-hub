import { useCallback, useEffect, useMemo, useState } from "react";
import { useUrlState } from "@/hooks/useUrlState";
import { formatDistanceToNow } from "date-fns";
import { Lightbulb, Loader2, Search, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type LearnIdeaStatus = "pending" | "reviewed" | "approved" | "rejected" | "spam";

interface LearnIdeaRecord {
  id: string;
  term_id: string;
  term_name: string;
  role: string | null;
  title: string;
  problem: string;
  solution: string | null;
  user_id: string | null;
  org_id: string | null;
  created_at: string;
  status: LearnIdeaStatus;
  reviewer_id: string | null;
  reviewer_name: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  source_path: string | null;
  submitter_name: string | null;
  submitter_email: string | null;
  spam_score: number;
}

const statusColors: Record<LearnIdeaStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  reviewed: "bg-status-waiting/10 text-status-waiting border-status-waiting/30",
  approved: "bg-status-ok/10 text-status-ok border-status-ok/30",
  rejected: "bg-status-critical/10 text-status-critical border-status-critical/30",
  spam: "bg-destructive/10 text-destructive border-destructive/30",
};

export function LearnIdeasReview() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<LearnIdeaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<LearnIdeaRecord | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [statusFilter, setStatusFilter] = useUrlState<LearnIdeaStatus | "all">("s", "pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchIdeas = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("learning_ideas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Unable to load idea review queue",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setIdeas((data ?? []) as LearnIdeaRecord[]);
    }

    setLoading(false);
  }, [toast, user]);

  useEffect(() => {
    void fetchIdeas();
  }, [fetchIdeas]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const channel = supabase
      .channel("admin-learning-ideas")
      .on("postgres_changes", { event: "*", schema: "public", table: "learning_ideas" }, () => {
        void fetchIdeas();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchIdeas, user]);

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchesStatus = statusFilter === "all" || idea.status === statusFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        query.length === 0 ||
        idea.title.toLowerCase().includes(query) ||
        idea.term_name.toLowerCase().includes(query) ||
        idea.problem.toLowerCase().includes(query) ||
        (idea.submitter_name ?? "").toLowerCase().includes(query) ||
        (idea.submitter_email ?? "").toLowerCase().includes(query);

      return matchesStatus && matchesQuery;
    });
  }, [ideas, searchQuery, statusFilter]);

  const openReviewDialog = (idea: LearnIdeaRecord) => {
    setSelectedIdea(idea);
    setReviewNotes(idea.review_notes ?? "");
    setReviewDialogOpen(true);
  };

  const handleReviewAction = async (status: LearnIdeaStatus) => {
    if (!selectedIdea || !user) {
      return;
    }

    setIsSaving(true);
    const reviewerName = profile?.display_name ?? user.email ?? "JobLine staff";
    const { error } = await (supabase as any)
      .from("learning_ideas")
      .update({
        status,
        reviewer_id: user.id,
        reviewer_name: reviewerName,
        review_notes: reviewNotes.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", selectedIdea.id);

    setIsSaving(false);

    if (error) {
      toast({
        title: "Unable to update idea review",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Idea review updated",
      description: `Submission marked as ${status}.`,
    });
    setReviewDialogOpen(false);
    setSelectedIdea(null);
    await fetchIdeas();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Learn Idea Review
        </CardTitle>
        <CardDescription>
          Staff queue for Learning Center idea submissions. New ideas land here for SDK admin and JobLine staff review before any follow-up.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[220px_1fr]">
          <div>
            <Label htmlFor="idea-status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as LearnIdeaStatus | "all")}>
              <SelectTrigger id="idea-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ideas</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="idea-search">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="idea-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
                placeholder="Search title, term, problem, or submitter"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 rounded-md border border-border p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading submitted ideas...
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
            No idea submissions match the current filters.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIdeas.map((idea) => (
              <div key={idea.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={statusColors[idea.status]}>{idea.status}</Badge>
                      <Badge variant="outline">{idea.term_name}</Badge>
                      {idea.role && <Badge variant="outline">{idea.role}</Badge>}
                      {idea.spam_score > 0 && (
                        <Badge variant="outline" className="border-destructive/40 text-destructive">
                          Spam score {idea.spam_score}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{idea.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{idea.problem}</p>
                      {idea.solution && (
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          <span className="font-medium text-foreground">Suggested follow-up:</span> {idea.solution}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Submitted {formatDistanceToNow(new Date(idea.created_at), { addSuffix: true })}
                      </span>
                      <span>{idea.submitter_name ?? idea.submitter_email ?? "Unknown submitter"}</span>
                      {idea.source_path && <span>{idea.source_path}</span>}
                      {idea.reviewer_name && <span>Reviewed by {idea.reviewer_name}</span>}
                    </div>
                    {idea.review_notes && (
                      <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Review notes:</span> {idea.review_notes}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" onClick={() => openReviewDialog(idea)}>
                      Review
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review learn idea submission</DialogTitle>
              <DialogDescription>
                Mark this submission for follow-up, approve it as useful feedback, reject it, or classify it as spam.
              </DialogDescription>
            </DialogHeader>

            {selectedIdea && (
              <div className="space-y-4">
                <div className="rounded-md border border-border bg-muted/20 p-4">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{selectedIdea.term_name}</Badge>
                    {selectedIdea.role && <Badge variant="outline">{selectedIdea.role}</Badge>}
                    {selectedIdea.source_path && <Badge variant="outline">{selectedIdea.source_path}</Badge>}
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{selectedIdea.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedIdea.problem}</p>
                  {selectedIdea.solution && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      <span className="font-medium text-foreground">Suggested follow-up:</span> {selectedIdea.solution}
                    </p>
                  )}
                </div>

                <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 text-foreground">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    Abuse review
                  </div>
                  <p className="mt-2">Spam score: {selectedIdea.spam_score}</p>
                  <p>Submitter: {selectedIdea.submitter_name ?? selectedIdea.submitter_email ?? "Unknown"}</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="learn-idea-review-notes">Review notes</Label>
                  <Textarea
                    id="learn-idea-review-notes"
                    value={reviewNotes}
                    onChange={(event) => setReviewNotes(event.target.value)}
                    placeholder="Add internal review notes or follow-up instructions"
                    className="min-h-[120px]"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-wrap gap-2 sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => void handleReviewAction("reviewed")} disabled={isSaving}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Mark reviewed
                </Button>
                <Button onClick={() => void handleReviewAction("approved")} disabled={isSaving}>
                  Approve
                </Button>
                <Button variant="secondary" onClick={() => void handleReviewAction("rejected")} disabled={isSaving}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button variant="destructive" onClick={() => void handleReviewAction("spam")} disabled={isSaving}>
                  Spam
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}