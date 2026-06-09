import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldCheck, AlertTriangle, ClipboardPaste, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * /claim/account-owner — backup claim flow for org owners/admins when QR
 * invite or activation email fails. The concierge supplies the user with
 * (a) a full /activate?token=... URL or raw token, and (b) the email on file.
 * We require BOTH to match before consuming the single-use token.
 */
export default function ClaimAccountOwner() {
  const navigate = useNavigate();
  const [pasted, setPasted] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractToken = (raw: string): string | null => {
    const s = raw.trim();
    if (!s) return null;
    // Full URL
    try {
      const u = new URL(s);
      const t = u.searchParams.get("token");
      if (t) return t;
    } catch { /* not a URL */ }
    // Raw token (base64url, 32+ chars)
    if (/^[A-Za-z0-9_-]{20,}$/.test(s)) return s;
    return null;
  };

  const handleClaim = async () => {
    setError(null);
    const token = extractToken(pasted);
    if (!token) {
      setError("Paste the full activation link (or just the token) from your concierge email.");
      return;
    }
    if (!email || !/^.+@.+\..+$/.test(email)) {
      setError("Enter the email address your concierge has on file.");
      return;
    }

    setBusy(true);
    // Verify token + email match BEFORE consuming (dry-run).
    const { data, error: rpcErr } = await supabase.rpc(
      "consume_activation_token" as any,
      { p_token: token, p_dry_run: true, p_expected_email: email.trim().toLowerCase() } as any,
    );
    if (rpcErr) {
      setBusy(false);
      setError("This link is invalid, expired, or doesn't match that email. Contact your concierge for a fresh link.");
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.email && row.email.toLowerCase() !== email.trim().toLowerCase()) {
      setBusy(false);
      setError("Email doesn't match the address on file for this link.");
      return;
    }

    // Consume for real.
    const { data: consumed, error: consumeErr } = await supabase.rpc(
      "consume_activation_token" as any,
      { p_token: token } as any,
    );
    setBusy(false);
    if (consumeErr) {
      setError(consumeErr.message);
      return;
    }
    const verified = Array.isArray(consumed) ? consumed[0] : consumed;
    toast.success("Verified. Continue to set your password.");
    navigate(`/auth?mode=set-password&email=${encodeURIComponent(verified?.email ?? email)}`);
  };

  const handleRequestFresh = async () => {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setBusy(true);
    const { error: fnErr } = await supabase.functions.invoke("request-activation-link", {
      body: { email: email.trim().toLowerCase() },
    });
    setBusy(false);
    if (fnErr) toast.error(fnErr.message);
    else toast.success("If that email is on file, a fresh activation link is on its way.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted/20">
      <Helmet>
        <title>Claim account owner · JobLine.ai</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> Claim your owner account
          </CardTitle>
          <CardDescription>
            Backup flow if the QR invite or activation email didn't work. Paste the link
            your concierge sent you and confirm the email on file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="claim-link" className="flex items-center gap-2">
              <ClipboardPaste className="w-4 h-4" /> Activation link or token
            </Label>
            <Textarea
              id="claim-link"
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder="https://app.jobline.ai/activate?token=…  (or paste just the token)"
              rows={3}
              className="font-mono text-xs"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="claim-email" className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> Email on file with concierge
            </Label>
            <Input
              id="claim-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourshop.com"
              autoComplete="email"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" /> <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={handleClaim} disabled={busy} className="w-full">
              {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Verify &amp; claim account
            </Button>
            <Button onClick={handleRequestFresh} disabled={busy || !email} variant="outline" className="w-full">
              Send me a fresh link instead
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Links are single-use and expire 24 hours after concierge issues them.
            Email verification prevents stolen-link reuse.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
