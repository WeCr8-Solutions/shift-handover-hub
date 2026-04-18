import { useState, type ReactNode } from "react";
import { FileText, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRulesOfBehavior, RULES_OF_BEHAVIOR_TEXT, ROB_VERSION } from "@/hooks/useRulesOfBehavior";

interface RulesOfBehaviorGateProps {
  children: ReactNode;
}

/**
 * Wraps the application and shows a Rules of Behavior acceptance screen when:
 * - The user is authenticated
 * - The user has not yet accepted the current RoB version
 *
 * This gate is blocking — users cannot access org data until they accept.
 * Satisfies FedRAMP G-19 (PL-4, AC-8).
 */
export function RulesOfBehaviorGate({ children }: RulesOfBehaviorGateProps) {
  const { robBlockingAccess, checkComplete, acceptRob } = useRulesOfBehavior();

  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  if (!checkComplete || !robBlockingAccess || accepted) return <>{children}</>;

  const handleAccept = async () => {
    if (!acknowledged || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await acceptRob();

      if (result.error) {
        setError(result.error);
        return;
      }

      setAccepted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record acceptance");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-4">
        <div className="mb-2 flex items-center gap-3">
          <div className="rounded-full bg-blue-500/10 p-2">
            <FileText className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Rules of Behavior</h1>
            <p className="text-sm text-muted-foreground">
              You must read and accept the Rules of Behavior before accessing this system.
            </p>
          </div>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Per FedRAMP requirements (NIST 800-53 PL-4, AC-8), all users must acknowledge the{" "}
            <strong>Rules of Behavior</strong> before accessing system data. This acknowledgment is
            logged and auditable.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Rules of Behavior — Version {ROB_VERSION}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="max-h-64 overflow-y-auto rounded-md border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {RULES_OF_BEHAVIOR_TEXT}
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="rob-ack"
                checked={acknowledged}
                onCheckedChange={(v) => setAcknowledged(v === true)}
                disabled={submitting}
              />
              <label htmlFor="rob-ack" className="cursor-pointer select-none text-sm leading-tight">
                I have read, understand, and agree to comply with the Rules of Behavior. I acknowledge
                that my use of this system may be monitored and that violations may result in
                disciplinary or legal action.
              </label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter>
            <Button onClick={handleAccept} disabled={!acknowledged || submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording acceptance…
                </>
              ) : accepted ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accepted
                </>
              ) : (
                "I Accept the Rules of Behavior"
              )}
            </Button>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Your acceptance will be recorded with a timestamp in your user profile.
          Version: {ROB_VERSION}
        </p>
      </div>
    </div>
  );
}
