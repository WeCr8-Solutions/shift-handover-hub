/**
 * Platform-admin-only console for managing JobLine.ai certifying mentors.
 *
 * Two modes:
 *   • Pending queue → review org-nominated mentors and approve/reject.
 *   • Platform mentors → JobLine.ai's own approved mentor pool used for
 *     self-pay GCA/OAP certificates.
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck,
  Check,
  Clock,
  Ban,
  Search,
  UserPlus,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCertifyingMentors,
  type CertifyingMentor,
  type MentorProgram,
  type MentorScope,
} from "@/hooks/useCertifyingMentors";

interface PlatformMentorRegistryProps {
  isPlatformAdmin: boolean;
}

export function PlatformMentorRegistry({ isPlatformAdmin }: PlatformMentorRegistryProps) {
  if (!isPlatformAdmin) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Platform admin access required to manage certifying mentors.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="w-4 h-4" />
            Certifying Mentors — JobLine.ai Registry
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Every real GCA/OAP certificate must be signed by an approved mentor.
            Approve or reject org nominations here, and curate JobLine.ai's own
            mentor pool used for self-pay learners.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending review</TabsTrigger>
          <TabsTrigger value="org">Approved org mentors</TabsTrigger>
          <TabsTrigger value="platform">Platform mentors</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <MentorList scope="any" approvalStatus="pending" />
        </TabsContent>
        <TabsContent value="org" className="mt-4">
          <MentorList scope="org" approvalStatus="approved" />
        </TabsContent>
        <TabsContent value="platform" className="mt-4 space-y-4">
          <AddPlatformMentorForm />
          <MentorList scope="platform" approvalStatus="any" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mentor list with platform-admin actions
// ---------------------------------------------------------------------------

interface MentorListProps {
  scope: MentorScope | "any";
  approvalStatus: "pending" | "approved" | "revoked" | "any";
}

function MentorList({ scope, approvalStatus }: MentorListProps) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const list = useQuery({
    queryKey: ["platform-cert-mentors", scope, approvalStatus],
    queryFn: async () => {
      let q = (supabase as any).from("certifying_mentors").select("*").order("designated_at", {
        ascending: false,
      });
      if (scope !== "any") q = q.eq("scope", scope);
      if (approvalStatus !== "any") q = q.eq("approval_status", approvalStatus);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CertifyingMentor[];
    },
  });

  const filtered = useMemo(() => {
    const rows = list.data ?? [];
    if (!search.trim()) return rows;
    const needle = search.toLowerCase();
    return rows.filter(
      (m) =>
        (m.user_name ?? "").toLowerCase().includes(needle) ||
        (m.title ?? "").toLowerCase().includes(needle) ||
        (m.notes ?? "").toLowerCase().includes(needle) ||
        m.user_id.toLowerCase().includes(needle),
    );
  }, [list.data, search]);

  const updateStatus = async (id: string, status: "approved" | "revoked") => {
    const patch: Record<string, unknown> = { approval_status: status };
    if (status === "approved") {
      patch.approved_at = new Date().toISOString();
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) patch.approved_by = auth.user.id;
    }
    const { error } = await (supabase as any)
      .from("certifying_mentors")
      .update(patch)
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Mentor approved" : "Mentor revoked");
    qc.invalidateQueries({ queryKey: ["platform-cert-mentors"] });
    qc.invalidateQueries({ queryKey: ["certifying-mentors"] });
  };

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, title, notes, user id…"
            className="pl-9"
          />
        </div>

        <div className="border rounded-md divide-y">
          {list.isLoading && (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          )}
          {!list.isLoading && filtered.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground text-center">
              No mentors match this view.
            </div>
          )}
          {filtered.map((m) => (
            <div key={m.id} className="p-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
              <div className="space-y-1 min-w-0">
                <div className="text-sm font-medium truncate flex items-center gap-2 flex-wrap">
                  {m.user_name ?? m.user_id.slice(0, 8)}
                  {m.title && (
                    <span className="text-xs text-muted-foreground">— {m.title}</span>
                  )}
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase tracking-wider"
                  >
                    {m.scope}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase tracking-wider"
                  >
                    {(m.programs ?? []).join(" + ") || "—"}
                  </Badge>
                  <StatusBadge status={m.approval_status} />
                </div>
                {m.notes && <div className="text-xs text-muted-foreground">{m.notes}</div>}
                <div className="text-xs text-muted-foreground">
                  Designated {new Date(m.designated_at).toLocaleDateString()}
                  {m.organization_id && (
                    <span className="ml-2">
                      · Org <code className="font-mono">{m.organization_id.slice(0, 8)}</code>
                    </span>
                  )}
                  {m.approved_at && (
                    <span className="ml-2">
                      · Approved {new Date(m.approved_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {(m.credentials_url || m.signature_url) && (
                  <div className="flex gap-3 text-xs">
                    {m.credentials_url && (
                      <a
                        href={m.credentials_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Credentials
                      </a>
                    )}
                    {m.signature_url && (
                      <a
                        href={m.signature_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Signature sample
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 justify-end">
                {m.approval_status !== "approved" && (
                  <Button
                    size="sm"
                    onClick={() => updateStatus(m.id, "approved")}
                    className="gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </Button>
                )}
                {m.approval_status !== "revoked" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(m.id, "revoked")}
                    className="gap-1"
                  >
                    <Ban className="w-3.5 h-3.5" /> Revoke
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: CertifyingMentor["approval_status"] }) {
  if (status === "approved")
    return (
      <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
        <Check className="w-3 h-3" /> Approved
      </Badge>
    );
  if (status === "revoked") return <Badge variant="destructive">Revoked</Badge>;
  return (
    <Badge className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
      <Clock className="w-3 h-3" /> Pending
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Add platform mentor form (JobLine.ai's own pool)
// ---------------------------------------------------------------------------

function AddPlatformMentorForm() {
  const { designate } = useCertifyingMentors({ scope: "platform" });
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [title, setTitle] = useState("JobLine.ai Certifying Mentor");
  const [credentialsUrl, setCredentialsUrl] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [programs, setPrograms] = useState<MentorProgram[]>(["OAP", "GCA"]);

  const toggleProgram = (p: MentorProgram, checked: boolean) => {
    setPrograms((prev) => {
      const next = new Set(prev);
      if (checked) next.add(p);
      else next.delete(p);
      if (next.size === 0) next.add("OAP");
      return Array.from(next) as MentorProgram[];
    });
  };

  const handleAdd = async () => {
    if (!userId.trim()) {
      toast.error("Provide the mentor's JobLine user ID (UUID)");
      return;
    }
    designate.mutate({
      user_id: userId.trim(),
      user_name: userName.trim() || null,
      title: title.trim() || null,
      programs,
      scope: "platform",
      organization_id: null,
    });
    // We do NOT auto-approve here — the platform admin must approve in the
    // list below to attach signature/credentials and sanity-check.
    setUserId("");
    setUserName("");
    setCredentialsUrl("");
    setSignatureUrl("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Add JobLine platform mentor</CardTitle>
        <p className="text-xs text-muted-foreground">
          Adds a mentor row in the platform pool. Approve below to make them
          signable for self-pay certificate purchases.
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">JobLine user ID *</Label>
          <Input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="UUID from auth.users / profiles"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Display name</Label>
          <Input value={userName} onChange={(e) => setUserName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Programs</Label>
          <div className="flex gap-4 pt-2">
            {(["OAP", "GCA"] as MentorProgram[]).map((p) => (
              <label key={p} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={programs.includes(p)}
                  onCheckedChange={(c) => toggleProgram(p, !!c)}
                />
                {p}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Credentials URL (résumé/cert proof)</Label>
          <Input
            value={credentialsUrl}
            onChange={(e) => setCredentialsUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Signature image URL</Label>
          <Input
            value={signatureUrl}
            onChange={(e) => setSignatureUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button onClick={handleAdd} disabled={designate.isPending} className="gap-1">
            <UserPlus className="w-4 h-4" /> Add mentor (pending review)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
