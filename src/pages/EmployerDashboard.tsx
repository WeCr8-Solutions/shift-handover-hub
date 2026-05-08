/**
 * /employers/dashboard — Employer command center.
 * Tabs: Overview, Jobs (CRUD), Candidates (search), Profile link.
 * Auth-gated. Requires org admin or supervisor role on a public_employer org.
 */
import { useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Header } from "@/components/Header";
import { Briefcase, Users, ExternalLink, Plus, Pencil, Trash2, Eye, MapPin, Building2, Loader2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { PermissionAwareEmpty } from "@/components/shared/PermissionAwareEmpty";

type JobStatus = "draft" | "published" | "closed";
type EmploymentType = "full_time" | "part_time" | "contract" | "internship";

interface JobPosting {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  location: string | null;
  remote: boolean;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  required_skills: string[] | null;
  status: string;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface JobFormState {
  title: string;
  description: string;
  location: string;
  remote: boolean;
  employment_type: EmploymentType;
  salary_min: string;
  salary_max: string;
  required_skills: string;
  status: JobStatus;
}

const emptyForm: JobFormState = {
  title: "",
  description: "",
  location: "",
  remote: false,
  employment_type: "full_time",
  salary_min: "",
  salary_max: "",
  required_skills: "",
  status: "draft",
};

export default function EmployerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { organization, loading: orgLoading } = useOrganization();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<JobFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<JobPosting | null>(null);

  const orgId = organization?.id;
  const isPublicEmployer = (organization as any)?.public_employer === true;
  const employerSlug = (organization as any)?.public_slug as string | undefined;

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["employer-jobs", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as JobPosting[];
    },
  });

  const stats = useMemo(() => {
    const list = jobs || [];
    return {
      total: list.length,
      published: list.filter((j) => j.status === "published").length,
      draft: list.filter((j) => j.status === "draft").length,
      closed: list.filter((j) => j.status === "closed").length,
    };
  }, [jobs]);

  const upsertMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !user) throw new Error("Not ready");
      const payload = {
        organization_id: orgId,
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim() || null,
        remote: form.remote,
        employment_type: form.employment_type,
        salary_min: form.salary_min ? parseInt(form.salary_min, 10) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max, 10) : null,
        required_skills: form.required_skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        status: form.status,
        published_at:
          form.status === "published" ? new Date().toISOString() : null,
        created_by: user.id,
      };
      if (editingId) {
        const { error } = await supabase
          .from("job_postings")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("job_postings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Job updated" : "Job created");
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["employer-jobs", orgId] });
    },
    onError: (e: any) => toast.error(e.message || "Save failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_postings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Job deleted");
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["employer-jobs", orgId] });
    },
    onError: (e: any) => toast.error(e.message || "Delete failed"),
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(job: JobPosting) {
    setEditingId(job.id);
    setForm({
      title: job.title,
      description: job.description,
      location: job.location || "",
      remote: job.remote,
      employment_type: (job.employment_type as EmploymentType) || "full_time",
      salary_min: job.salary_min?.toString() || "",
      salary_max: job.salary_max?.toString() || "",
      required_skills: (job.required_skills || []).join(", "),
      status: (job.status as JobStatus) || "draft",
    });
    setDialogOpen(true);
  }

  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!organization) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <PermissionAwareEmpty
            mode="permission"
            title="Organization required"
            description="You must belong to an organization to access the employer dashboard."
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Employer Dashboard | JobLine</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
              Employer Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">{organization.name}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isPublicEmployer && employerSlug && (
              <Button variant="outline" asChild>
                <Link to={`/employers/${employerSlug}`} target="_blank" rel="noopener">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View public profile
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to="/settings">Edit profile</Link>
            </Button>
          </div>
        </div>

        {!isPublicEmployer && (
          <Card className="mb-6 border-warning/50 bg-warning/5">
            <CardContent className="pt-6">
              <p className="text-sm">
                Your organization is not yet a <strong>public employer</strong>. Enable it in
                Settings to publish jobs and appear in the directory.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total jobs" value={stats.total} icon={Briefcase} />
          <StatCard label="Published" value={stats.published} icon={Eye} accent="text-green-600" />
          <StatCard label="Drafts" value={stats.draft} icon={Pencil} accent="text-muted-foreground" />
          <StatCard label="Closed" value={stats.closed} icon={BarChart3} accent="text-muted-foreground" />
        </div>

        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="jobs">
              <Briefcase className="h-4 w-4 mr-2" />
              Jobs
            </TabsTrigger>
            <TabsTrigger value="candidates">
              <Users className="h-4 w-4 mr-2" />
              Candidates
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Job postings</h2>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                New job
              </Button>
            </div>

            {jobsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !jobs || jobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">No jobs yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your first posting to start attracting talent.
                  </p>
                  <Button onClick={openCreate} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create job
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{job.title}</h3>
                            <StatusBadge status={job.status} />
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {job.location}
                              </span>
                            )}
                            {job.remote && <Badge variant="secondary">Remote</Badge>}
                            <span className="capitalize">{job.employment_type.replace("_", " ")}</span>
                            {(job.salary_min || job.salary_max) && (
                              <span>
                                ${job.salary_min?.toLocaleString() || "?"} – ${job.salary_max?.toLocaleString() || "?"}
                              </span>
                            )}
                          </div>
                          {job.required_skills && job.required_skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {job.required_skills.slice(0, 6).map((s) => (
                                <Badge key={s} variant="outline" className="text-xs">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(job)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(job)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Candidates Tab */}
          <TabsContent value="candidates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search the talent network</CardTitle>
                <CardDescription>
                  Browse vetted CNC operators and machinists with verified certifications and
                  portfolios.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/talent/search">
                    <Users className="h-4 w-4 mr-2" />
                    Search candidates
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/talent/browse">Browse all profiles</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/oap/employer">OAP-verified pool</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/gca/employer">GCA-tested pool</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit job posting" : "New job posting"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="CNC Machinist – Swiss Lathe"
                maxLength={150}
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={6}
                placeholder="Role responsibilities, experience required, shift schedule, benefits..."
                maxLength={5000}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="City, State"
                />
              </div>
              <div>
                <Label htmlFor="employment_type">Employment type</Label>
                <Select
                  value={form.employment_type}
                  onValueChange={(v) => setForm({ ...form, employment_type: v as EmploymentType })}
                >
                  <SelectTrigger id="employment_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full time</SelectItem>
                    <SelectItem value="part_time">Part time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <Label htmlFor="salary_min">Salary min ($/yr)</Label>
                <Input
                  id="salary_min"
                  type="number"
                  value={form.salary_min}
                  onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="salary_max">Salary max ($/yr)</Label>
                <Input
                  id="salary_max"
                  type="number"
                  value={form.salary_max}
                  onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3 pb-2">
                <Switch
                  id="remote"
                  checked={form.remote}
                  onCheckedChange={(v) => setForm({ ...form, remote: v })}
                />
                <Label htmlFor="remote">Remote-friendly</Label>
              </div>
            </div>
            <div>
              <Label htmlFor="skills">Required skills (comma-separated)</Label>
              <Input
                id="skills"
                value={form.required_skills}
                onChange={(e) => setForm({ ...form, required_skills: e.target.value })}
                placeholder="Mastercam, Haas, Swiss-type, GD&T"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as JobStatus })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (private)</SelectItem>
                  <SelectItem value="published">Published (public)</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => upsertMutation.mutate()}
              disabled={!form.title.trim() || !form.description.trim() || upsertMutation.isPending}
            >
              {upsertMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? "Save changes" : "Create job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job posting?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: any;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Icon className={`h-4 w-4 ${accent || "text-primary"}`} />
          </div>
          <div>
            <div className="text-2xl font-bold leading-none">{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: any; label: string }> = {
    draft: { variant: "secondary", label: "Draft" },
    published: { variant: "default", label: "Published" },
    closed: { variant: "outline", label: "Closed" },
  };
  const cfg = map[status] || { variant: "outline", label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
