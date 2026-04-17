import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, ShieldX, ArrowRight } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

/**
 * Public certificate verification page — shared by OAP and GCA.
 *
 * Anyone (no auth required) can land here by scanning the QR code on a
 * printed certificate or pasting the cert ID. We look the cert up in
 * `oap_certificates` (or `gca_certificates` once they exist).
 *
 * Until the certificate tables ship in the next migration, this page
 * renders a clear "verification system coming soon" placeholder so QR
 * codes printed on early test certs don't 404.
 */
export default function VerifyCertificate() {
  const { certId } = useParams<{ certId: string }>();

  // TODO: replace with real lookup once oap_certificates / gca_certificates land
  const status: "valid" | "expired" | "revoked" | "unknown" = "unknown";

  const StatusIcon =
    status === "valid"
      ? ShieldCheck
      : status === "expired"
      ? ShieldAlert
      : ShieldX;

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
        title={`Verify Certificate ${certId ?? ""} — JobLine OAP`}
        description="Public certificate verification for the JobLine Operator Acceptance Program and G-Code Academy."
        canonical={`/verify/${certId ?? ""}`}
      />

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">JobLine</Link>
          <ArrowRight className="w-3 h-3" />
          <span>Certificate Verification</span>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <StatusIcon className={`w-10 h-10 ${statusColor}`} />
              <div className="flex-1">
                <CardTitle className="text-lg">Certificate Verification</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Cert ID:{" "}
                  <code className="font-mono text-foreground">{certId}</code>
                </p>
              </div>
              <Badge
                variant={status === "valid" ? "default" : "secondary"}
                className="uppercase"
              >
                {status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 rounded-md bg-muted/50 border text-sm">
              <p className="font-medium mb-1">Verification system coming online soon</p>
              <p className="text-xs text-muted-foreground">
                The JobLine OAP and G-Code Academy public certificate registry is
                being finalized. If a holder presented this code to you for
                hiring purposes, please reach out to{" "}
                <a
                  href="mailto:hello@jobline.ai"
                  className="text-primary hover:underline"
                >
                  hello@jobline.ai
                </a>{" "}
                with the cert ID and we'll confirm authenticity manually.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Operator</p>
                <p className="font-medium">—</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Issued by</p>
                <p className="font-medium">—</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Issued</p>
                <p className="font-medium">—</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expires</p>
                <p className="font-medium">—</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Button asChild variant="outline" size="sm">
                <Link to="/oap">About OAP</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/gcode-academy">About G-Code Academy</Link>
              </Button>
              <Button asChild size="sm">
                <a href="mailto:hello@jobline.ai">Contact verification team</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-[11px] text-muted-foreground text-center mt-4">
          Certificates issued through the JobLine Operator Acceptance Program
          and G-Code Academy are portable and may be presented to any employer.
        </p>
      </div>
    </div>
  );
}
