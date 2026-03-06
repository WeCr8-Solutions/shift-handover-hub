import { useState, type ReactNode } from "react";
import { Shield, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUSPersonDeclaration, US_PERSON_DECLARATION_TEXT } from "@/hooks/useUSPersonDeclaration";

interface USPersonDeclarationGateProps {
  children: ReactNode;
}

/**
 * Wraps the application and shows a US Person self-certification screen
 * when the user's organization has requires_us_person_declaration = true
 * and the user has not yet completed the certification.
 *
 * This gate is intentionally blocking — users cannot access org data until
 * they complete the declaration.
 */
export function USPersonDeclarationGate({ children }: USPersonDeclarationGateProps) {
  const { declarationBlockingAccess, checkComplete, submitDeclaration } = useUSPersonDeclaration();

  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!checkComplete) return null;
  if (!declarationBlockingAccess) return <>{children}</>;
  if (submitted) return <>{children}</>;

  const handleSubmit = async () => {
    if (!acknowledged || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await submitDeclaration();

      if (result?.error) {
        setError(result.error);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit certification");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-4">
        <div className="mb-2 flex items-center gap-3">
          <div className="rounded-full bg-amber-500/10 p-2">
            <Shield className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Export Control Certification Required</h1>
            <p className="text-sm text-muted-foreground">
              Your organization requires this certification before you can access data.
            </p>
          </div>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This system may be used to process information subject to the{" "}
            <strong>International Traffic in Arms Regulations (ITAR)</strong>. Access is restricted to US Persons and
            those with applicable export authorization.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">US Person Self-Certification</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="max-h-40 overflow-y-auto rounded-md border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
              {US_PERSON_DECLARATION_TEXT}
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="us-person-ack"
                checked={acknowledged}
                onCheckedChange={(v) => setAcknowledged(v === true)}
                disabled={submitting}
              />
              <label htmlFor="us-person-ack" className="cursor-pointer select-none text-sm leading-tight">
                I have read, understand, and agree to the above certification. I acknowledge that this certification is
                made under penalty of law.
              </label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Your IP address and timestamp will be recorded with this certification.
            </p>

            <Button onClick={handleSubmit} disabled={!acknowledged || submitting} className="ml-4">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit Certification
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <p className="px-4 text-center text-xs text-muted-foreground">
          This is a self-certification for compliance record-keeping. It does not constitute legal advice. Contact your
          organization&apos;s export control officer with questions about ITAR applicability.
        </p>
      </div>
    </div>
  );
}
