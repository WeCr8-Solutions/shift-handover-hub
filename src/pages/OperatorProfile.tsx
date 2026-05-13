import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Loader2, Save, Linkedin, FileText, Award, Briefcase, GraduationCap, Wrench, Star, Plus, Trash2, ShieldCheck, Upload, Globe, RefreshCw, Check, X as XIcon, Sparkles, Share2, Copy, ExternalLink, QrCode } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useOperatorProfile, syncIssuedCertificatesToProfile } from "@/hooks/useOperatorProfile";
import { MiniSiteEditor } from "@/components/operator/MiniSiteEditor";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES, getRegionsForCountry, SUGGESTED_CITIES, SUGGESTED_HEADLINES } from "@/lib/talent/locations";
import { useUsernameAvailability, suggestUsernames } from "@/hooks/useUsernameAvailability";
import { getPublicTalentUrl } from "@/lib/talent/publicHost";
import { buildResumePdf } from "@/lib/talent/resumeBuilder";
import { FilePicker } from "@/components/operator/FilePicker";
import { useResumeVersions } from "@/hooks/useResumeVersions";
import { getOperatorProfileSignedUrl } from "@/lib/operatorProfileFiles";


const PROFICIENCY_LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;

function extractErrorMessage(err: unknown): string {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object") {
    const e = err as Record<string, unknown>;
    const parts = [e.message, e.details, e.hint, e.code]
      .filter((v): v is string => typeof v === "string" && v.length > 0);
    if (parts.length) return parts.join(" — ");
    try { return JSON.stringify(err); } catch { return String(err); }
  }
  return String(err);
}

export default function OperatorProfile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const VALID_TABS = ["basics", "resume", "certs", "skills", "work", "edu", "refs", "minisite"] as const;
  const tabParam = searchParams.get("tab");
  const activeTab = (VALID_TABS as readonly string[]).includes(tabParam ?? "") ? (tabParam as string) : "basics";

  const handleTabChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
  };
  const { user, profile: authProfile, isReady } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (tabParam && !(VALID_TABS as readonly string[]).includes(tabParam)) {
      toast({ title: "Tab not found", description: `"${tabParam}" is not a valid section. Showing Basics instead.`, variant: "destructive" });
      const next = new URLSearchParams(searchParams);
      next.delete("tab");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
  const { versions: resumeVersions, recordVersion: recordResumeVersion, deleteVersion: deleteResumeVersion } = useResumeVersions(user?.id);

  const [form, setForm] = useState({
    headline: "",
    bio: "",
    years_experience: "" as string,
    location_city: "",
    location_region: "",
    location_country: "",
    linkedin_url: "",
    portfolio_url: "",
    twitter_url: "",
    instagram_url: "",
    facebook_url: "",
    youtube_url: "",
    github_url: "",
    website_url: "",
    contact_email: "",
    contact_phone: "",
    open_to_work: false,
    willing_to_relocate: false,
    profile_visibility: "private" as "private" | "employers_only" | "public",
    public_username: "",
    resume_public: false,
    show_only_verified_certs: false,
    social_visibility: {} as Record<string, boolean>,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [syncing, setSyncing] = useState(false);
  /** Generate-from-profile state for the "Build a JobLine résumé" feature. */
  const [building, setBuilding] = useState(false);
  /** Two-step autofill state — upload first, then user clicks "Auto-update profile". */
  const [autofilling, setAutofilling] = useState(false);
  /** When true, autofill REPLACES filled fields. When false, only empty fields are filled (skill/work/edu/machine rows always dedupe). */
  const [autofillOverwrite, setAutofillOverwrite] = useState(false);
  /** When true, automatically run AI autofill right after a resume upload. */
  const [autoAutofillOnUpload, setAutoAutofillOnUpload] = useState(true);
  /** When true, automatically (re)build the JobLine résumé PDF after autofill completes. */
  const [autoBuildAfterAutofill, setAutoBuildAfterAutofill] = useState(false);
  /** Counts from the most recent autofill run, used to render an inline summary. */
  const [lastAutofill, setLastAutofill] = useState<null | {
    fields: number;
    skills: number;
    work: number;
    education: number;
    machines: number;
    at: number;
  }>(null);

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
        twitter_url: (profile as any).twitter_url ?? "",
        instagram_url: (profile as any).instagram_url ?? "",
        facebook_url: (profile as any).facebook_url ?? "",
        youtube_url: (profile as any).youtube_url ?? "",
        github_url: (profile as any).github_url ?? "",
        website_url: (profile as any).website_url ?? "",
        contact_email: profile.contact_email ?? user?.email ?? "",
        contact_phone: profile.contact_phone ?? "",
        open_to_work: profile.open_to_work,
        willing_to_relocate: profile.willing_to_relocate,
        profile_visibility: profile.profile_visibility ?? "private",
        public_username: profile.public_username ?? "",
        resume_public: (profile as any).resume_public ?? false,
        show_only_verified_certs: (profile as any).show_only_verified_certs ?? false,
        social_visibility: ((profile as any).social_visibility as Record<string, boolean>) ?? {},
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
        twitter_url: form.twitter_url.trim() || null,
        instagram_url: form.instagram_url.trim() || null,
        facebook_url: form.facebook_url.trim() || null,
        youtube_url: form.youtube_url.trim() || null,
        github_url: form.github_url.trim() || null,
        website_url: form.website_url.trim() || null,
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        open_to_work: form.open_to_work,
        willing_to_relocate: form.willing_to_relocate,
        profile_visibility: form.profile_visibility,
        public_username: form.public_username.trim().toLowerCase() || null,
        resume_public: form.resume_public,
        show_only_verified_certs: form.show_only_verified_certs,
        social_visibility: form.social_visibility,
      } as any);
      toast({ title: "Profile saved", description: "Your operator profile has been updated." });
    } catch (err) {
      const msg = extractErrorMessage(err);
      console.error("[OperatorProfile] save failed", err);
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Step 1 — upload only.
   * The file is stored, verified JobLine certs are auto-imported, but the resume is NOT
   * parsed yet. The user clicks "Auto-update profile from resume" to run AI extraction.
   */
  const handleResumeUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "File too large", description: "Resume must be under 8MB.", variant: "destructive" });
      return;
    }
    setUploadingResume(true);
    try {
      const url = await uploadFile(file, "resume");
      await saveProfile({ resume_pdf_url: url });
      await recordResumeVersion({
        file_url: url,
        storage_path: pathFromOperatorProfilesUrl(url),
        source: "uploaded",
        file_name: file.name,
        size_bytes: file.size,
      });

      let importedCerts = 0;
      if (user?.id && user.email) {
        try {
          importedCerts = await syncIssuedCertificatesToProfile(user.id, user.email);
        } catch (syncErr) {
          console.error("[OperatorProfile] cert sync failed", syncErr);
        }
      }
      await refresh();

      toast({
        title: "Resume uploaded",
        description:
          importedCerts > 0
            ? `Imported ${importedCerts} verified JobLine certificate(s).`
            : `Resume saved to your profile.`,
      });

      if (autoAutofillOnUpload) {
        await handleAutoUpdateFromResume({ resumeUrlOverride: url, silent: false });
      }
    } catch (err) {
      toast({ title: "Upload failed", description: extractErrorMessage(err), variant: "destructive" });
    } finally {
      setUploadingResume(false);
    }
  };

  /**
   * Step 2 — explicit AI parse + autofill.
   * Triggered by the "Auto-update profile from resume" button on the Resume tab.
   * Honors the `autofillOverwrite` toggle: when true, parsed values replace existing
   * top-level profile fields. New skill/work/edu/machine rows are always deduped.
   */
  const handleAutoUpdateFromResume = async (
    opts: { resumeUrlOverride?: string; silent?: boolean } = {}
  ) => {
    const storedUrl = opts.resumeUrlOverride ?? profile?.resume_pdf_url;
    if (!storedUrl) {
      toast({ title: "No resume uploaded", description: "Upload a PDF or DOCX first.", variant: "destructive" });
      return;
    }
    setAutofilling(true);
    try {
      // Remint a fresh signed URL — stored URLs may have expired (7-day TTL),
      // and parse-resume needs to fetch the file directly from Storage.
      const freshUrl = (await getOperatorProfileSignedUrl(storedUrl, 60 * 10)) ?? storedUrl;
      const { data, error } = await supabase.functions.invoke("parse-resume", {
        body: { resumeUrl: freshUrl },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error ?? "Parse failed");

      const added = await applyResumeAutofill(data.data, { overwrite: autofillOverwrite });
      setLastAutofill({ ...added, at: Date.now() });
      await refresh();

      const total = added.fields + added.skills + added.work + added.education + added.machines;
      toast({
        title: total === 0 ? "Nothing new to add" : "Profile autofilled",
        description:
          total === 0
            ? "Your profile is already complete — no fields needed updating."
            : `Filled ${added.fields} field(s), added ${added.skills} skill(s), ${added.work} job(s), ${added.education} education, ${added.machines} machine(s).`,
      });

      // Optional: regenerate the JobLine résumé PDF from the freshly-filled profile
      if (autoBuildAfterAutofill && total > 0) {
        await handleBuildResume("save");
      }
    } catch (err) {
      const msg = extractErrorMessage(err);
      toast({
        title: "Autofill failed",
        description: msg.includes("aborted")
          ? "Reading your resume took too long. Please try again."
          : msg,
        variant: "destructive",
      });
    } finally {
      setAutofilling(false);
    }
  };

  const handleRemoveResume = async () => {
    if (!profile?.resume_pdf_url) return;
    try {
      const path = pathFromOperatorProfilesUrl(profile.resume_pdf_url);
      await saveProfile({ resume_pdf_url: null, resume_public: false });
      if (path) {
        await supabase.storage.from("operator-profiles").remove([path]);
      }
      setLastAutofill(null);
      toast({ title: "Resume removed", description: "Your uploaded resume has been removed from your profile." });
    } catch (err) {
      toast({ title: "Remove failed", description: extractErrorMessage(err), variant: "destructive" });
    }
  };

  /** Restore a prior résumé version as the active resume_pdf_url. Does not re-upload — just points back to it. */
  const restoreResumeVersion = async (version: { file_url: string }) => {
    try {
      await saveProfile({ resume_pdf_url: version.file_url });
      await refresh();
      toast({ title: "Résumé restored", description: "This version is now your active résumé." });
    } catch (err) {
      toast({ title: "Restore failed", description: extractErrorMessage(err), variant: "destructive" });
    }
  };

  /**
   * Applies parsed resume data to the profile.
   * - `overwrite=false` (default): top-level fields only filled when currently empty.
   * - `overwrite=true`: parsed values replace any existing top-level field that is non-empty.
   * Skill / work / education / machine rows are always deduped — never overwritten.
   * Sensitive contact fields (email/phone) are NEVER auto-set on the public profile;
   * the user must add them manually under Basics.
   */
  const applyResumeAutofill = async (parsed: any, options: { overwrite: boolean } = { overwrite: false }) => {
    if (!user?.id) return { fields: 0, skills: 0, work: 0, education: 0, machines: 0 };
    const counts = { fields: 0, skills: 0, work: 0, education: 0, machines: 0 };
    const overwrite = options.overwrite;

    // 1) Top-level profile fields. Email + phone intentionally excluded for privacy.
    const profilePatch: Record<string, unknown> = {};
    const candidates: Array<[keyof typeof form, string | undefined]> = [
      ["headline", parsed.headline],
      ["bio", parsed.bio],
      ["location_city", parsed.location_city],
      ["location_region", parsed.location_region],
      ["location_country", parsed.location_country],
      ["linkedin_url", parsed.linkedin_url],
      ["portfolio_url", parsed.portfolio_url],
    ];
    for (const [key, val] of candidates) {
      if (!val) continue;
      const current = profile?.[key as keyof typeof profile];
      if (!current || overwrite) {
        profilePatch[key as string] = val;
        counts.fields += 1;
      }
    }
    if (parsed.years_experience && (overwrite || !profile?.years_experience)) {
      profilePatch.years_experience = Math.round(parsed.years_experience);
      counts.fields += 1;
    }
    if (Object.keys(profilePatch).length) {
      await saveProfile(profilePatch as any);
    }

    // 2) Skills — skip duplicates (case-insensitive)
    const existingSkills = new Set(skills.map((s) => s.skill.trim().toLowerCase()));
    for (const s of (parsed.skills ?? []) as Array<{ skill: string; proficiency?: string; years_used?: number }>) {
      const name = s.skill?.trim();
      if (!name || existingSkills.has(name.toLowerCase())) continue;
      const { error } = await supabase.from("operator_skills").insert({
        user_id: user.id,
        skill: name,
        proficiency: s.proficiency ?? "intermediate",
        years_used: s.years_used ?? null,
      });
      if (!error) counts.skills += 1;
    }

    // 3) Work history — dedupe by employer+title
    const existingWork = new Set(workHistory.map((w) => `${w.employer_name}|${w.job_title}`.toLowerCase()));
    for (const w of (parsed.work_history ?? []) as any[]) {
      const key = `${w.employer_name}|${w.job_title}`.toLowerCase();
      if (existingWork.has(key)) continue;
      const { error } = await supabase.from("operator_work_history").insert({
        user_id: user.id,
        employer_name: w.employer_name,
        job_title: w.job_title,
        start_date: w.start_date ?? null,
        end_date: w.is_current ? null : (w.end_date ?? null),
        is_current: !!w.is_current,
        location: w.location ?? null,
        description: w.description ?? null,
      });
      if (!error) counts.work += 1;
    }

    // 4) Education
    const existingEdu = new Set(education.map((e) => `${e.school_name}|${e.degree ?? ""}`.toLowerCase()));
    for (const ed of (parsed.education ?? []) as any[]) {
      const key = `${ed.school_name}|${ed.degree ?? ""}`.toLowerCase();
      if (existingEdu.has(key)) continue;
      const { error } = await supabase.from("operator_education").insert({
        user_id: user.id,
        school_name: ed.school_name,
        degree: ed.degree ?? null,
        field_of_study: ed.field_of_study ?? null,
        start_date: ed.start_date ?? null,
        end_date: ed.end_date ?? null,
      });
      if (!error) counts.education += 1;
    }

    // 5) Machines
    const existingMach = new Set(machines.map((m) => `${m.machine_category}|${m.machine_make ?? ""}|${m.machine_model ?? ""}`.toLowerCase()));
    for (const m of (parsed.machines ?? []) as any[]) {
      const key = `${m.machine_category}|${m.machine_make ?? ""}|${m.machine_model ?? ""}`.toLowerCase();
      if (existingMach.has(key)) continue;
      const { error } = await supabase.from("operator_machine_proficiencies").insert({
        user_id: user.id,
        machine_category: m.machine_category,
        machine_make: m.machine_make ?? null,
        machine_model: m.machine_model ?? null,
        control_type: m.control_type ?? null,
        proficiency: m.proficiency ?? "intermediate",
        years_experience: m.years_experience ?? null,
      });
      if (!error) counts.machines += 1;
    }

    return counts;
  };

  /**
   * Generates a polished PDF résumé from the structured profile data and
   * either downloads it locally or uploads it as the active resume (and
   * optionally publishes it to the public profile).
   */
  const handleBuildResume = async (mode: "download" | "save" | "publish") => {
    if (!user?.id) return;
    if (!profile) {
      toast({ title: "Profile not ready", description: "Save your profile first.", variant: "destructive" });
      return;
    }
    setBuilding(true);
    try {
      const fullName = authProfile?.display_name?.trim() || user.email || "Operator";
      const blob = buildResumePdf({
        fullName,
        profile,
        workHistory,
        education,
        certifications,
        skills,
      });

      if (mode === "download") {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fullName.replace(/[^a-z0-9]+/gi, "_")}_Resume.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Résumé downloaded", description: "Your generated résumé PDF was downloaded." });
        return;
      }

      // Upload as the active resume.
      const file = new File([blob], `${fullName.replace(/[^a-z0-9]+/gi, "_")}_Resume.pdf`, {
        type: "application/pdf",
      });
      const url = await uploadFile(file, "resume");
      await saveProfile({
        resume_pdf_url: url,
        ...(mode === "publish" ? { resume_public: true } : {}),
      });
      await recordResumeVersion({
        file_url: url,
        storage_path: pathFromOperatorProfilesUrl(url),
        source: "generated",
        file_name: file.name,
        size_bytes: file.size,
        note: mode === "publish" ? "Built & published from profile" : "Built from profile",
      });
      await refresh();
      toast({
        title: mode === "publish" ? "Résumé published" : "Résumé saved",
        description:
          mode === "publish"
            ? "Your generated résumé is now visible on your public profile."
            : "Your generated résumé is now your active resume on file.",
      });
    } catch (err) {
      toast({ title: "Build failed", description: extractErrorMessage(err), variant: "destructive" });
    } finally {
      setBuilding(false);
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

        <ShareProfileCard
          username={profile?.public_username ?? null}
          visibility={profile?.profile_visibility ?? "private"}
          displayName={authProfile?.display_name ?? user?.email ?? "Operator"}
          headline={profile?.headline ?? null}
        />

        {/* Nudge: encourage flipping to public after earning verified credentials */}
        {(() => {
          const verifiedCount = certifications.filter((c) => {
            const s = (c.verification_source ?? "").toLowerCase();
            return s.startsWith("verified_") || s === "jobline" || s === "partner" || s === "employer";
          }).length;
          const isPublic = (profile?.profile_visibility ?? "private") === "public";
          if (verifiedCount === 0 || isPublic) return null;
          return (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      Share your {verifiedCount} verified credential{verifiedCount === 1 ? "" : "s"} with the world
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Make your talent profile public so employers and your network can verify your achievements.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="shrink-0"
                  onClick={async () => {
                    setForm((f) => ({ ...f, profile_visibility: "public" }));
                    await saveProfile({ profile_visibility: "public" });
                    toast({ title: "Profile is now public", description: "Your verified achievements are visible on /talent." });
                  }}
                >
                  Make profile public
                </Button>
              </CardContent>
            </Card>
          );
        })()}

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

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-4 md:grid-cols-8 w-full">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="resume">Resume</TabsTrigger>
            <TabsTrigger value="certs">Certs</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="work">Work</TabsTrigger>
            <TabsTrigger value="edu">Education</TabsTrigger>
            <TabsTrigger value="refs">References</TabsTrigger>
            <TabsTrigger value="minisite">Mini-site</TabsTrigger>
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
                  {([
                    { key: "linkedin_url",  vk: "linkedin",  label: "LinkedIn URL",     ph: "https://linkedin.com/in/your-handle" },
                    { key: "portfolio_url", vk: "portfolio", label: "Portfolio URL",    ph: "https://your-site.com" },
                    { key: "website_url",   vk: "website",   label: "Personal website", ph: "https://yourname.com" },
                    { key: "twitter_url",   vk: "twitter",   label: "X / Twitter",      ph: "https://x.com/your-handle" },
                    { key: "instagram_url", vk: "instagram", label: "Instagram",        ph: "https://instagram.com/your-handle" },
                    { key: "facebook_url",  vk: "facebook",  label: "Facebook",         ph: "https://facebook.com/your-page" },
                    { key: "youtube_url",   vk: "youtube",   label: "YouTube",          ph: "https://youtube.com/@your-channel" },
                    { key: "github_url",    vk: "github",    label: "GitHub",           ph: "https://github.com/your-handle" },
                  ] as const).map(({ key, vk, label, ph }) => {
                    const value = form[key] as string;
                    const visible = form.social_visibility[vk] ?? true;
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between gap-2">
                          <Label className="text-sm">{label}</Label>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">{visible ? "Public" : "Hidden"}</span>
                            <Switch
                              checked={visible}
                              disabled={!value.trim()}
                              onCheckedChange={(v) =>
                                setForm((f) => ({
                                  ...f,
                                  social_visibility: { ...f.social_visibility, [vk]: v },
                                }))
                              }
                            />
                          </div>
                        </div>
                        <Input
                          value={value}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          placeholder={ph}
                          className="mt-1"
                        />
                      </div>
                    );
                  })}
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
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <Label className="flex items-center gap-2"><Upload className="w-4 h-4" /> Profile photo</Label>
                    <div className="flex items-center gap-3 mt-2 min-w-0">
                      {profile?.avatar_url && (
                        <img
                          src={profile.avatar_url}
                          alt="Profile"
                          className="h-16 w-16 rounded-full object-cover ring-2 ring-border shrink-0"
                        />
                      )}
                      <FilePicker
                        accept="image/png,image/jpeg,image/webp,image/avif"
                        disabled={uploadingAvatar}
                        loading={uploadingAvatar}
                        label={profile?.avatar_url ? "Replace photo" : "Choose photo"}
                        maxBytes={5 * 1024 * 1024}
                        onTooLarge={() =>
                          toast({ title: "File too large", description: "Photo must be under 5MB.", variant: "destructive" })
                        }
                        rightSlot={
                          profile?.avatar_url ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                await saveProfile({ avatar_url: null });
                                toast({ title: "Photo removed" });
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          ) : undefined
                        }
                        onFile={async (file) => {
                          setUploadingAvatar(true);
                          try {
                            const url = await uploadFile(file, "avatar");
                            await saveProfile({ avatar_url: url });
                            toast({ title: "Profile photo updated" });
                          } catch (err) {
                            toast({ title: "Upload failed", description: extractErrorMessage(err), variant: "destructive" });
                          } finally {
                            setUploadingAvatar(false);
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Square image recommended (min 400×400). Max 5MB.
                    </p>
                  </div>

                  <div className="min-w-0">
                    <Label className="flex items-center gap-2"><Upload className="w-4 h-4" /> Banner image</Label>
                    <div className="flex flex-col gap-2 mt-2 min-w-0">
                      {profile?.banner_url && (
                        <img
                          src={profile.banner_url}
                          alt="Banner"
                          className="h-20 w-full rounded-md object-cover ring-1 ring-border"
                        />
                      )}
                      <FilePicker
                        accept="image/png,image/jpeg,image/webp,image/avif"
                        disabled={uploadingBanner}
                        loading={uploadingBanner}
                        label={profile?.banner_url ? "Replace banner" : "Choose banner"}
                        maxBytes={8 * 1024 * 1024}
                        onTooLarge={() =>
                          toast({ title: "File too large", description: "Banner must be under 8MB.", variant: "destructive" })
                        }
                        rightSlot={
                          profile?.banner_url ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                await saveProfile({ banner_url: null });
                                toast({ title: "Banner removed" });
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          ) : undefined
                        }
                        onFile={async (file) => {
                          setUploadingBanner(true);
                          try {
                            const url = await uploadFile(file, "banner");
                            await saveProfile({ banner_url: url });
                            toast({ title: "Banner updated" });
                          } catch (err) {
                            toast({ title: "Upload failed", description: extractErrorMessage(err), variant: "destructive" });
                          } finally {
                            setUploadingBanner(false);
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Wide image recommended (1500×500). Max 8MB.
                    </p>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resume" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Resume</CardTitle>
                <CardDescription>Upload, review, remove, and share your resume from one dedicated place.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* One unified upload control with toggle options */}
                <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium">Upload your resume</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      One active resume at a time. PDF or DOCX (max 8 MB). Stored privately by default —
                      it's only shown on your public profile when you flip the toggle below.
                    </p>
                  </div>

                  <FilePicker
                    accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.docx"
                    onFile={handleResumeUpload}
                    disabled={uploadingResume || autofilling || building}
                    loading={uploadingResume}
                    label={profile?.resume_pdf_url ? "Replace résumé" : "Choose résumé file"}
                    currentFileName={profile?.resume_pdf_url ? decodeURIComponent(profile.resume_pdf_url.split("/").pop() ?? "") : null}
                    maxBytes={8 * 1024 * 1024}
                    onTooLarge={(_size, max) =>
                      toast({
                        title: "File too large",
                        description: `Resume must be under ${Math.round(max / (1024 * 1024))} MB.`,
                        variant: "destructive",
                      })
                    }
                  />
                  {(autofilling || building) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {autofilling ? "Reading your resume…" : "Building JobLine résumé…"}
                    </p>
                  )}

                  {/* Toggles that control what happens after upload */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-medium">Auto-fill profile from resume</p>
                        <p className="text-xs text-muted-foreground">
                          After upload, AI extracts your headline, bio, location, skills, machines,
                          work history & education. Email/phone/address are never autofilled.
                        </p>
                      </div>
                      <Switch
                        checked={autoAutofillOnUpload}
                        onCheckedChange={setAutoAutofillOnUpload}
                        disabled={uploadingResume || autofilling}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-medium">Overwrite existing fields when autofilling</p>
                        <p className="text-xs text-muted-foreground">
                          OFF: only fills empty fields. ON: replaces headline, bio, location & links.
                          Skills/jobs/education/machines are always merged.
                        </p>
                      </div>
                      <Switch
                        checked={autofillOverwrite}
                        onCheckedChange={setAutofillOverwrite}
                        disabled={autofilling}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-medium">Auto-rebuild JobLine résumé after autofill</p>
                        <p className="text-xs text-muted-foreground">
                          Replaces your active résumé with a freshly generated JobLine-formatted PDF
                          built from your updated profile.
                        </p>
                      </div>
                      <Switch
                        checked={autoBuildAfterAutofill}
                        onCheckedChange={setAutoBuildAfterAutofill}
                        disabled={autofilling || building}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-medium">Show resume on public profile</p>
                        <p className="text-xs text-muted-foreground">
                          When ON, visitors of your /talent page can view & download your résumé.
                        </p>
                      </div>
                      <Switch
                        checked={form.resume_public}
                        onCheckedChange={(v) => setForm((f) => ({ ...f, resume_public: v }))}
                      />
                    </div>
                  </div>

                  {/* Manual actions for the resume already on file */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAutoUpdateFromResume()}
                      disabled={!profile?.resume_pdf_url || autofilling || uploadingResume || building}
                      className="gap-2"
                    >
                      {autofilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {lastAutofill ? "Re-run autofill" : "Run autofill now"}
                    </Button>
                    {profile?.resume_pdf_url && (
                      <>
                        <Button variant="outline" size="sm" asChild>
                          <a href={profile.resume_pdf_url} target="_blank" rel="noopener noreferrer">View resume</a>
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleRemoveResume} disabled={autofilling || building}>
                          Remove resume
                        </Button>
                      </>
                    )}
                    {!profile?.resume_pdf_url && (
                      <Badge variant="outline">No résumé on file yet</Badge>
                    )}
                  </div>

                  {lastAutofill && (
                    <div className="rounded-md border bg-background p-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Last autofill</p>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary">{lastAutofill.fields} field{lastAutofill.fields === 1 ? "" : "s"}</Badge>
                        <Badge variant="secondary">{lastAutofill.skills} skill{lastAutofill.skills === 1 ? "" : "s"}</Badge>
                        <Badge variant="secondary">{lastAutofill.work} job{lastAutofill.work === 1 ? "" : "s"}</Badge>
                        <Badge variant="secondary">{lastAutofill.education} education</Badge>
                        <Badge variant="secondary">{lastAutofill.machines} machine{lastAutofill.machines === 1 ? "" : "s"}</Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* In-platform résumé builder */}
                <div className="rounded-lg border bg-accent/10 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Build a JobLine résumé from your profile
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Generate a polished PDF directly from your profile (summary, work history,
                      education, certifications, skills & awards) using the JobLine layout. Save it as
                      your active résumé, publish to your public profile, or download a copy.
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Tip: complete <span className="font-medium">Basics</span>,{" "}
                      <span className="font-medium">Work</span>, and{" "}
                      <span className="font-medium">Skills</span> first for the best result.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={() => handleBuildResume("save")}
                      disabled={building || uploadingResume || autofilling}
                      className="gap-2"
                    >
                      {building ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      {building ? "Building…" : "Build & save as my résumé"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleBuildResume("publish")}
                      disabled={building || uploadingResume || autofilling}
                      className="gap-2"
                    >
                      <Globe className="w-4 h-4" />
                      Build, save & publish
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleBuildResume("download")}
                      disabled={building || uploadingResume || autofilling}
                      className="gap-2"
                    >
                      Download only
                    </Button>
                  </div>
                </div>

                {/* Résumé version history */}
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Résumé version history
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Every résumé you upload or generate is saved here. Restore an older one as your
                        active résumé, view it, or delete versions you no longer need.
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">{resumeVersions.length} version{resumeVersions.length === 1 ? "" : "s"}</Badge>
                  </div>

                  {resumeVersions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No versions yet. Upload or build a résumé to start tracking history.
                    </p>
                  ) : (
                    <ul className="divide-y rounded-md border bg-background">
                      {resumeVersions.map((v) => {
                        const isActive = profile?.resume_pdf_url === v.file_url;
                        const fname = v.file_name ?? decodeURIComponent(v.file_url.split("/").pop() ?? "résumé.pdf");
                        const sizeKb = v.size_bytes ? Math.max(1, Math.round(v.size_bytes / 1024)) : null;
                        const when = new Date(v.created_at).toLocaleString();
                        return (
                          <li key={v.id} className="p-3 flex flex-wrap items-start justify-between gap-3 min-w-0">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium truncate min-w-0 max-w-full" title={fname}>
                                  {fname}
                                </p>
                                {isActive && <Badge variant="secondary" className="shrink-0">Active</Badge>}
                                <Badge variant="outline" className="shrink-0">
                                  {v.source === "generated" ? "Built" : "Uploaded"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {when}{sizeKb ? ` · ${sizeKb} KB` : ""}{v.note ? ` · ${v.note}` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button variant="outline" size="sm" asChild>
                                <a href={v.file_url} target="_blank" rel="noopener noreferrer">View</a>
                              </Button>
                              {!isActive && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => restoreResumeVersion(v)}
                                >
                                  Restore
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteResumeVersion(v.id, v.storage_path)}
                                disabled={isActive}
                                title={isActive ? "Active version — restore another first or remove from the upload section" : "Delete this version"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <Button onClick={handleSave} disabled={saving || uploadingResume || autofilling} className="gap-2">
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
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-medium">Show only verified certifications publicly</p>
                    <p className="text-xs text-muted-foreground">
                      When ON, your public profile hides self-reported certs and only shows OAP, GCA, and other verified credentials.
                    </p>
                  </div>
                  <Switch
                    checked={form.show_only_verified_certs}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, show_only_verified_certs: v }))}
                  />
                </div>
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

            {/* JobLine-verified equipment summary (derived from OAP/GCA certs) */}
            <Card className="border-primary/40 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" /> JobLine-verified equipment & controls
                </CardTitle>
                <CardDescription>
                  Pulled from your active OAP / GCA certifications. Pass an OAP module or GCA test to add more — these can't be edited here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const verified = certifications.filter((c) => c.verification_source.startsWith("verified_"));
                  if (verified.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground">
                        No verified equipment yet.{" "}
                        <a href="/oap" className="text-primary hover:underline">Browse OAP programs →</a>
                      </p>
                    );
                  }
                  return (
                    <div className="flex flex-wrap gap-2">
                      {verified.map((c) => (
                        <Badge
                          key={c.id}
                          className="gap-1 bg-primary/15 text-primary border-primary/30"
                          variant="outline"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {c.name}
                          <span className="opacity-70 ml-1">· {c.issuer ?? "JobLine"}</span>
                        </Badge>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5" /> Self-reported equipment & machine proficiencies</CardTitle>
                <CardDescription>
                  Anything you operate but haven't been formally tested on through JobLine — CNC, waterjet, diesel, welding, hydraulics, lab gear, etc. Employers will see these marked <em>self-reported</em>.
                </CardDescription>
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

          <TabsContent value="minisite" className="mt-6">
            <MiniSiteEditor />
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

const ALLOWED_CERT_MIME = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_CERT_BYTES = 10 * 1024 * 1024; // 10MB

/** Extract the storage object path from a Supabase public URL for the operator-profiles bucket. */
function pathFromOperatorProfilesUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = "/operator-profiles/";
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

type CertCategory = "oap" | "gca" | "partner" | "self";

/**
 * Map raw verification_source + linked_cert_id to a display category.
 * Aligns the operator-facing manager with PublicOperatorProfile's classifier
 * so newly issued JobLine credentials don't render as "Self-reported".
 */
function classifyCertSource(src: string | null | undefined, linkedId: string | null | undefined): CertCategory {
  const s = (src ?? "").toLowerCase();
  const linked = linkedId ?? "";
  if (s === "verified_oap" || (s === "jobline" && linked.startsWith("OAP-"))) return "oap";
  if (s === "verified_gca" || (s === "jobline" && linked.startsWith("GCA-"))) return "gca";
  if (s.startsWith("verified_") || s === "jobline" || s === "partner" || s === "employer") return "partner";
  return "self";
}

const CATEGORY_LABEL: Record<CertCategory, string> = {
  oap: "Verified · OAP",
  gca: "Verified · GCA",
  partner: "Verified · Partner",
  self: "Self-reported",
};

function CertificationsManager({
  certs, onChange, uploadFile, userId,
}: {
  certs: ReturnType<typeof useOperatorProfile>["certifications"];
  onChange: () => void;
  uploadFile: (f: File, folder: "resume" | "certs" | "avatar" | "banner") => Promise<string>;
  userId: string;
}) {
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [filter, setFilter] = useState<"all" | CertCategory>("all");
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

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_CERT_MIME.includes(file.type)) {
      return "Only PDF or image files (PNG, JPG, WEBP) are allowed.";
    }
    if (file.size > MAX_CERT_BYTES) {
      return `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`;
    }
    return null;
  };

  const uploadAttachment = async (certId: string, file: File, currentUrl: string | null) => {
    const err = validateFile(file);
    if (err) {
      toast({ title: "Invalid file", description: err, variant: "destructive" });
      return;
    }
    try {
      const url = await uploadFile(file, "certs");
      await supabase.from("operator_certifications").update({ attachment_url: url }).eq("id", certId);
      // Best-effort: remove the previous attachment from storage so we don't orphan files.
      const oldPath = pathFromOperatorProfilesUrl(currentUrl);
      if (oldPath) await supabase.storage.from("operator-profiles").remove([oldPath]);
      onChange();
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    }
  };

  /** Hard-delete the cert row AND its storage object (if any). */
  const remove = async (id: string, attachmentUrl: string | null) => {
    const { error } = await supabase.from("operator_certifications").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    const path = pathFromOperatorProfilesUrl(attachmentUrl);
    if (path) {
      await supabase.storage.from("operator-profiles").remove([path]);
    }
    onChange();
  };

  /** Detach + delete just the uploaded file, keep the cert row metadata. */
  const removeAttachment = async (id: string, attachmentUrl: string | null) => {
    const { error } = await supabase
      .from("operator_certifications")
      .update({ attachment_url: null })
      .eq("id", id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    const path = pathFromOperatorProfilesUrl(attachmentUrl);
    if (path) await supabase.storage.from("operator-profiles").remove([path]);
    onChange();
  };

  const toggleVisibility = async (id: string, visible: boolean) => {
    const { error } = await supabase
      .from("operator_certifications")
      .update({ is_public: visible } as never)
      .eq("id", id);
    if (error) {
      toast({ title: "Failed to update visibility", description: error.message, variant: "destructive" });
      return;
    }
    onChange();
  };

  const uploadedCerts = [...certs]
    .filter((c) => !!c.attachment_url)
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  const counts = certs.reduce<Record<"all" | CertCategory, number>>(
    (acc, c) => {
      const cat = classifyCertSource(c.verification_source, c.linked_cert_id);
      acc.all += 1;
      acc[cat] += 1;
      return acc;
    },
    { all: 0, oap: 0, gca: 0, partner: 0, self: 0 },
  );

  const filteredCerts = certs.filter(
    (c) => filter === "all" || classifyCertSource(c.verification_source, c.linked_cert_id) === filter,
  );

  const FILTER_OPTIONS: { value: "all" | CertCategory; label: string }[] = [
    { value: "all", label: "All" },
    { value: "oap", label: "OAP" },
    { value: "gca", label: "GCA" },
    { value: "partner", label: "Partner" },
    { value: "self", label: "Self" },
  ];

  return (
    <div className="space-y-3">
      {certs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filter === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {opt.label} <span className="opacity-70">({counts[opt.value]})</span>
            </button>
          ))}
        </div>
      )}

      {filteredCerts.map((c) => {
        const cat = classifyCertSource(c.verification_source, c.linked_cert_id);
        const isVerified = cat !== "self";
        return (
        <div key={c.id} className="border rounded-lg p-3 space-y-2 overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium break-words">{c.name}</p>
                {isVerified ? (
                  <Badge className="gap-1 bg-primary/15 text-primary border-primary/30 shrink-0">
                    <ShieldCheck className="w-3 h-3" /> {CATEGORY_LABEL[cat]}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0">Self-reported</Badge>
                )}
              </div>
              {c.issuer && <p className="text-sm text-muted-foreground break-words">{c.issuer}</p>}
              <p className="text-xs text-muted-foreground">
                {c.issued_date && `Issued ${c.issued_date}`}{c.expires_date && ` · Expires ${c.expires_date}`}
              </p>
              {(c.linked_cert_id || c.credential_id) && (
                <p className="text-xs text-muted-foreground font-mono break-all">
                  Certificate #{c.linked_cert_id ?? c.credential_id}
                </p>
              )}
              {c.credential_url && (
                <a href={c.credential_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline break-all">
                  View credential
                </a>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!isVerified && (
                <>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      hidden
                      accept="application/pdf,image/png,image/jpeg,image/webp"
                      onChange={(e) => e.target.files?.[0] && uploadAttachment(c.id, e.target.files[0], c.attachment_url)}
                    />
                    <Button size="sm" variant="ghost" asChild><span><Upload className="w-4 h-4" /></span></Button>
                  </label>
                  <Button size="sm" variant="ghost" onClick={() => remove(c.id, c.attachment_url)}><Trash2 className="w-4 h-4" /></Button>
                </>
              )}
            </div>
          </div>
          {c.attachment_url && (
            <a href={c.attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline break-all">View attachment</a>
          )}
          <div className="flex items-center justify-between gap-2 border-t pt-2 mt-1">
            <div className="text-xs text-muted-foreground min-w-0 truncate">
              {(c as { is_public?: boolean }).is_public === false ? "Hidden from public profile" : "Visible on public profile"}
            </div>
            <Switch
              checked={(c as { is_public?: boolean }).is_public !== false}
              onCheckedChange={(v) => toggleVisibility(c.id, v)}
            />
          </div>
        </div>
        );
      })}

      {filteredCerts.length === 0 && certs.length > 0 && (
        <p className="text-xs text-muted-foreground py-3 text-center">
          No certifications in this category.
        </p>
      )}

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
          <p className="text-[11px] text-muted-foreground">
            After adding, use the upload icon to attach the certificate (PDF, PNG, JPG, or WEBP — max 10MB).
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={add}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)} className="gap-2"><Plus className="w-4 h-4" /> Add certification</Button>
      )}

      {/* Upload history panel */}
      <div className="border rounded-lg bg-muted/20">
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/40 rounded-lg"
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Upload history
            <Badge variant="secondary" className="ml-1">{uploadedCerts.length}</Badge>
          </span>
          <span className="text-xs text-muted-foreground">{showHistory ? "Hide" : "Show"}</span>
        </button>
        {showHistory && (
          <div className="px-3 pb-3 space-y-2">
            {uploadedCerts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                No file attachments yet. Upload PDFs or images on a certification above.
              </p>
            ) : (
              uploadedCerts.map((c) => {
                const verified = c.verification_source.startsWith("verified_");
                return (
                  <div key={`hist-${c.id}`} className="flex items-center justify-between gap-3 border rounded-md bg-background px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        {verified && (
                          <Badge className="gap-1 bg-primary/15 text-primary border-primary/30 text-[10px] py-0 px-1.5">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Uploaded {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                      </p>
                      {(c.linked_cert_id || c.credential_id) && (
                        <p className="text-[11px] text-muted-foreground font-mono truncate">
                          Certificate #{c.linked_cert_id ?? c.credential_id}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={c.attachment_url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs px-2"
                      >
                        Open
                      </a>
                      {!verified && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Delete uploaded file"
                          onClick={() => removeAttachment(c.id, c.attachment_url)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <p className="text-[10px] text-muted-foreground">
              Verified OAP/GCA files are managed by JobLine and can't be deleted here. Removing a self-reported file detaches it permanently.
            </p>
          </div>
        )}
      </div>
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
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          className="flex-1 min-w-0"
          placeholder="Skill (e.g. Welding, Hydraulics, GD&T, Diesel Diagnostics, Waterjet Setup)"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
        />
        <div className="flex gap-2">
          <select
            className="flex-1 sm:flex-none border rounded px-3 h-10 text-sm bg-background"
            value={proficiency}
            onChange={(e) => setProficiency(e.target.value as typeof PROFICIENCY_LEVELS[number])}
          >
            {PROFICIENCY_LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <Button onClick={add} className="shrink-0"><Plus className="w-4 h-4" /></Button>
        </div>
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
      {machines.length === 0 && (
        <p className="text-sm text-muted-foreground border border-dashed rounded-md p-3 text-center">
          No self-reported equipment yet. Add anything you operate below.
        </p>
      )}
      {machines.map((m) => (
        <div key={m.id} className="flex items-center justify-between border rounded p-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm truncate">
                {m.machine_category} {m.machine_make && `· ${m.machine_make}`} {m.machine_model && m.machine_model}
              </p>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5">Self-reported</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {m.control_type} · {m.proficiency}{m.years_experience && ` · ${m.years_experience}y`}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => remove(m.id)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ))}
      <div className="border rounded p-3 space-y-3 bg-secondary/30">
        <p className="text-xs text-muted-foreground">
          Add any equipment, tools, or systems you operate — CNC, waterjet, press brake, diesel engines, hydraulic systems, welders, forklifts, plasma cutters, robots, lab instruments, etc.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            placeholder="Category * (e.g. CNC Mill, Waterjet, Diesel Engine, MIG Welder)"
            value={draft.machine_category}
            onChange={(e) => setDraft({ ...draft, machine_category: e.target.value })}
          />
          <Input
            placeholder="Make / Brand (e.g. Haas, Flow, Cummins, Lincoln)"
            value={draft.machine_make}
            onChange={(e) => setDraft({ ...draft, machine_make: e.target.value })}
          />
          <Input
            placeholder="Model (e.g. VF-2, Mach 500, ISX15)"
            value={draft.machine_model}
            onChange={(e) => setDraft({ ...draft, machine_model: e.target.value })}
          />
          <Input
            placeholder="Control / System (e.g. Fanuc, Siemens, ECM, N/A)"
            value={draft.control_type}
            onChange={(e) => setDraft({ ...draft, control_type: e.target.value })}
          />
          <select
            className="border rounded px-3 h-10 text-sm bg-background w-full"
            value={draft.proficiency}
            onChange={(e) => setDraft({ ...draft, proficiency: e.target.value })}
          >
            {PROFICIENCY_LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <Input
            type="number"
            step="0.5"
            placeholder="Years of experience"
            value={draft.years_experience}
            onChange={(e) => setDraft({ ...draft, years_experience: e.target.value })}
          />
        </div>
        <Button onClick={add} className="gap-2 w-full sm:w-auto"><Plus className="w-4 h-4" /> Add equipment</Button>
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
  const sorted = [...rows].sort((a, b) => {
    if (a.is_current && !b.is_current) return -1;
    if (!a.is_current && b.is_current) return 1;
    const ad = a.start_date ?? "";
    const bd = b.start_date ?? "";
    return bd.localeCompare(ad);
  });

  return (
    <div className="space-y-4">
      {sorted.length === 0 && (
        <p className="text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center">
          No employers added yet. Add your most recent role below — it stays with you across every shop you work for.
        </p>
      )}

      {sorted.map((w) => (
        <div
          key={w.id}
          className="border rounded-lg p-4 bg-card shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-base">{w.job_title}</p>
                {w.is_current && (
                  <Badge className="bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30" variant="outline">
                    Current
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium text-primary mt-0.5">{w.employer_name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {w.start_date ?? "?"} – {w.is_current ? "Present" : (w.end_date ?? "?")}
                {w.location && ` · ${w.location}`}
              </p>
              {w.description && (
                <p className="text-sm mt-2 whitespace-pre-line text-foreground/90">{w.description}</p>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={() => remove(w.id)} aria-label="Remove role">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}

      <div className="border-2 border-dashed rounded-lg p-4 space-y-3 bg-secondary/20">
        <p className="text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add a previous (or current) employer
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input placeholder="Employer *" value={draft.employer_name} onChange={(e) => setDraft({ ...draft, employer_name: e.target.value })} />
          <Input placeholder="Job title *" value={draft.job_title} onChange={(e) => setDraft({ ...draft, job_title: e.target.value })} />
          <div>
            <Label className="text-xs text-muted-foreground">Start date</Label>
            <Input type="date" value={draft.start_date} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">End date</Label>
            <Input type="date" value={draft.end_date} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} disabled={draft.is_current} />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={draft.is_current} onChange={(e) => setDraft({ ...draft, is_current: e.target.checked })} /> I currently work here
          </label>
          <Input placeholder="Location (city, state)" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className="sm:col-span-2" />
        </div>
        <Textarea
          placeholder="What did you do here? (machines run, certifications earned on-site, achievements)"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          rows={3}
        />
        <Button onClick={add} className="gap-2"><Plus className="w-4 h-4" /> Save role</Button>
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

/* ─────────────────────────────────────────────────────────────
 * ShareProfileCard — share / view your public talent profile.
 * Only fully active when the profile has a public_username
 * AND visibility is "public". Otherwise prompts the user to
 * configure those fields first.
 * ───────────────────────────────────────────────────────────── */
function ShareProfileCard({
  username,
  visibility,
  displayName,
  headline,
}: {
  username: string | null;
  visibility: "private" | "employers_only" | "public";
  displayName: string;
  headline: string | null;
}) {
  const { toast } = useToast();
  const isLive = !!username && visibility === "public";
  const publicUrl = username ? getPublicTalentUrl(username) : null;

  const shareText = headline
    ? `${displayName} — ${headline} · JobLine Talent Profile`
    : `${displayName} · JobLine Talent Profile`;

  const copy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({ title: "Link copied", description: publicUrl });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const nativeShare = async () => {
    if (!publicUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, text: shareText, url: publicUrl });
      } catch {
        /* user cancelled */
      }
    } else {
      copy();
    }
  };

  if (!isLive) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" /> Share your profile
          </CardTitle>
          <CardDescription>
            {visibility !== "public"
              ? "Set visibility to Public below to generate a shareable link."
              : "Pick a public username below to generate a shareable link."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl!)}`;
  const xShare = `https://twitter.com/intent/tweet?url=${encodeURIComponent(publicUrl!)}&text=${encodeURIComponent(shareText)}`;
  const emailShare = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${shareText}\n\n${publicUrl}`)}`;

  return (
    <Card className="border-primary bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5" /> Share your public profile
        </CardTitle>
        <CardDescription>
          Your profile is live. Share this link with employers, on social, or in your email signature.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input readOnly value={publicUrl!} onFocus={(e) => e.currentTarget.select()} className="font-mono text-sm" />
          <Button type="button" variant="secondary" onClick={copy} className="gap-2 shrink-0">
            <Copy className="w-4 h-4" /> Copy
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline" className="gap-2">
            <a href={publicUrl!} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" /> View public profile
            </a>
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={nativeShare} className="gap-2">
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2">
            <a href={linkedinShare} target="_blank" rel="noopener noreferrer">
              <Linkedin className="w-4 h-4" /> LinkedIn
            </a>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2">
            <a href={xShare} target="_blank" rel="noopener noreferrer">
              <Sparkles className="w-4 h-4" /> X / Twitter
            </a>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2">
            <a href={emailShare}>
              <FileText className="w-4 h-4" /> Email
            </a>
          </Button>
          <Button asChild size="sm" variant="ghost" className="gap-2">
            <a
              href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(publicUrl!)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <QrCode className="w-4 h-4" /> QR code
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

