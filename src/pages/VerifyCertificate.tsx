import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, ShieldX, ArrowRight, ArrowLeft, Loader2, Printer, ScrollText, LayoutGrid, Lock } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useCertificates } from "@/hooks/useCertificates";
import { CertificateTemplate, type CertificateVariant } from "@/components/certificates/CertificateTemplate";
import { CertificateViewer } from "@/components/certificates/CertificateViewer";
import { CertificatePdfDownloadButton } from "@/components/certificates/CertificatePdfDownloadButton";
import { BuyCertificateDialog } from "@/components/certificates/BuyCertificateDialog";
import type { CertificateRecord } from "@/lib/certificates";
import { AdPlacement } from "@/components/marketing/AdPlacement";

/**
 * Public certificate verification page — shared by OAP and GCA.
 * No auth required; RLS allows public SELECT on cert tables.
 */
export default function VerifyCertificate() {
  const { certId } = useParams<{ certId: string }>();
  const [searchParams] = useSearchParams();
  const { lookupCertificate } = useCertificates();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<CertificateRecord | null>(null);
  const [variant, setVariant] = useState<CertificateVariant>("diploma");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const isPaid = cert?.isPaid === true;

  const inferredProgram = certId?.startsWith("OAP-") ? "OAP" : certId?.startsWith("GCA-") ? "GCA" : null;
  const program = cert?.program ?? inferredProgram;
  const programLabel = program === "OAP" ? "Operator Acceptance Program" : program === "GCA" ? "G-Code Academy" : "Certificate";
  const lookupRoute = program === "OAP" ? "/oap/certificates/verify" : program === "GCA" ? "/gcode-academy/certificates/verify" : "/verify";
  const landingRoute = program === "OAP" ? "/oap" : program === "GCA" ? "/gcode-academy" : "/";
  const learningRoute = program === "OAP" ? "/oap/app" : program === "GCA" ? "/gcode-academy/app" : "/";

  useEffect(() => {
    if (!certId) return;
    setLoading(true);
    lookupCertificate(certId).then((c) => {
      setCert(c);
      setLoading(false);
    });
  }, [certId, lookupCertificate]);

  const status: "valid" | "expired" | "revoked" | "suspended" | "unknown" = !cert
    ? "unknown"
    : (cert.effectiveStatus ?? (cert.status === "revoked" ? "revoked" : "valid"));

  const StatusIcon =
    status === "valid" ? ShieldCheck : status === "expired" ? ShieldAlert : ShieldX;

  const statusColor =
    status === "valid"
      ? "text-emerald-600"
      : status === "expired"
      ? "text-amber-600"
      : status === "revoked" || status === "suspended"
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`Verify Certificate ${certId ?? ""} — JobLine`}
        description="Public certificate verification for the JobLine Operator Acceptance Program and G-Code Academy."
        canonical={`/verify/${certId ?? ""}`}
        noindex
      />

      <div className="container mx-auto px-4 py-12 max-w-3xl print:py-0 print:max-w-none">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground print:hidden">
          <Link to="/" className="hover:text-foreground">JobLine</Link>
          <ArrowRight className="w-3 h-3" />
          {program && (
            <>
              <Link to={landingRoute} className="hover:text-foreground">{programLabel}</Link>
              <ArrowRight className="w-3 h-3" />
              <Link to={lookupRoute} className="hover:text-foreground">Verify</Link>
              <ArrowRight className="w-3 h-3" />
            </>
          )}
          <span>Certificate Verification</span>
        </div>

        {(() => {
          const backParam = searchParams.get("back");
          const safeBack = backParam && backParam.startsWith("/") && !backParam.startsWith("//") ? backParam : null;
          const profileBack = cert?.recipientUsername ? `/talent/${cert.recipientUsername}` : null;
          const backHref = safeBack ?? profileBack;
          const backLabel = safeBack?.startsWith("/talent/")
            ? `Back to @${safeBack.split("/talent/")[1]?.split(/[?#]/)[0]}`
            : profileBack
            ? `Back to @${cert?.recipientUsername}`
            : null;
          return backHref && backLabel ? (
            <div className="mb-3 print:hidden">
              <Button asChild variant="ghost" size="sm" className="-ml-2">
                <Link to={backHref}>
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> {backLabel}
                </Link>
              </Button>
            </div>
          ) : null;
        })()}

        <div className="mb-4 flex flex-wrap gap-2 print:hidden">
          <Button asChild variant="outline" size="sm">
            <Link to={lookupRoute}>Verify another certificate</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={landingRoute}>Back to {program === "OAP" ? "OAP" : program === "GCA" ? "GCA" : "program"}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={learningRoute}>Open learning page</Link>
          </Button>
        </div>

        <Card className="print:hidden">
          <CardHeader>
            <div className="flex items-start gap-3">
              <StatusIcon className={`w-10 h-10 ${statusColor}`} />
              <div className="flex-1">
                <CardTitle className="text-lg">
                  {loading ? "Looking up certificate…" : cert ? "Certificate verified" : "Certificate not found"}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Cert ID: <code className="font-mono text-foreground">{certId}</code>
                </p>
              </div>
              <Badge variant={status === "valid" ? "default" : "secondary"} className="uppercase">
                {loading ? "checking" : status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying with the registry…
              </div>
            )}

            {!loading && !cert && (
              <div className="p-4 rounded-md bg-muted/50 border text-sm">
                <p className="font-medium mb-1">No certificate found for this ID</p>
                <p className="text-xs text-muted-foreground">
                  If a holder presented this code to you, please reach out to{" "}
                  <a href="mailto:hello@jobline.ai" className="text-primary hover:underline">
                    hello@jobline.ai
                  </a>{" "}
                  with the cert ID and we'll confirm authenticity.
                </p>
              </div>
            )}

            {cert && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Recipient</p>
                  <p className="font-medium">{cert.recipientName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Program</p>
                  <p className="font-medium">{cert.programName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Issued</p>
                  <p className="font-medium">{new Date(cert.issuedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expires</p>
                  <p className="font-medium">
                    {cert.validUntil ? new Date(cert.validUntil).toLocaleDateString() : "Lifetime"}
                  </p>
                </div>
              </div>
            )}

            {cert && (status === "revoked" || status === "suspended") && (
              <div className="p-3 rounded-md border border-destructive/40 bg-destructive/10 text-sm">
                <p className="font-medium text-destructive">
                  This certificate is {status}.
                </p>
                {cert.revokedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Recorded {new Date(cert.revokedAt).toLocaleDateString()}
                    {cert.revokedReason ? ` — ${cert.revokedReason}` : ""}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Do not accept this credential as proof of qualification.
                </p>
              </div>
            )}

            {cert && status === "expired" && (
              <div className="p-3 rounded-md border border-amber-500/40 bg-amber-500/10 text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  This certificate has expired.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  The recipient must complete recertification to restore validity.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              {cert && (
                <>
                  {isPaid ? (
                    <>
                      <Button size="sm" onClick={() => window.print()}>
                        <Printer className="w-3.5 h-3.5 mr-1.5" /> Print certificate
                      </Button>
                      <CertificatePdfDownloadButton
                        targetElementId="cert-print-target"
                        fileName={`${cert.certId}-${variant}.pdf`}
                        variantLabel={variant === "diploma" ? "Diploma" : "Digital"}
                      />
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setUpgradeOpen(true)}
                      className="gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Unlock PDF & Print — $12
                    </Button>
                  )}
                  <div className="inline-flex rounded-md border bg-muted/40 p-0.5">
                    <Button
                      size="sm"
                      variant={variant === "diploma" ? "default" : "ghost"}
                      onClick={() => setVariant("diploma")}
                      className="h-7 px-2.5 text-xs"
                    >
                      <ScrollText className="w-3.5 h-3.5 mr-1" /> Diploma
                    </Button>
                    <Button
                      size="sm"
                      variant={variant === "digital" ? "default" : "ghost"}
                      onClick={() => setVariant("digital")}
                      className="h-7 px-2.5 text-xs"
                    >
                      <LayoutGrid className="w-3.5 h-3.5 mr-1" /> Digital
                    </Button>
                  </div>
                </>
              )}
              <Button asChild variant="outline" size="sm">
                <Link to="/oap/certificates/verify">OAP verification</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/gcode-academy/certificates/verify">GCA verification</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/oap">About OAP</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/gcode-academy">About G-Code Academy</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {cert && (
          <div className="mt-8 print:mt-0">
            {/* Paid certs: full printable diploma. Unpaid: stub so Cmd+P
                can't bypass the paywall — only a "this is digital-only" notice prints. */}
            <div className="hidden print:block">
              {isPaid ? (
                <CertificateTemplate cert={cert} variant="diploma" printMode />
              ) : (
                <div style={{ padding: "48px", fontFamily: "system-ui", textAlign: "center" }}>
                  <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>Digital certificate</h1>
                  <p>This certificate is verified at <strong>jobline.ai/verify/{cert.certId}</strong>.</p>
                  <p style={{ marginTop: "16px", color: "#666" }}>
                    Unlock printable PDF and Print for $12 at the verification page.
                  </p>
                </div>
              )}
            </div>
            <div className="print:hidden">
              <CertificateViewer cert={cert} variant={variant} printTargetId="cert-print-target" />
            </div>
          </div>
        )}

        {cert && (
          <BuyCertificateDialog
            open={upgradeOpen}
            onOpenChange={setUpgradeOpen}
            program={cert.program}
            defaultProgramName={cert.programName}
            defaultRecipientName={cert.recipientName}
            upgradeCertId={cert.certId}
          />
        )}

        <p className="text-[11px] text-muted-foreground text-center mt-4 print:hidden">
          Certificates issued through the JobLine Operator Acceptance Program and
          G-Code Academy are portable and may be presented to any employer.
        </p>

        <AdPlacement
          format="horizontal"
          slot="verify-cert-footer"
          className="mt-10 print:hidden"
        />
      </div>
    </div>
  );
}
