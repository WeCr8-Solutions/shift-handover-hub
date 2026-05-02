import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ExternalLink, CheckCircle2, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { CertificateProgram } from "@/lib/certificates";

interface BuyCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: CertificateProgram;
  /** Optional pre-filled program name (e.g. "Lathe Fundamentals"). */
  defaultProgramName?: string;
  /** Optional pre-filled recipient name. Used for upgrade flow. */
  defaultRecipientName?: string;
  /** GCA bank the buyer passed — required to mint the cert post-payment. */
  bankId?: string | null;
  /** OAP role program the buyer passed — required to mint the cert post-payment. */
  roleProgramId?: string | null;
  /** When provided, this is an "upgrade to printable" purchase for an
   *  existing digital-only cert. The webhook will UPDATE that row instead
   *  of issuing a new cert; success URL routes back to /verify/:certId. */
  upgradeCertId?: string;
}

export function BuyCertificateDialog({
  open,
  onOpenChange,
  program,
  defaultProgramName,
  defaultRecipientName,
  bankId,
  roleProgramId,
  upgradeCertId,
}: BuyCertificateDialogProps) {
  const { user } = useAuth();
  const [name, setName] = useState(defaultRecipientName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [organizationName, setOrganizationName] = useState("");
  const [programName, setProgramName] = useState(defaultProgramName ?? "");
  const [loading, setLoading] = useState(false);

  // Lock recipient email to the signed-in user's email so the cert webhook
  // can validate the linked passing attempts against the same Supabase user.
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  const isUpgrade = !!upgradeCertId;
  const programLabel = program === "OAP" ? "Operator Acceptance Program" : "G-Code Academy";

  async function handleCheckout() {
    if (!user) {
      toast.error("Please sign in before purchasing a certificate.");
      return;
    }
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-cert-checkout", {
        body: {
          program,
          recipientName: name.trim(),
          recipientEmail: email.trim(),
          recipientUserId: user.id,
          programName: programName.trim() || undefined,
          organizationName: organizationName.trim() || null,
          bankId: bankId ?? null,
          roleProgramId: roleProgramId ?? null,
          upgradeCertId: upgradeCertId ?? null,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("Checkout URL missing from response");
      window.open(data.url, "_blank");
      toast.success("Opening secure checkout in a new tab…");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Checkout failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isUpgrade
              ? `Unlock printable ${program} certificate — $12`
              : `Get your ${program} certificate — $12`}
          </DialogTitle>
          <DialogDescription>
            {isUpgrade ? (
              <>
                Your digital certificate <code className="font-mono text-foreground">{upgradeCertId}</code>{" "}
                stays free to view and verify. Unlock to enable PDF download and Print on the
                {" "}{programLabel} verification page.
              </>
            ) : (
              <>
                Branded, verifiable certificate for the {programLabel}. Includes unique cert ID,
                QR verification, and a public verification URL.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cert-name">Full name (as it should appear)</Label>
            <Input
              id="cert-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Operator"
              autoComplete="name"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cert-email" className="flex items-center gap-1.5">
              Email <Lock className="w-3 h-3 text-muted-foreground" />
            </Label>
            <Input
              id="cert-email"
              type="email"
              value={email}
              readOnly
              disabled
              placeholder="Sign in to continue"
              autoComplete="email"
            />
            <p className="text-[11px] text-muted-foreground">
              Locked to your signed-in account so we can verify you passed the test before issuing the certificate.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cert-program">Certificate title</Label>
            <Input
              id="cert-program"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder={
                program === "OAP"
                  ? "CNC Operator — Floor Certified"
                  : "Lathe & Mill Fundamentals"
              }
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cert-org">Organization (optional)</Label>
            <Input
              id="cert-org"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="Precision Parts Inc."
              disabled={loading}
            />
          </div>

          <ul className="text-xs text-muted-foreground space-y-1.5 pt-2 border-t border-border">
            {(isUpgrade
              ? [
                  "PDF download (Diploma + Digital variants) at any time",
                  "Print directly from the verification page",
                  "Same cert ID — your existing share links keep working",
                  "Secure checkout via Stripe — no account required",
                ]
              : [
                  "Unique cert ID (e.g. " + program + "-XXXXXX-2026)",
                  "Public verification at jobline.ai/verify/your-id",
                  "Print, share, attach to LinkedIn or résumé",
                  "Secure checkout via Stripe — no account required",
                ]
            ).map((line) => (
              <li key={line} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          {!user ? (
            <Button asChild className="gap-2">
              <Link to={`/auth?redirect=${encodeURIComponent(window.location.pathname)}`}>
                Sign in to continue
              </Link>
            </Button>
          ) : (
            <Button onClick={handleCheckout} disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Pay $12 & continue
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
