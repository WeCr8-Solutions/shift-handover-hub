import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePublicOperatorSocial, useViewerRelationship } from "@/hooks/useOperatorSocial";
import { UserPlus, UserCheck, UserX, Users, Quote, Heart, HeartOff, Pencil } from "lucide-react";

interface Props {
  username: string;
  recipientUserId: string;
  recipientName: string;
}

export function TalentSocialPanel({ username, recipientUserId, recipientName }: Props) {
  const { toast } = useToast();
  const { recommendations, counts, refresh: refreshPublic } = usePublicOperatorSocial(username);
  const {
    isViewerSelf,
    isAuthenticated,
    connectionStatus,
    isFollowing,
    myRecommendation,
    requestConnection,
    acceptConnection,
    removeConnection,
    toggleFollow,
    writeRecommendation,
    deleteMyRecommendation,
  } = useViewerRelationship(recipientUserId);

  const [recOpen, setRecOpen] = useState(false);
  const [body, setBody] = useState(myRecommendation?.body ?? "");
  const [relationship, setRelationship] = useState(myRecommendation?.relationship ?? "");
  const [busy, setBusy] = useState(false);

  const guard = (fn: () => Promise<void>) => async () => {
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Create a free account to connect, follow, or recommend." });
      return;
    }
    try {
      setBusy(true);
      await fn();
    } catch (err) {
      toast({ title: "Action failed", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const submitRec = async () => {
    if (body.trim().length < 10) {
      toast({ title: "Too short", description: "Recommendations must be at least 10 characters.", variant: "destructive" });
      return;
    }
    try {
      setBusy(true);
      await writeRecommendation(body.trim(), relationship.trim() || null);
      await refreshPublic();
      setRecOpen(false);
      toast({ title: myRecommendation ? "Recommendation updated" : "Recommendation posted" });
    } catch (err) {
      toast({ title: "Failed to save", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const removeRec = async () => {
    try {
      setBusy(true);
      await deleteMyRecommendation();
      await refreshPublic();
      setRecOpen(false);
      toast({ title: "Recommendation removed" });
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Action bar — connect / follow / recommend */}
      {!isViewerSelf && (
        <Card>
          <CardContent className="pt-6 flex flex-wrap items-center gap-2">
            {connectionStatus === "none" && (
              <Button size="sm" onClick={guard(requestConnection)} disabled={busy} className="gap-2">
                <UserPlus className="w-4 h-4" /> Connect
              </Button>
            )}
            {connectionStatus === "pending_outgoing" && (
              <Button size="sm" variant="outline" onClick={guard(removeConnection)} disabled={busy} className="gap-2">
                <UserX className="w-4 h-4" /> Cancel request
              </Button>
            )}
            {connectionStatus === "pending_incoming" && (
              <>
                <Button size="sm" onClick={guard(acceptConnection)} disabled={busy} className="gap-2">
                  <UserCheck className="w-4 h-4" /> Accept
                </Button>
                <Button size="sm" variant="ghost" onClick={guard(removeConnection)} disabled={busy}>
                  Decline
                </Button>
              </>
            )}
            {connectionStatus === "accepted" && (
              <Badge variant="outline" className="gap-1">
                <UserCheck className="w-3 h-3" /> Connected
              </Badge>
            )}

            <Button
              size="sm"
              variant={isFollowing ? "outline" : "secondary"}
              onClick={guard(toggleFollow)}
              disabled={busy}
              className="gap-2"
            >
              {isFollowing ? <HeartOff className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
              {isFollowing ? "Unfollow" : "Follow"}
            </Button>

            <Dialog
              open={recOpen}
              onOpenChange={(o) => {
                setRecOpen(o);
                if (o) {
                  setBody(myRecommendation?.body ?? "");
                  setRelationship(myRecommendation?.relationship ?? "");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={(e) => {
                    if (!isAuthenticated) {
                      e.preventDefault();
                      toast({ title: "Sign in required", description: "Create a free account to write a recommendation." });
                    }
                  }}
                >
                  {myRecommendation ? <Pencil className="w-4 h-4" /> : <Quote className="w-4 h-4" />}
                  {myRecommendation ? "Edit your recommendation" : "Recommend"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Recommend {recipientName}</DialogTitle>
                  <DialogDescription>
                    Public on their profile. Be specific about how you worked together — skills, projects, character.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Your relationship (optional)</Label>
                    <Input
                      placeholder="e.g. Worked together at Acme Manufacturing, 2022–2024"
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <Label>Recommendation</Label>
                    <Textarea
                      rows={6}
                      placeholder="What makes them a great teammate or operator?"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{body.length}/2000 · min 10 characters</p>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  {myRecommendation && (
                    <Button variant="ghost" onClick={removeRec} disabled={busy} className="mr-auto text-destructive">
                      Delete
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setRecOpen(false)} disabled={busy}>
                    Cancel
                  </Button>
                  <Button onClick={submitRec} disabled={busy}>
                    {myRecommendation ? "Save changes" : "Post recommendation"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {counts.follower_count} follower{counts.follower_count === 1 ? "" : "s"}
              </span>
              <span className="flex items-center gap-1">
                <Quote className="w-3 h-3" /> {counts.recommendation_count} recommendation{counts.recommendation_count === 1 ? "" : "s"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations list */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Quote className="w-5 h-5" /> Recommendations ({recommendations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {recommendations.map((r) => (
              <div key={r.id} className="flex gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  {r.author_avatar_url && <AvatarImage src={r.author_avatar_url} alt={r.author_display_name ?? ""} />}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(r.author_display_name ?? "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {r.author_public_username ? (
                      <Link to={`/talent/${r.author_public_username}`} className="font-medium hover:underline">
                        {r.author_display_name ?? r.author_public_username}
                      </Link>
                    ) : (
                      <span className="font-medium">{r.author_display_name ?? "JobLine member"}</span>
                    )}
                    {r.relationship && <span className="text-xs text-muted-foreground">· {r.relationship}</span>}
                  </div>
                  <p className="text-sm whitespace-pre-line mt-1 leading-relaxed">{r.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
