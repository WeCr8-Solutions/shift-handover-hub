import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, MapPin, Linkedin, ShieldCheck, Award, BookmarkPlus, Send, Globe } from "lucide-react";
import { useTalentSearch, useSavedLists, useContactRequests, type TalentSearchFilters, type TalentCandidate } from "@/hooks/useTalent";
import { useOrgContext } from "@/contexts/OrgContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function Talent() {
  const navigate = useNavigate();
  const { organization, organizationRole } = useOrgContext();
  const { toast } = useToast();
  const [filters, setFilters] = useState<TalentSearchFilters>({});
  const [filterDraft, setFilterDraft] = useState<TalentSearchFilters>({});
  const { results, loading } = useTalentSearch(filters);
  const { lists, candidates, createList, addCandidate, updateCandidateStage, removeCandidate } = useSavedLists();
  const { outbound, sendRequest } = useContactRequests();

  const [contactTarget, setContactTarget] = useState<TalentCandidate | null>(null);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [newListName, setNewListName] = useState("");

  const isAuthorized =
    organizationRole === "owner" || organizationRole === "admin" || organizationRole === "supervisor";

  if (!organization) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 max-w-2xl text-center space-y-4">
          <Globe className="w-12 h-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Talent search</h1>
          <p className="text-muted-foreground">You need to belong to an organization with an active subscription to browse the operators database.</p>
          <Button onClick={() => navigate("/pricing")}>See pricing</Button>
        </main>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 max-w-2xl text-center space-y-4">
          <h1 className="text-2xl font-bold">Verified employer access required</h1>
          <p className="text-muted-foreground">Only org owners, admins, and supervisors can access the talent database.</p>
        </main>
      </div>
    );
  }

  const handleAddToList = async (listId: string, candidateUserId: string) => {
    try {
      await addCandidate(listId, candidateUserId);
      toast({ title: "Added to list" });
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    }
  };

  const handleSend = async () => {
    if (!contactTarget) return;
    try {
      await sendRequest(contactTarget.user_id, contactSubject.trim(), contactMessage.trim());
      toast({ title: "Message sent", description: "Candidate will be notified in their inbox." });
      setContactTarget(null);
      setContactSubject("");
      setContactMessage("");
    } catch (err) {
      toast({ title: "Send failed", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Talent Database</h1>
          <p className="text-muted-foreground">Find skilled, opted-in operators verified through OAP and GCA programs.</p>
        </div>

        <Tabs defaultValue="search">
          <TabsList>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="lists">Saved lists ({lists.length})</TabsTrigger>
            <TabsTrigger value="messages">Messages ({outbound.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5" /> Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Keyword</Label>
                    <Input value={filterDraft.search ?? ""} onChange={(e) => setFilterDraft({ ...filterDraft, search: e.target.value })} placeholder="e.g. Mazatrol, supervisor" />
                  </div>
                  <div>
                    <Label>Skill</Label>
                    <Input value={filterDraft.skill ?? ""} onChange={(e) => setFilterDraft({ ...filterDraft, skill: e.target.value })} placeholder="e.g. GD&T" />
                  </div>
                  <div>
                    <Label>Machine category</Label>
                    <Input value={filterDraft.machineCategory ?? ""} onChange={(e) => setFilterDraft({ ...filterDraft, machineCategory: e.target.value })} placeholder="e.g. CNC Mill" />
                  </div>
                  <div>
                    <Label>Min years experience</Label>
                    <Input type="number" min="0" value={filterDraft.minYears ?? ""} onChange={(e) => setFilterDraft({ ...filterDraft, minYears: e.target.value ? parseInt(e.target.value, 10) : undefined })} />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input value={filterDraft.location ?? ""} onChange={(e) => setFilterDraft({ ...filterDraft, location: e.target.value })} placeholder="City or region" />
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2">
                      <Switch checked={filterDraft.openToWorkOnly ?? false} onCheckedChange={(v) => setFilterDraft({ ...filterDraft, openToWorkOnly: v })} />
                      <span className="text-sm">Open to work only</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setFilters(filterDraft)} className="gap-2"><Search className="w-4 h-4" /> Search</Button>
                  <Button variant="ghost" onClick={() => { setFilterDraft({}); setFilters({}); }}>Clear</Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : results.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">No operators match those filters yet.</CardContent></Card>
              ) : (
                results.map((c) => (
                  <CandidateCard
                    key={c.user_id}
                    candidate={c}
                    lists={lists}
                    onAddToList={handleAddToList}
                    onContact={() => setContactTarget(c)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="lists" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create a list</CardTitle>
                <CardDescription>Organize candidates into pipelines.</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Input placeholder="List name" value={newListName} onChange={(e) => setNewListName(e.target.value)} />
                <Button
                  onClick={async () => {
                    if (!newListName.trim()) return;
                    await createList(newListName.trim());
                    setNewListName("");
                  }}
                >Create</Button>
              </CardContent>
            </Card>

            {lists.map((list) => {
              const items = candidates.filter((c) => c.list_id === list.id);
              const stages: Array<{ key: string; label: string }> = [
                { key: "new", label: "New" },
                { key: "contacted", label: "Contacted" },
                { key: "interviewing", label: "Interviewing" },
                { key: "offer", label: "Offer" },
                { key: "hired", label: "Hired" },
                { key: "rejected", label: "Rejected" },
              ];
              return (
                <Card key={list.id}>
                  <CardHeader>
                    <CardTitle>{list.name}</CardTitle>
                    {list.description && <CardDescription>{list.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No candidates yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                        {stages.map((s) => (
                          <div key={s.key} className="border rounded p-2 min-h-[120px]">
                            <p className="text-xs font-medium text-muted-foreground mb-2">{s.label}</p>
                            {items.filter((i) => i.stage === s.key).map((i) => (
                              <div key={i.id} className="text-xs border rounded p-2 mb-1 bg-card">
                                <p className="truncate">{i.candidate_user_id.slice(0, 8)}…</p>
                                <select
                                  value={i.stage}
                                  onChange={(e) => updateCandidateStage(i.id, e.target.value)}
                                  className="text-xs mt-1 bg-background border rounded w-full"
                                >
                                  {stages.map((st) => <option key={st.key} value={st.key}>{st.label}</option>)}
                                </select>
                                <Button variant="ghost" size="sm" onClick={() => removeCandidate(i.id)} className="text-xs h-6 px-2">Remove</Button>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="messages" className="mt-6 space-y-3">
            {outbound.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No messages sent yet.</CardContent></Card>
            ) : (
              outbound.map((m) => (
                <Card key={m.id}>
                  <CardContent className="pt-6 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{m.subject}</p>
                      <Badge variant={m.candidate_response === "accepted" ? "default" : m.candidate_response === "declined" ? "destructive" : "secondary"}>
                        {m.candidate_response}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{m.message}</p>
                    {m.candidate_response_message && (
                      <p className="text-sm border-l-2 border-primary pl-2 mt-2">Reply: {m.candidate_response_message}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!contactTarget} onOpenChange={(o) => !o && setContactTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact {contactTarget?.display_name ?? "candidate"}</DialogTitle>
            <DialogDescription>They'll receive an in-app message and can choose to respond.</DialogDescription>
          </DialogHeader>
          <Input placeholder="Subject" value={contactSubject} onChange={(e) => setContactSubject(e.target.value)} maxLength={150} />
          <Textarea placeholder="Your message" value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} rows={5} maxLength={2000} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setContactTarget(null)}>Cancel</Button>
            <Button onClick={handleSend} disabled={!contactSubject.trim() || !contactMessage.trim()} className="gap-2">
              <Send className="w-4 h-4" /> Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CandidateCard({
  candidate, lists, onAddToList, onContact,
}: {
  candidate: TalentCandidate;
  lists: { id: string; name: string }[];
  onAddToList: (listId: string, candidateUserId: string) => void;
  onContact: () => void;
}) {
  const initials = (candidate.display_name ?? "?").charAt(0).toUpperCase();
  return (
    <Card>
      <CardContent className="pt-6 flex flex-col md:flex-row gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary/10 text-primary text-xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-lg">{candidate.display_name ?? "Operator"}</p>
              {candidate.headline && <p className="text-sm text-muted-foreground">{candidate.headline}</p>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {candidate.open_to_work && <Badge className="bg-green-500/10 text-green-700 border-green-500/30">Open to work</Badge>}
              {candidate.willing_to_relocate && <Badge variant="outline">Will relocate</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {(candidate.location_city || candidate.location_region) && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {[candidate.location_city, candidate.location_region].filter(Boolean).join(", ")}</span>
            )}
            {candidate.years_experience != null && <span>{candidate.years_experience} yrs exp.</span>}
            {candidate.verified_cert_count > 0 && (
              <span className="flex items-center gap-1 text-primary"><ShieldCheck className="w-3 h-3" /> {candidate.verified_cert_count} verified</span>
            )}
            {candidate.cert_count > 0 && <span className="flex items-center gap-1"><Award className="w-3 h-3" /> {candidate.cert_count} cert{candidate.cert_count !== 1 && "s"}</span>}
            {candidate.linkedin_url && (
              <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                <Linkedin className="w-3 h-3" /> LinkedIn
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" onClick={onContact} className="gap-2"><Send className="w-3 h-3" /> Message</Button>
            {lists.length > 0 && (
              <select
                className="text-sm border rounded px-2 py-1 bg-background"
                onChange={(e) => { if (e.target.value) { onAddToList(e.target.value, candidate.user_id); e.target.value = ""; } }}
                defaultValue=""
              >
                <option value="" disabled>Add to list…</option>
                {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            )}
            {lists.length === 0 && (
              <Button size="sm" variant="outline" className="gap-2" disabled><BookmarkPlus className="w-3 h-3" /> Create a list to save</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
