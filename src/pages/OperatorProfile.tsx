import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save, Linkedin, FileText, Award, Briefcase, GraduationCap, Wrench, Star, Plus, Trash2, ShieldCheck, Upload, Globe, RefreshCw, Check, X as XIcon, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useOperatorProfile, syncIssuedCertificatesToProfile } from "@/hooks/useOperatorProfile";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES, getRegionsForCountry, SUGGESTED_CITIES, SUGGESTED_HEADLINES } from "@/lib/talent/locations";
import { useUsernameAvailability, suggestUsernames } from "@/hooks/useUsernameAvailability";


const PROFICIENCY_LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;

export default function OperatorProfile() {
  const navigate = useNavigate();
  const { user, profile: authProfile, isReady } = useAuth();
  const { toast } = useToast();
  const {
    profile,
    certifications,
    skills,
    machines,
    workHistory,
    education,
    references,
    loading,
    saveProfile,
    uploadFile,
    refresh,
  } = useOperatorProfile();

  const [form, setForm] = useState({
    headline: "",
    bio: "",
    years_experience: "" as string,
    location_city: "",
    location_region: "",
    location_country: "",
    linkedin_url: "",
    portfolio_url: "",
    contact_email: "",
    contact_phone: "",
    open_to_work: false,
    willing_to_relocate: false,
    profile_visibility: "private" as "private" | "employers_only" | "public",
    public_username: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isReady && !user) navigate("/auth");
  }, [isReady, user, navigate]);

  useEffect(() => {
    if (profile) {
      setForm({
        headline: profile.headline ?? "",
        bio: profile.bio ?? "",
        years_experience: profile.years_experience?.toString() ?? "",
        location_city: profile.location_city ?? "",
        location_region: profile.location_region ?? "",
        location_country: profile.location_country ?? "",
        linkedin_url: profile.linkedin_url ?? "",
        portfolio_url: profile.portfolio_url ?? "",
        contact_email: profile.contact_email ?? user?.email ?? "",
        contact_phone: profile.contact_phone ?? "",
        open_to_work: profile.open_to_work,
        willing_to_relocate: profile.willing_to_relocate,
        profile_visibility: profile.profile_visibility ?? "private",
        public_username: profile.public_username ?? "",
      });
    } else if (user) {
      setForm((f) => ({ ...f, contact_email: user.email ?? "" }));
    }
  }, [profile, user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile({
        headline: form.headline.trim() || null,
        bio: form.bio.trim() || null,
        years_experience: form.years_experience ? parseInt(form.years_experience, 10) : null,
        location_city: form.location_city.trim() || null,
        location_region: form.location_region.trim() || null,
        location_country: form.location_country.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        portfolio_url: form.portfolio_url.trim() || null,
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        open_to_work: form.open_to_work,
        willing_to_relocate: form.willing_to_relocate,
        profile_visibility: form.profile_visibility,
        public_username: form.public_username.trim().toLowerCase() || null,
      } as any);
      toast({ title: "Profile saved", description: "Your operator profile has been updated." });
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      const url = await uploadFile(file, "resume");
      await saveProfile({ resume_pdf_url: url });
      toast({ title: "Resume uploaded", description: file.name });
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSyncCerts = async () => {
    if (!user?.email || !user.id) return;
    setSyncing(true);
    try {
      const count = await syncIssuedCertificatesToProfile(user.id, user.email);
      await refresh();
      toast({
        title: "Synced",
        description: count > 0 ? `Imported ${count} verified certificate(s) from OAP/GCA.` : "No new verified certificates found.",
      });
    } catch (err) {
      toast({ title: "Sync failed", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 max-w-4xl space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Operator Profile</h1>
          <p className="text-muted-foreground">
            Build your professional profile so qualified employers can find you. All sections are private until you turn on discoverability.
          </p>
        </div>

        {/* Visibility selector */}
        <Card className={form.profile_visibility !== "private" ? "border-primary bg-primary/5" : "border-dashed"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Profile visibility
            </CardTitle>
            <CardDescription>
              Choose who can see your profile. You can change this anytime.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {([
              {
                value: "private",
                title: "Private",
                desc: "Only you can see your profile. Hidden from all employers and the public talent directory.",
              },
              {
                value: "employers_only",
                title: "Verified employers only",
                desc: "Hiring orgs on a paid OAP/Team subscription can find and contact you. Not listed publicly.",
              },
              {
                value: "public",
                title: "Public",
                desc: "Anyone can view your profile (including signed-out visitors and the public talent directory). Contact info still hidden from non-employers.",
              },
            ] as const).map((opt) => {
              const selected = form.profile_visibility === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, profile_visibility: opt.value }))}
                  className={`w-full text-left rounded-md border p-3 transition-colors ${
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{opt.title}</p>
                    {selected && <Badge variant="default">Active</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{opt.desc}</p>
                </button>
              );
            })}

            {form.profile_visibility === "public" && (
              <UsernamePicker
                value={form.public_username}
                onChange={(v) => setForm((f) => ({ ...f, public_username: v }))}
                userId={user?.id}
                currentUsername={profile?.public_username ?? null}
                seedName={authProfile?.display_name ?? user?.email?.split("@")[0] ?? ""}
                publishedUsername={profile?.public_username ?? null}
              />
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="basics">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="certs">Certs</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="work">Work</TabsTrigger>
            <TabsTrigger value="edu">Education</TabsTrigger>
            <TabsTrigger value="refs">References</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" /> About you</CardTitle>
                <CardDescription>Headline, bio, location, and contact info.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="headline">Professional headline</Label>
                  <Input
                    id="headline"
                    list="headline-suggestions"
                    value={form.headline}
                    onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                    placeholder="e.g. Senior CNC Machinist · Mazak / Haas / Doosan"
                    maxLength={150}
                  />
                  <datalist id="headline-suggestions">
                    {SUGGESTED_HEADLINES.map((h) => <option key={h} value={h} />)}
                  </datalist>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Type to see suggestions
                  </p>
                </div>
                <div>
                  <Label>Bio</Label>
                  <Textarea
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    placeholder="Tell employers about your experience, specialties, and what you're looking for."
                    rows={5}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{form.bio.length}/2000</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      list="city-suggestions"
                      value={form.location_city}
                      onChange={(e) => setForm((f) => ({ ...f, location_city: e.target.value }))}
                      placeholder="e.g. Rockford"
                    />
                    <datalist id="city-suggestions">
                      {SUGGESTED_CITIES.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div>
                    <Label>State / Region</Label>
                    {(() => {
                      const regions = getRegionsForCountry(form.location_country);
                      if (regions) {
                        return (
                          <Select
                            value={form.location_region}
                            onValueChange={(v) => setForm((f) => ({ ...f, location_region: v }))}
                          >
                            <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                            <SelectContent className="max-h-72">
                              {regions.map((r) => (
                                <SelectItem key={r.code} value={r.name}>{r.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      }
                      return (
                        <Input
                          value={form.location_region}
                          onChange={(e) => setForm((f) => ({ ...f, location_region: e.target.value }))}
                          placeholder="State or region"
                        />
                      );
                    })()}
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Select
                      value={form.location_country}
                      onValueChange={(v) => setForm((f) => ({ ...f, location_country: v, location_region: "" }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Years of experience</Label>
                    <Input
                      type="number"
                      min="0"
                      max="60"
                      value={form.years_experience}
                      onChange={(e) => setForm((f) => ({ ...f, years_experience: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>LinkedIn URL</Label>
                    <Input
                      value={form.linkedin_url}
                      onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))}
                      placeholder="https://linkedin.com/in/your-handle"
                    />
                  </div>
                  <div>
                    <Label>Portfolio URL</Label>
                    <Input
                      value={form.portfolio_url}
                      onChange={(e) => setForm((f) => ({ ...f, portfolio_url: e.target.value }))}
                      placeholder="https://your-site.com"
                    />
                  </div>
                  <div>
                    <Label>Contact email</Label>
                    <Input value={form.contact_email} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Contact phone</Label>
                    <Input value={form.contact_phone} onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))} />
                  </div>
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Open to work</p>
                    <p className="text-sm text-muted-foreground">Show an "Open to work" badge on your profile.</p>
                  </div>
                  <Switch checked={form.open_to_work} onCheckedChange={(v) => setForm((f) => ({ ...f, open_to_work: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Willing to relocate</p>
                    <p className="text-sm text-muted-foreground">Let employers in other regions consider you.</p>
                  </div>
                  <Switch checked={form.willing_to_relocate} onCheckedChange={(v) => setForm((f) => ({ ...f, willing_to_relocate: v }))} />
                </div>

                <Separator />
                <div>
                  <Label className="flex items-center gap-2"><FileText className="w-4 h-4" /> Resume PDF</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input type="file" accept="application/pdf" onChange={handleResumeUpload} disabled={uploadingResume} />
                    {profile?.resume_pdf_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={profile.resume_pdf_url} target="_blank" rel="noopener noreferrer">View</a>
                      </Button>
                    )}
                  </div>
                  {uploadingResume && <p className="text-sm text-muted-foreground mt-1">Uploading…</p>}
                </div>

                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certs" className="mt-6 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5" /> Certifications</CardTitle>
                  <CardDescription>Verified OAP/GCA certs auto-import; add others manually.</CardDescription>
                </div>
                <Button onClick={handleSyncCerts} disabled={syncing} variant="outline" size="sm" className="gap-2">
                  {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Sync OAP/GCA
                </Button>
              </CardHeader>
              <CardContent>
                <CertificationsManager certs={certifications} onChange={refresh} uploadFile={uploadFile} userId={user!.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Star className="w-5 h-5" /> Skills</CardTitle>
                <CardDescription>Tags employers can search for.</CardDescription>
              </CardHeader>
              <CardContent>
                <SkillsManager skills={skills} onChange={refresh} userId={user!.id} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5" /> Machine proficiencies</CardTitle>
                <CardDescription>Equipment you've operated.</CardDescription>
              </CardHeader>
              <CardContent>
                <MachinesManager machines={machines} onChange={refresh} userId={user!.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="work" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" /> Work history</CardTitle>
                <CardDescription>Past employers and roles. Stays with you across employers.</CardDescription>
              </CardHeader>
              <CardContent>
                <WorkHistoryManager rows={workHistory} onChange={refresh} userId={user!.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edu" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Education</CardTitle>
              </CardHeader>
              <CardContent>
                <EducationManager rows={education} onChange={refresh} userId={user!.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="refs" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Star className="w-5 h-5" /> References</CardTitle>
                <CardDescription>Only visible to verified employers.</CardDescription>
              </CardHeader>
              <CardContent>
                <ReferencesManager rows={references} onChange={refresh} userId={user!.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ============= Inline managers =============

function UsernamePicker({
  value,
  onChange,
  userId,
  currentUsername,
  seedName,
  publishedUsername,
}: {
  value: string;
  onChange: (v: string) => void;
  userId: string | undefined;
  currentUsername: string | null;
  seedName: string;
  publishedUsername: string | null;
}) {
  const { status, message } = useUsernameAvailability(value, userId, currentUsername);
  const suggestions = suggestUsernames(seedName).filter((s) => s !== value);

  const statusColor =
    status === "available" || status === "self"
      ? "text-green-600"
      : status === "checking"
      ? "text-muted-foreground"
      : status === "idle"
      ? "text-muted-foreground"
      : "text-destructive";

  const StatusIcon =
    status === "available" || status === "self"
      ? Check
      : status === "checking"
      ? Loader2
      : status === "idle"
      ? null
      : XIcon;

  return (
    <div className="mt-4 space-y-3 rounded-md border bg-background p-3">
      <div>
        <Label htmlFor="public_username" className="text-sm font-medium">
          Public username
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your profile will live at{" "}
          <span className="font-mono">jobline.ai/talent/{value || "your-name"}</span>
        </p>
      </div>

      <div className="relative">
        <Input
          id="public_username"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
          placeholder="e.g. zach-machinist"
          maxLength={30}
          className="pr-10"
          autoComplete="off"
        />
        {StatusIcon && (
          <StatusIcon
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${statusColor} ${
              status === "checking" ? "animate-spin" : ""
            }`}
          />
        )}
      </div>

      {message && (
        <p className={`text-xs ${statusColor}`}>{message}</p>
      )}

      {suggestions.length > 0 && status !== "available" && status !== "self" && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Try:
          </span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className="text-xs rounded-full border border-border bg-muted/40 px-2 py-0.5 hover:border-primary hover:text-primary transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {publishedUsername && (
        <a
          href={`/talent/${publishedUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          View public profile →
        </a>
      )}

      <p className="text-[10px] text-muted-foreground">
        3–30 characters. Lowercase letters, numbers, hyphens, underscores. Must start with letter or number.
      </p>
    </div>
  );
}

function CertificationsManager({
  certs, onChange, uploadFile, userId,
}: {
  certs: ReturnType<typeof useOperatorProfile>["certifications"];
  onChange: () => void;
  uploadFile: (f: File, folder: "resume" | "certs" | "avatar") => Promise<string>;
  userId: string;
}) {
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", issuer: "", issued_date: "", expires_date: "", credential_id: "", credential_url: "" });

  const add = async () => {
    if (!draft.name.trim()) return;
    const { error } = await supabase.from("operator_certifications").insert({
      user_id: userId,
      name: draft.name.trim(),
      issuer: draft.issuer.trim() || null,
      issued_date: draft.issued_date || null,
      expires_date: draft.expires_date || null,
      credential_id: draft.credential_id.trim() || null,
      credential_url: draft.credential_url.trim() || null,
      verification_source: "self_reported",
    });
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    setDraft({ name: "", issuer: "", issued_date: "", expires_date: "", credential_id: "", credential_url: "" });
    setAdding(false);
    onChange();
  };

  const uploadAttachment = async (certId: string, file: File) => {
    try {
      const url = await uploadFile(file, "certs");
      await supabase.from("operator_certifications").update({ attachment_url: url }).eq("id", certId);
      onChange();
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    }
  };

  const remove = async (id: string) => {
    await supabase.from("operator_certifications").delete().eq("id", id);
    onChange();
  };

  return (
    <div className="space-y-3">
      {certs.map((c) => (
        <div key={c.id} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium">{c.name}</p>
                {c.verification_source.startsWith("verified_") ? (
                  <Badge className="gap-1 bg-primary/15 text-primary border-primary/30">
                    <ShieldCheck className="w-3 h-3" /> Verified · {c.verification_source.replace("verified_", "").toUpperCase()}
                  </Badge>
                ) : (
                  <Badge variant="outline">Self-reported</Badge>
                )}
              </div>
              {c.issuer && <p className="text-sm text-muted-foreground">{c.issuer}</p>}
              <p className="text-xs text-muted-foreground">
                {c.issued_date && `Issued ${c.issued_date}`}{c.expires_date && ` · Expires ${c.expires_date}`}
              </p>
              {c.credential_url && (
                <a href={c.credential_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                  View credential
                </a>
              )}
            </div>
            <div className="flex items-center gap-1">
              {c.verification_source === "self_reported" && (
                <>
                  <label className="cursor-pointer">
                    <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => e.target.files?.[0] && uploadAttachment(c.id, e.target.files[0])} />
                    <Button size="sm" variant="ghost" asChild><span><Upload className="w-4 h-4" /></span></Button>
                  </label>
                  <Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4" /></Button>
                </>
              )}
            </div>
          </div>
          {c.attachment_url && (
            <a href={c.attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">View attachment</a>
          )}
        </div>
      ))}

      {adding ? (
        <div className="border rounded-lg p-3 space-y-2 bg-secondary/30">
          <Input placeholder="Certification name *" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Input placeholder="Issuing organization" value={draft.issuer} onChange={(e) => setDraft({ ...draft, issuer: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" placeholder="Issued" value={draft.issued_date} onChange={(e) => setDraft({ ...draft, issued_date: e.target.value })} />
            <Input type="date" placeholder="Expires" value={draft.expires_date} onChange={(e) => setDraft({ ...draft, expires_date: e.target.value })} />
          </div>
          <Input placeholder="Credential ID" value={draft.credential_id} onChange={(e) => setDraft({ ...draft, credential_id: e.target.value })} />
          <Input placeholder="Credential URL" value={draft.credential_url} onChange={(e) => setDraft({ ...draft, credential_url: e.target.value })} />
          <div className="flex gap-2">
            <Button size="sm" onClick={add}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)} className="gap-2"><Plus className="w-4 h-4" /> Add certification</Button>
      )}
    </div>
  );
}

function SkillsManager({
  skills, onChange, userId,
}: {
  skills: ReturnType<typeof useOperatorProfile>["skills"];
  onChange: () => void;
  userId: string;
}) {
  const [skill, setSkill] = useState("");
  const [proficiency, setProficiency] = useState<typeof PROFICIENCY_LEVELS[number]>("intermediate");

  const add = async () => {
    if (!skill.trim()) return;
    await supabase.from("operator_skills").insert({ user_id: userId, skill: skill.trim(), proficiency });
    setSkill("");
    onChange();
  };
  const remove = async (id: string) => {
    await supabase.from("operator_skills").delete().eq("id", id);
    onChange();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <Badge key={s.id} variant="secondary" className="gap-1 cursor-pointer" onClick={() => remove(s.id)}>
            {s.skill} · {s.proficiency}
            <Trash2 className="w-3 h-3" />
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input placeholder="Skill (e.g. Mazatrol, GD&T, Setup)" value={skill} onChange={(e) => setSkill(e.target.value)} />
        <select className="border rounded px-2 text-sm bg-background" value={proficiency} onChange={(e) => setProficiency(e.target.value as typeof PROFICIENCY_LEVELS[number])}>
          {PROFICIENCY_LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <Button onClick={add}><Plus className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

function MachinesManager({
  machines, onChange, userId,
}: {
  machines: ReturnType<typeof useOperatorProfile>["machines"];
  onChange: () => void;
  userId: string;
}) {
  const [draft, setDraft] = useState({ machine_category: "", machine_make: "", machine_model: "", control_type: "", proficiency: "intermediate", years_experience: "" });

  const add = async () => {
    if (!draft.machine_category.trim()) return;
    await supabase.from("operator_machine_proficiencies").insert({
      user_id: userId,
      machine_category: draft.machine_category.trim(),
      machine_make: draft.machine_make.trim() || null,
      machine_model: draft.machine_model.trim() || null,
      control_type: draft.control_type.trim() || null,
      proficiency: draft.proficiency,
      years_experience: draft.years_experience ? parseFloat(draft.years_experience) : null,
    });
    setDraft({ machine_category: "", machine_make: "", machine_model: "", control_type: "", proficiency: "intermediate", years_experience: "" });
    onChange();
  };
  const remove = async (id: string) => {
    await supabase.from("operator_machine_proficiencies").delete().eq("id", id);
    onChange();
  };

  return (
    <div className="space-y-3">
      {machines.map((m) => (
        <div key={m.id} className="flex items-center justify-between border rounded p-2">
          <div>
            <p className="font-medium text-sm">{m.machine_category} {m.machine_make && `· ${m.machine_make}`} {m.machine_model && m.machine_model}</p>
            <p className="text-xs text-muted-foreground">{m.control_type} · {m.proficiency}{m.years_experience && ` · ${m.years_experience}y`}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => remove(m.id)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ))}
      <div className="border rounded p-3 space-y-2 bg-secondary/30">
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Category (CNC Mill, Lathe, EDM)*" value={draft.machine_category} onChange={(e) => setDraft({ ...draft, machine_category: e.target.value })} />
          <Input placeholder="Make (Haas, Mazak)" value={draft.machine_make} onChange={(e) => setDraft({ ...draft, machine_make: e.target.value })} />
          <Input placeholder="Model" value={draft.machine_model} onChange={(e) => setDraft({ ...draft, machine_model: e.target.value })} />
          <Input placeholder="Control (Fanuc, Mazatrol)" value={draft.control_type} onChange={(e) => setDraft({ ...draft, control_type: e.target.value })} />
          <select className="border rounded px-2 text-sm bg-background" value={draft.proficiency} onChange={(e) => setDraft({ ...draft, proficiency: e.target.value })}>
            {PROFICIENCY_LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <Input type="number" step="0.5" placeholder="Years exp." value={draft.years_experience} onChange={(e) => setDraft({ ...draft, years_experience: e.target.value })} />
        </div>
        <Button onClick={add} className="gap-2"><Plus className="w-4 h-4" /> Add machine</Button>
      </div>
    </div>
  );
}

function WorkHistoryManager({
  rows, onChange, userId,
}: {
  rows: ReturnType<typeof useOperatorProfile>["workHistory"];
  onChange: () => void;
  userId: string;
}) {
  const [draft, setDraft] = useState({ employer_name: "", job_title: "", start_date: "", end_date: "", is_current: false, location: "", description: "" });
  const add = async () => {
    if (!draft.employer_name.trim() || !draft.job_title.trim()) return;
    await supabase.from("operator_work_history").insert({
      user_id: userId,
      employer_name: draft.employer_name.trim(),
      job_title: draft.job_title.trim(),
      start_date: draft.start_date || null,
      end_date: draft.is_current ? null : (draft.end_date || null),
      is_current: draft.is_current,
      location: draft.location.trim() || null,
      description: draft.description.trim() || null,
    });
    setDraft({ employer_name: "", job_title: "", start_date: "", end_date: "", is_current: false, location: "", description: "" });
    onChange();
  };
  const remove = async (id: string) => {
    await supabase.from("operator_work_history").delete().eq("id", id);
    onChange();
  };
  return (
    <div className="space-y-3">
      {rows.map((w) => (
        <div key={w.id} className="border rounded p-3 flex items-start justify-between">
          <div>
            <p className="font-medium">{w.job_title} · {w.employer_name}</p>
            <p className="text-xs text-muted-foreground">{w.start_date ?? "?"} – {w.is_current ? "Present" : (w.end_date ?? "?")}{w.location && ` · ${w.location}`}</p>
            {w.description && <p className="text-sm mt-1">{w.description}</p>}
          </div>
          <Button size="sm" variant="ghost" onClick={() => remove(w.id)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ))}
      <div className="border rounded p-3 space-y-2 bg-secondary/30">
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Employer *" value={draft.employer_name} onChange={(e) => setDraft({ ...draft, employer_name: e.target.value })} />
          <Input placeholder="Job title *" value={draft.job_title} onChange={(e) => setDraft({ ...draft, job_title: e.target.value })} />
          <Input type="date" value={draft.start_date} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} />
          <Input type="date" value={draft.end_date} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} disabled={draft.is_current} />
          <label className="flex items-center gap-2 text-sm col-span-2">
            <input type="checkbox" checked={draft.is_current} onChange={(e) => setDraft({ ...draft, is_current: e.target.checked })} /> Current role
          </label>
          <Input placeholder="Location" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className="col-span-2" />
        </div>
        <Textarea placeholder="What did you do here?" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} />
        <Button onClick={add} className="gap-2"><Plus className="w-4 h-4" /> Add role</Button>
      </div>
    </div>
  );
}

function EducationManager({
  rows, onChange, userId,
}: {
  rows: ReturnType<typeof useOperatorProfile>["education"];
  onChange: () => void;
  userId: string;
}) {
  const [draft, setDraft] = useState({ school_name: "", degree: "", field_of_study: "", start_date: "", end_date: "", description: "" });
  const add = async () => {
    if (!draft.school_name.trim()) return;
    await supabase.from("operator_education").insert({
      user_id: userId,
      school_name: draft.school_name.trim(),
      degree: draft.degree.trim() || null,
      field_of_study: draft.field_of_study.trim() || null,
      start_date: draft.start_date || null,
      end_date: draft.end_date || null,
      description: draft.description.trim() || null,
    });
    setDraft({ school_name: "", degree: "", field_of_study: "", start_date: "", end_date: "", description: "" });
    onChange();
  };
  const remove = async (id: string) => {
    await supabase.from("operator_education").delete().eq("id", id);
    onChange();
  };
  return (
    <div className="space-y-3">
      {rows.map((e) => (
        <div key={e.id} className="border rounded p-3 flex items-start justify-between">
          <div>
            <p className="font-medium">{e.school_name}</p>
            <p className="text-sm text-muted-foreground">{e.degree}{e.field_of_study && ` · ${e.field_of_study}`}</p>
            <p className="text-xs text-muted-foreground">{e.start_date ?? "?"} – {e.end_date ?? "?"}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ))}
      <div className="border rounded p-3 space-y-2 bg-secondary/30">
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="School *" value={draft.school_name} onChange={(e) => setDraft({ ...draft, school_name: e.target.value })} className="col-span-2" />
          <Input placeholder="Degree" value={draft.degree} onChange={(e) => setDraft({ ...draft, degree: e.target.value })} />
          <Input placeholder="Field of study" value={draft.field_of_study} onChange={(e) => setDraft({ ...draft, field_of_study: e.target.value })} />
          <Input type="date" value={draft.start_date} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} />
          <Input type="date" value={draft.end_date} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} />
        </div>
        <Button onClick={add} className="gap-2"><Plus className="w-4 h-4" /> Add education</Button>
      </div>
    </div>
  );
}

function ReferencesManager({
  rows, onChange, userId,
}: {
  rows: ReturnType<typeof useOperatorProfile>["references"];
  onChange: () => void;
  userId: string;
}) {
  const [draft, setDraft] = useState({ reference_name: "", relationship: "", company: "", contact_email: "", contact_phone: "", notes: "" });
  const add = async () => {
    if (!draft.reference_name.trim()) return;
    await supabase.from("operator_references").insert({
      user_id: userId,
      reference_name: draft.reference_name.trim(),
      relationship: draft.relationship.trim() || null,
      company: draft.company.trim() || null,
      contact_email: draft.contact_email.trim() || null,
      contact_phone: draft.contact_phone.trim() || null,
      notes: draft.notes.trim() || null,
    });
    setDraft({ reference_name: "", relationship: "", company: "", contact_email: "", contact_phone: "", notes: "" });
    onChange();
  };
  const remove = async (id: string) => {
    await supabase.from("operator_references").delete().eq("id", id);
    onChange();
  };
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="border rounded p-3 flex items-start justify-between">
          <div>
            <p className="font-medium">{r.reference_name}</p>
            <p className="text-sm text-muted-foreground">{r.relationship}{r.company && ` · ${r.company}`}</p>
            <p className="text-xs text-muted-foreground">{r.contact_email} {r.contact_phone}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ))}
      <div className="border rounded p-3 space-y-2 bg-secondary/30">
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Reference name *" value={draft.reference_name} onChange={(e) => setDraft({ ...draft, reference_name: e.target.value })} />
          <Input placeholder="Relationship" value={draft.relationship} onChange={(e) => setDraft({ ...draft, relationship: e.target.value })} />
          <Input placeholder="Company" value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
          <Input placeholder="Email" value={draft.contact_email} onChange={(e) => setDraft({ ...draft, contact_email: e.target.value })} />
          <Input placeholder="Phone" value={draft.contact_phone} onChange={(e) => setDraft({ ...draft, contact_phone: e.target.value })} />
        </div>
        <Button onClick={add} className="gap-2"><Plus className="w-4 h-4" /> Add reference</Button>
      </div>
    </div>
  );
}
