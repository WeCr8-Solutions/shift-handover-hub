/**
 * DelegateSetupCard — lets the account owner invite a supervisor (or any
 * designated person) by email to finish the post-claim setup with admin
 * permissions. The invite is logged in `concierge_activity_log` for QA.
 *
 * Owner-only. Renders nothing for non-owners.
 */
import { useState } from "react";
import { UserPlus, Copy, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

export function DelegateSetupCard() {
  const { organization, organizationRole } = useOrganization();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [sending, setSending] = useState(false);
  const [issued, setIssued] = useState<{ url: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!organization || organizationRole !== "owner") return null;

  const handleInvite = async () => {
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.rpc("invite_setup_delegate" as any, {
        p_organization_id: organization.id,
        p_email: email.trim(),
        p_full_name: fullName.trim() || null,
      } as any);
      if (error) throw error;
      const res = data as any;
      if (!res?.ok) throw new Error(res?.error ?? "Failed to send invite");
      setIssued({ url: res.claim_url, email: res.invited_email });
      toast.success("Delegate invited", {
        description: `${res.invited_email} can now finish setup as admin.`,
      });
      setEmail("");
      setFullName("");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to invite delegate");
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async () => {
    if (!issued) return;
    await navigator.clipboard.writeText(issued.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 text-primary p-2.5">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Delegate setup to a supervisor</CardTitle>
            <CardDescription>
              Don't have time to finish setup yourself? Invite a supervisor or designated
              admin to complete the remaining steps, the concierge review, and start
              work-order operations on your behalf. Every action they take is logged.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {issued ? (
          <div className="rounded-md border bg-emerald-50 dark:bg-emerald-950/30 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
              <Check className="w-4 h-4" /> Invite sent to {issued.email}
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Share this backup link in case the email is missed (expires in 15 days,
              single use):
            </p>
            <div className="flex gap-2">
              <Input readOnly value={issued.url} className="text-xs font-mono" />
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIssued(null)}
              className="text-xs"
            >
              Invite another person
            </Button>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="delegate-name" className="text-xs">
                  Full name (optional)
                </Label>
                <Input
                  id="delegate-name"
                  placeholder="Jane Supervisor"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={sending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="delegate-email" className="text-xs">
                  Work email
                </Label>
                <Input
                  id="delegate-email"
                  type="email"
                  placeholder="supervisor@yourshop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={sending}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                They'll join as <span className="font-medium">Admin</span> so they can
                finish setup, sign concierge documents, and unlock operations.
              </p>
              <Button onClick={handleInvite} disabled={sending || !email}>
                {sending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Send delegate invite
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
