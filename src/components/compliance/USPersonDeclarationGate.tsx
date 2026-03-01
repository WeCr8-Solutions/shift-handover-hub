import { useState, ReactNode } from "react";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useUSPersonDeclaration,
  US_PERSON_DECLARATION_TEXT,
} from "@/hooks/useUSPersonDeclaration";

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
  const {
    declarationBlockingAccess,
    checkComplete,
    submitDeclaration,
  } = useUSPersonDeclaration();

  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!checkComplete) return null; // wait for check to resolve
  if (!declarationBlockingAccess) return <>{children}</>;
  if (submitted) return <>{children}</>;

  const handleSubmit = async () => {
    if (!acknowledged) return;
    setSubmitting(true);
    setError(null);
    const result = await submitDeclaration();
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-full bg-amber-500/10">
            <Shield className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Export Control Certification Required</h1>
            <p className="text-sm text-muted-foreground">
              Your organization requires this certification before you can access data.
            </p>
          </div>
        </div>

        {/* ITAR notice */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This system may be used to process information subject to the{" "}
            <strong>International Traffic in Arms Regulations (ITAR)</strong>. Access
            is restricted to US Persons and those with applicable export authorization.
          </AlertDescription>
        </Alert>

        {/* Declaration card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">US Person Self-Certification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground max-h-40 overflow-y-auto">
              {US_PERSON_DECLARATION_TEXT}
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="us-person-ack"
                checked={acknowledged}
                onCheckedChange={(v) => setAcknowledged(v === true)}
                disabled={submitting}
              />
              <label
                htmlFor="us-person-ack"
                className="text-sm leading-tight cursor-pointer select-none"
              >
                I have read, understand, and agree to the above certification. I
                acknowledge that this certification is made under penalty of law.
              </label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Your IP address and timestamp will be recorded with this certification.
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!acknowledged || submitting}
              className="ml-4"
            >
              {submitting ? (
                "Submitting…"
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Certification
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <p className="text-xs text-center text-muted-foreground px-4">
          This is a self-certification for compliance record-keeping. It does not
          constitute legal advice. Contact your organization's export control
          officer with questions about ITAR applicability.
        </p>
      </div>
    </div>
  );
}
