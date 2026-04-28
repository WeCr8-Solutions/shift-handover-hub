import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CertificateProgram } from "@/lib/certificates";

interface BuyCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: CertificateProgram;
  /** Optional pre-filled program name (e.g. "Lathe Fundamentals"). */
  defaultProgramName?: string;
  /** Optional pre-filled recipient name. Used for upgrade flow. */
  defaultRecipientName?: string;
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
  upgradeCertId,
}: BuyCertificateDialogProps) {
  const [name, setName] = useState(defaultRecipientName ?? "");
  const [email, setEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [programName, setProgramName] = useState(defaultProgramName ?? "");
  const [loading, setLoading] = useState(false);

  const isUpgrade = !!upgradeCertId;
  const programLabel = program === "OAP" ? "Operator Acceptance Program" : "G-Code Academy";

  async function handleCheckout() {
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name and email");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-cert-checkout", {
        body: {
          program,
          recipientName: name.trim(),
          recipientEmail: email.trim(),
          programName: programName.trim() || undefined,
          organizationName: organizationName.trim() || null,
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
          <DialogTitle>Get your {program} certificate — $12</DialogTitle>
          <DialogDescription>
            Branded, verifiable certificate for the {programLabel}. Includes unique cert ID,
            QR verification, and a public verification URL.
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
            <Label htmlFor="cert-email">Email (cert + receipt sent here)</Label>
            <Input
              id="cert-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
            />
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
            {[
              "Unique cert ID (e.g. " + program + "-XXXXXX-2026)",
              "Public verification at jobline.ai/verify/your-id",
              "Print, share, attach to LinkedIn or résumé",
              "Secure checkout via Stripe — no account required",
            ].map((line) => (
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
          <Button onClick={handleCheckout} disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            Pay $12 & continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
