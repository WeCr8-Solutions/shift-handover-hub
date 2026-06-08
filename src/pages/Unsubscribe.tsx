import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, MailX } from "lucide-react";

type State =
  | { kind: "validating" }
  | { kind: "ready" }
  | { kind: "already" }
  | { kind: "invalid"; reason: string }
  | { kind: "submitting" }
  | { kind: "done" }
  | { kind: "error"; reason: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>({ kind: "validating" });

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setState({ kind: "invalid", reason: "Missing unsubscribe token." });
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } },
        );
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && json.valid === true) setState({ kind: "ready" });
        else if (res.ok && json.valid === false) setState({ kind: "already" });
        else setState({ kind: "invalid", reason: json.error ?? "Invalid or expired link." });
      } catch (e) {
        if (!cancelled) setState({ kind: "error", reason: e instanceof Error ? e.message : "Network error" });
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const confirm = async () => {
    setState({ kind: "submitting" });
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    if (error) return setState({ kind: "error", reason: error.message });
    if ((data as any)?.success) setState({ kind: "done" });
    else if ((data as any)?.reason === "already_unsubscribed") setState({ kind: "already" });
    else setState({ kind: "error", reason: "Could not process unsubscribe." });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MailX className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
          <CardTitle>Unsubscribe from Jobline.ai emails</CardTitle>
          <CardDescription>Stop receiving non-essential emails at this address.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {state.kind === "validating" && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Checking link…
            </div>
          )}
          {state.kind === "ready" && (
            <>
              <p className="text-sm text-muted-foreground">Click the button below to confirm.</p>
              <Button onClick={confirm} className="w-full">Confirm unsubscribe</Button>
            </>
          )}
          {state.kind === "submitting" && (
            <Button disabled className="w-full"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</Button>
          )}
          {state.kind === "done" && (
            <div className="space-y-2">
              <CheckCircle2 className="mx-auto h-8 w-8 text-green-600" aria-hidden />
              <p className="text-sm">You're unsubscribed. We won't send you non-essential emails.</p>
            </div>
          )}
          {state.kind === "already" && (
            <div className="space-y-2">
              <CheckCircle2 className="mx-auto h-8 w-8 text-green-600" aria-hidden />
              <p className="text-sm">This address is already unsubscribed.</p>
            </div>
          )}
          {(state.kind === "invalid" || state.kind === "error") && (
            <div className="space-y-2">
              <XCircle className="mx-auto h-8 w-8 text-destructive" aria-hidden />
              <p className="text-sm">{state.reason}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
