import { useState, type ReactNode, useEffect } from "react";
import { Shield, Smartphone, CheckCircle, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useMFAEnforcement } from "@/hooks/useMFAEnforcement";

interface MFAEnrollmentGateProps {
  children: ReactNode;
}

/**
 * Wraps the application and shows an MFA TOTP enrollment screen when:
 * - The user's organization has mfa_required = true
 * - The user has not yet enrolled a verified TOTP factor
 *
 * This gate is blocking — users cannot access org data until they
 * complete MFA enrollment.
 */
export function MFAEnrollmentGate({ children }: MFAEnrollmentGateProps) {
  const { mfaBlockingAccess, mfaCheckComplete } = useMFAEnforcement();

  const [step, setStep] = useState<"intro" | "enroll" | "verify" | "done">("intro");
  const [factorId, setFactorId] = useState<string>("");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!mfaBlockingAccess) {
      setStep("done");
    }
  }, [mfaBlockingAccess]);

  if (!mfaCheckComplete) return null;
  if (!mfaBlockingAccess || step === "done") return <>{children}</>;

  const handleStartEnrollment = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (error) throw error;

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep("enroll");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start MFA enrollment");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    if (!factorId) {
      setError("Enrollment session is missing. Please restart MFA enrollment.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const challengeResult = await supabase.auth.mfa.challenge({ factorId });
      if (challengeResult.error) throw challengeResult.error;

      const verifyResult = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeResult.data.id,
        code: verifyCode,
      });
      if (verifyResult.error) throw verifyResult.error;

      setStep("done");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copySecret = async () => {
    if (!secret) return;

    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy secret key.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="mb-2 flex items-center gap-3">
          <div className="rounded-full bg-blue-500/10 p-2">
            <Shield className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Multi-Factor Authentication Required</h1>
            <p className="text-sm text-muted-foreground">
              Your organization requires MFA to protect access to controlled data.
            </p>
          </div>
        </div>

        {step === "intro" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="h-4 w-4" />
                Set Up Authenticator App
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                You need to enroll a TOTP authenticator app before you can access this organization's data. This is a
                one-time setup.
              </p>
              <p>
                Compatible apps: <strong>Google Authenticator</strong>, Authy, 1Password, Bitwarden.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={handleStartEnrollment} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Start MFA Enrollment"
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === "enroll" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scan QR Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Open your authenticator app and scan this QR code, or enter the secret key manually.
              </p>

              {qrCode && (
                <div className="flex justify-center">
                  <img src={qrCode} alt="MFA QR Code" className="h-48 w-48 rounded border" />
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Manual entry key</Label>
                <div className="flex gap-2">
                  <Input value={secret} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="sm" onClick={copySecret}>
                    {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={() => setStep("verify")} className="w-full">
                I&apos;ve scanned the code — Next
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "verify" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enter Verification Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app to complete enrollment.
              </p>

              <div className="space-y-1">
                <Label>6-digit code</Label>
                <Input
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center font-mono text-2xl tracking-widest"
                  maxLength={6}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void handleVerify();
                    }
                  }}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("enroll")} disabled={loading}>
                Back
              </Button>
              <Button onClick={handleVerify} disabled={loading || verifyCode.length !== 6} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Complete Enrollment"
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {error && step === "intro" && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
