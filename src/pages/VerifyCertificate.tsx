import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, ShieldX, ArrowRight, Loader2, Printer } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useCertificates } from "@/hooks/useCertificates";
import { CertificateTemplate } from "@/components/certificates/CertificateTemplate";
import type { CertificateRecord } from "@/lib/certificates";

/**
 * Public certificate verification page — shared by OAP and GCA.
 * No auth required; RLS allows public SELECT on cert tables.
 */
export default function VerifyCertificate() {
  const { certId } = useParams<{ certId: string }>();
  const { lookupCertificate } = useCertificates();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<CertificateRecord | null>(null);

  useEffect(() => {
    if (!certId) return;
    setLoading(true);
    lookupCertificate(certId).then((c) => {
      setCert(c);
      setLoading(false);
    });
  }, [certId, lookupCertificate]);

  const status: "valid" | "expired" | "revoked" | "unknown" = !cert
    ? "unknown"
    : cert.status === "revoked"
    ? "revoked"
    : cert.validUntil && new Date(cert.validUntil) < new Date()
    ? "expired"
    : "valid";

  const StatusIcon =
    status === "valid" ? ShieldCheck : status === "expired" ? ShieldAlert : ShieldX;

  const statusColor =
    status === "valid"
      ? "text-emerald-600"
      : status === "expired"
      ? "text-amber-600"
      : status === "revoked"
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`Verify Certificate ${certId ?? ""} — JobLine`}
        description="Public certificate verification for the JobLine Operator Acceptance Program and G-Code Academy."
        canonical={`/verify/${certId ?? ""}`}
      />

      <div className="container mx-auto px-4 py-12 max-w-3xl print:py-0 print:max-w-none">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground print:hidden">
          <Link to="/" className="hover:text-foreground">JobLine</Link>
          <ArrowRight className="w-3 h-3" />
          <span>Certificate Verification</span>
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

            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {cert && (
                <Button size="sm" onClick={() => window.print()}>
                  <Printer className="w-3.5 h-3.5 mr-1.5" /> Print certificate
                </Button>
              )}
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
          <div className="mt-8 flex justify-center print:mt-0">
            <CertificateTemplate cert={cert} printMode />
          </div>
        )}

        <p className="text-[11px] text-muted-foreground text-center mt-4 print:hidden">
          Certificates issued through the JobLine Operator Acceptance Program and
          G-Code Academy are portable and may be presented to any employer.
        </p>
      </div>
    </div>
  );
}
