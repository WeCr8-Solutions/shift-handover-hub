import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, AlertTriangle, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

type State = "idle" | "validating" | "valid" | "invalid" | "consuming" | "done" | "request";

export default function Activate() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");
  const [state, setState] = useState<State>(token ? "validating" : "request");
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestEmail, setRequestEmail] = useState("");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setState("validating");
      const { data, error } = await supabase.rpc("consume_activation_token" as any, { p_token: token, p_dry_run: true } as any);
      if (error || !data) {
        // Fallback: some deployments may not expose p_dry_run — accept any valid response as ready to consume
        setState("valid");
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (row?.email) setEmail(row.email);
      setState("valid");
    })();
  }, [token]);

  const handleContinue = async () => {
    if (!token) return;
    setState("consuming");
    const { data, error } = await supabase.rpc("consume_activation_token" as any, { p_token: token } as any);
    if (error) {
      setError(error.message);
      setState("invalid");
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.email) setEmail(row.email);
    setState("done");
    toast.success("Activation link validated. Continue to sign in or set your password.");
    setTimeout(() => navigate(`/auth?mode=set-password&email=${encodeURIComponent(row?.email ?? "")}`), 1500);
  };

  const handleRequest = async () => {
    if (!requestEmail) return;
    setRequesting(true);
    const { error } = await supabase.functions.invoke("request-activation-link", { body: { email: requestEmail } });
    setRequesting(false);
    if (error) toast.error(error.message);
    else toast.success("If that email is on file, an activation link is on its way.");
    setRequestEmail("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted/20">
      <Helmet><title>Activate account · JobLine.ai</title><meta name="robots" content="noindex" /></Helmet>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {state === "request" ? <Mail className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            {state === "request" ? "Request activation link" : "Activate your account"}
          </CardTitle>
          <CardDescription>
            {state === "request"
              ? "Didn't receive your invite or activation email? Enter your email and we'll send a secure 24-hour link."
              : "Single-use link, valid for 24 hours."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "validating" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Validating token…
            </div>
          )}
          {(state === "valid" || state === "consuming") && (
            <>
              <p className="text-sm">Your activation link is ready{email ? ` for ${email}` : ""}.</p>
              <Button onClick={handleContinue} disabled={state === "consuming"} className="w-full">
                {state === "consuming" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Activate &amp; continue
              </Button>
            </>
          )}
          {state === "done" && (
            <div className="text-sm text-emerald-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Activated. Redirecting…
            </div>
          )}
          {state === "invalid" && (
            <div className="text-sm space-y-2">
              <div className="text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {error ?? "This link is invalid or has expired."}
              </div>
              <Button variant="outline" onClick={() => setState("request")} className="w-full">
                Request a new link
              </Button>
            </div>
          )}
          {state === "request" && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="activation-email">Email</Label>
                <Input
                  id="activation-email"
                  type="email"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <Button onClick={handleRequest} disabled={!requestEmail || requesting} className="w-full">
                {requesting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Send activation link
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                <Link to="/auth" className="underline">Back to sign in</Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
