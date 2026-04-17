import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, UserPlus, CheckCircle2 } from "lucide-react";
import { useOrganizationInvites } from "@/hooks/useOrganizationInvites";
import { useTeams } from "@/hooks/useTeams";
import { useOrgContext } from "@/contexts/OrgContext";
import { useToast } from "@/hooks/use-toast";

interface OnboardCandidateDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  candidateUserId: string;
  candidateName?: string | null;
  candidateEmail?: string | null;
}

/**
 * Onboard a Talent candidate into the employer's org.
 * Generates a single-use, email-bound invite (optionally team-scoped).
 * Once redeemed, the operator's existing global profile/certs become
 * visible to org members via standard RLS — no manual import needed.
 */
export function OnboardCandidateDialog({
  open,
  onOpenChange,
  candidateUserId,
  candidateName,
  candidateEmail,
}: OnboardCandidateDialogProps) {
  const { organization } = useOrgContext();
  const { teams } = useTeams();
  const { createInvite } = useOrganizationInvites(organization?.id ?? null);
  const { toast } = useToast();

  const [teamId, setTeamId] = useState<string>("none");
  const [orgRole, setOrgRole] = useState<"member" | "admin">("member");
  const [appRole, setAppRole] = useState<"operator" | "supervisor" | "viewer">("operator");
  const [email, setEmail] = useState(candidateEmail ?? "");
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const inviteUrl = generatedCode
    ? `${window.location.origin}/join?code=${generatedCode}`
    : null;

  const handleGenerate = async () => {
    setGenerating(true);
    const { data, error } = await createInvite({
      teamId: teamId !== "none" ? teamId : undefined,
      orgRole,
      appRole,
      expiresInDays: 15,
      maxUses: 1,
      invitedEmail: email.trim() || undefined,
    });
    setGenerating(false);
    if (error || !data) {
      toast({ title: "Could not create invite", description: error?.message ?? "Unknown error", variant: "destructive" });
      return;
    }
    setGeneratedCode(data.invite_code);
    toast({ title: "Invite ready", description: "Share the link or code with the candidate." });
  };

  const copyLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    toast({ title: "Link copied" });
  };

  const reset = () => {
    setGeneratedCode(null);
    setTeamId("none");
    setOrgRole("member");
    setAppRole("operator");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Onboard {candidateName ?? "candidate"}
          </DialogTitle>
          <DialogDescription>
            Generate a single-use invite. When the operator redeems it, their
            verified OAP/GCA credentials and resume profile auto-import into
            your team's roster.
          </DialogDescription>
        </DialogHeader>

        {!generatedCode ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Candidate email (optional, locks invite to this address)</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Assign to team</Label>
                <Select value={teamId} onValueChange={setTeamId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No team (org only)</SelectItem>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">App role</Label>
                <Select value={appRole} onValueChange={(v) => setAppRole(v as typeof appRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Org role</Label>
                <Select value={orgRole} onValueChange={(v) => setOrgRole(v as typeof orgRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Invite expires in 15 days. Single use. Existing operator profile,
              skills, and verified certifications carry over automatically — no
              proprietary employer data is shared.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="w-4 h-4" /> Invite generated
            </div>
            <div>
              <Label className="text-xs">Invite link</Label>
              <div className="flex gap-2">
                <Input readOnly value={inviteUrl ?? ""} />
                <Button size="icon" variant="outline" onClick={copyLink}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Code</Label>
              <Input readOnly value={generatedCode} className="font-mono" />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Once they join, you'll see them in your team roster and their
              transferable credentials in the OAP employer console. Candidate
              ID: <code>{candidateUserId.slice(0, 8)}…</code>
            </p>
          </div>
        )}

        <DialogFooter>
          {!generatedCode ? (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? "Generating…" : "Generate invite"}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
