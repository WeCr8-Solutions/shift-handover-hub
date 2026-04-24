import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Award, Loader2, ExternalLink, Eye, Search, User } from "lucide-react";
import { useCertificates } from "@/hooks/useCertificates";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useOrganization } from "@/hooks/useOrganization";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { useOapRolePrograms, useRoleProgramCourses } from "@/hooks/useOapProgram";
import { useGcaBanks } from "@/hooks/useGcaAdmin";
import { CertificateTemplate as CertPreview } from "./CertificateTemplate";
import type { CertificateRecord, CertificateProgram, OapVertical } from "@/lib/certificates";

const VERTICALS: { value: OapVertical; label: string }[] = [
  { value: "machining", label: "Machining" },
  { value: "cabinetry", label: "Cabinetry" },
  { value: "automotive", label: "Automotive" },
  { value: "welding", label: "Welding" },
  { value: "construction", label: "Construction" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "hvac", label: "HVAC" },
  { value: "general", label: "General" },
];

/**
 * Admin-facing certificate issuance form. Shared by OAP and GCA.
 * Features:
 *   - Recipient picker that auto-fills from org members (so admins can pick "Patrick" by name)
 *   - Optional link to a role program (OAP) or question bank (GCA) — auto-fills program name
 *   - Vertical selector (OAP only) — encoded in cert ID
 *   - Live preview before issuing
 */
export function CertificateIssuancePanel({ defaultOrgId }: { defaultOrgId?: string }) {
  const { issueCertificate, issuing } = useCertificates();
  const { toast } = useToast();
  const { organization } = useOrganization();
  const orgId = defaultOrgId ?? organization?.id ?? null;
  const { members } = useOrganizationMembers(orgId);

  const [program, setProgram] = useState<CertificateProgram>("OAP");
  const [vertical, setVertical] = useState<OapVertical>("machining");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [programName, setProgramName] = useState("");
  const [linkedRoleProgramId, setLinkedRoleProgramId] = useState<string>("none");
  const [linkedBankId, setLinkedBankId] = useState<string>("none");
  const [issuedCertId, setIssuedCertId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Role programs (OAP)
  const { programs: rolePrograms } = useOapRolePrograms();
  const { data: programCourses = [] } = useRoleProgramCourses(
    program === "OAP" && linkedRoleProgramId !== "none" ? linkedRoleProgramId : null,
  );

  // Question banks (GCA)
  const { data: gcaBanks = [] } = useGcaBanks();

  const filteredMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return (members ?? []).slice(0, 20);
    return (members ?? [])
      .filter((m) => {
        const name = (m.profile?.display_name ?? "").toLowerCase();
        const email = (m.profile?.email ?? "").toLowerCase();
        return name.includes(q) || email.includes(q);
      })
      .slice(0, 20);
  }, [members, memberQuery]);

  const items = useMemo<NonNullable<CertificateRecord["items"]>>(() => {
    if (program === "OAP" && linkedRoleProgramId !== "none") {
      const role = rolePrograms.find((r) => r.id === linkedRoleProgramId);
      const out: NonNullable<CertificateRecord["items"]> = [];
      // Course items will be loaded via programCourses; we display titles by joining names already on the role program.
      for (const c of programCourses) {
        out.push({ type: "course", label: (c as any).course_title ?? (c as any).title ?? "Course" });
      }
      for (const t of role?.required_inspection_tool_slugs ?? []) {
        out.push({ type: "inspection_tool", label: t });
      }
      for (const o of role?.required_machining_operation_slugs ?? []) {
        out.push({ type: "machining_operation", label: o });
      }
      for (const m of role?.required_machine_tags ?? []) {
        out.push({ type: "machine", label: m });
      }
      return out;
    }
    if (program === "GCA" && linkedBankId !== "none") {
      const b = gcaBanks.find((x) => x.id === linkedBankId);
      return b ? [{ type: "course", label: b.title }] : [];
    }
    return [];
  }, [program, linkedRoleProgramId, linkedBankId, rolePrograms, gcaBanks, programCourses]);

  const previewCert: CertificateRecord = useMemo(() => ({
    certId: program === "OAP"
      ? (vertical === "machining" ? "OAP-PREVIEW-2026" : `OAP-${vertical.toUpperCase().slice(0,4)}-PREVIEW-2026`)
      : "GCA-PREVIEW-2026",
    qrToken: "preview",
    program,
    programName: programName || (program === "OAP" ? "OAP — Floor Certified" : "G-Code Academy"),
    recipientName: recipientName || "(recipient name)",
    recipientUsername: null,
    recipientEmail: null,
    organizationName: organization?.name ?? null,
    status: "active",
    validFrom: new Date().toISOString(),
    validUntil: null,
    issuedAt: new Date().toISOString(),
    pdfUrl: null,
    vertical: program === "OAP" ? vertical : undefined,
    items,
  }), [program, vertical, programName, recipientName, organization, items]);

  const pickMember = (m: any) => {
    setRecipientName(m.profile?.display_name ?? m.profile?.email ?? "");
    setRecipientEmail(m.profile?.email ?? "");
    setMemberPickerOpen(false);
  };

  const onLinkRoleProgram = (id: string) => {
    setLinkedRoleProgramId(id);
    if (id !== "none") {
      const role = rolePrograms.find((r) => r.id === id);
      if (role && !programName.trim()) setProgramName(role.name);
    }
  };
  const onLinkBank = (id: string) => {
    setLinkedBankId(id);
    if (id !== "none") {
      const b = gcaBanks.find((x) => x.id === id);
      if (b && !programName.trim()) setProgramName(b.title);
    }
  };

  const handleIssue = async () => {
    if (!recipientName || !recipientEmail || !programName) {
      toast({ title: "Missing fields", description: "Pick a recipient and program name first.", variant: "destructive" });
      return;
    }
    try {
      const res = await issueCertificate({
        program,
        vertical: program === "OAP" ? vertical : undefined,
        recipientName,
        recipientEmail,
        programName,
        organizationId: orgId,
        rolePragramId: linkedRoleProgramId !== "none" ? linkedRoleProgramId : null,
        bankId: linkedBankId !== "none" ? linkedBankId : null,
        items: items.map((it) => ({
          item_type: it.type as any,
          display_label: it.label,
        })),
      });
      setIssuedCertId(res.certId);
      toast({ title: "Certificate issued", description: `${res.certId} sent to ${recipientEmail}` });
    } catch (e) {
      toast({
        title: "Issue failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-2">
          <Award className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <CardTitle className="text-base">Issue certificate</CardTitle>
            <CardDescription>
              Generate a portable, publicly verifiable certificate for an operator.
              Pick from your org members, link a role program or test bank, then preview
              before issuing.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Program</Label>
            <Select value={program} onValueChange={(v) => setProgram(v as CertificateProgram)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="OAP">OAP — Operator Acceptance</SelectItem>
                <SelectItem value="GCA">GCA — G-Code Academy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {program === "OAP" && (
            <div className="space-y-1">
              <Label className="text-xs">Vertical</Label>
              <Select value={vertical} onValueChange={(v) => setVertical(v as OapVertical)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VERTICALS.map((v) => (
                    <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {program === "OAP" && (
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Link role program (optional)</Label>
              <Select value={linkedRoleProgramId} onValueChange={onLinkRoleProgram}>
                <SelectTrigger><SelectValue placeholder="Choose a role program…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {rolePrograms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Selecting a role program auto-fills the program name and listed items
                (machines, tools, operations, courses).
              </p>
            </div>
          )}

          {program === "GCA" && (
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Link question bank (optional)</Label>
              <Select value={linkedBankId} onValueChange={onLinkBank}>
                <SelectTrigger><SelectValue placeholder="Choose a question bank…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {gcaBanks.filter((b) => b.is_published).map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Program / role name (shown on certificate)</Label>
            <Input value={programName} onChange={(e) => setProgramName(e.target.value)} placeholder="e.g. CNC Lathe Operator" />
          </div>

          {/* Recipient picker */}
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Recipient</Label>
            <Popover open={memberPickerOpen} onOpenChange={setMemberPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal" type="button">
                  <User className="w-3.5 h-3.5 mr-2" />
                  {recipientName || "Pick from org members or type below"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(95vw,28rem)] p-0" align="start">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-muted-foreground" />
                    <Input
                      autoFocus
                      value={memberQuery}
                      onChange={(e) => setMemberQuery(e.target.value)}
                      placeholder="Search by name or email…"
                      className="pl-8 h-8"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-auto">
                  {filteredMembers.length === 0 && (
                    <p className="text-xs text-muted-foreground p-3 text-center">
                      No members match "{memberQuery}".
                    </p>
                  )}
                  {filteredMembers.map((m) => (
                    <button
                      key={m.user_id}
                      type="button"
                      onClick={() => pickMember(m)}
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b"
                    >
                      <div className="font-medium truncate">{m.profile?.display_name ?? "(no name)"}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{m.profile?.email}</div>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Recipient name</Label>
            <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Recipient email</Label>
            <Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPreviewOpen((v) => !v)}
            className="sm:w-auto"
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewOpen ? "Hide preview" : "Preview certificate"}
          </Button>
          <Button onClick={handleIssue} disabled={issuing} className="flex-1">
            {issuing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Award className="w-4 h-4 mr-2" />}
            Issue {program} certificate
          </Button>
        </div>

        {previewOpen && (
          <div className="border rounded-md overflow-auto bg-muted/20 p-3">
            <div className="mx-auto" style={{ width: 816 * 0.5, height: 1056 * 0.5 }}>
              <div style={{ transform: "scale(0.5)", transformOrigin: "top left", width: 816, height: 1056 }}>
                <CertPreview cert={previewCert} variant="diploma" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              Live preview — actual certificate uses the issued cert ID + verification QR code.
            </p>
          </div>
        )}

        {issuedCertId && (
          <div className="p-3 rounded-md border bg-muted/30 text-sm flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Issued</div>
              <div className="font-mono font-semibold">{issuedCertId}</div>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to={`/verify/${issuedCertId}`} target="_blank">
                View <ExternalLink className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
