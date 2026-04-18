import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Printer, Check, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPublicTalentUrl } from "@/lib/talent/publicHost";

interface Props {
  username: string;
  fullName: string;
  /** Latest verified cert ID, if any — surfaces a "Verified on JobLine.ai" trust strip. */
  latestCertId?: string | null;
}

/**
 * QR + Share/Print panel for /talent/:username.
 *
 * Mirrors the certificate diploma's QR aesthetic so cert recipients land on
 * a consistent, shareable, printable career page.
 *
 * Print is wired through the document-level `@media print` rules in
 * `src/styles/print-talent.css` (imported by PublicOperatorProfile).
 */
export function PublicProfileQrCard({ username, fullName, latestCertId }: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const profileUrl = useMemo(() => getPublicTalentUrl(username), [username]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast({ title: "Profile link copied", description: profileUrl });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const onPrint = () => window.print();

  return (
    <Card className="talent-qr-card border-primary/20">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
          <div className="rounded-lg bg-background border-2 border-primary/30 p-3 shrink-0">
            <QRCodeSVG
              value={profileUrl}
              size={120}
              level="M"
              includeMargin={false}
              fgColor="hsl(var(--foreground))"
              bgColor="transparent"
            />
          </div>
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div>
              <p className="text-sm font-semibold">Share this profile</p>
              <p className="text-xs text-muted-foreground break-all">{profileUrl}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start no-print">
              <Button size="sm" variant="outline" onClick={onCopy} className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Button size="sm" variant="outline" onClick={onPrint} className="gap-2">
                <Printer className="w-4 h-4" /> Print profile
              </Button>
            </div>
            {latestCertId && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center sm:justify-start">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>
                  Verified on JobLine.ai —{" "}
                  <a
                    href={`/verify/${latestCertId}`}
                    className="text-primary hover:underline font-mono"
                  >
                    {latestCertId}
                  </a>
                </span>
              </div>
            )}
          </div>
        </div>
        {/* Print-only signature line under QR */}
        <div className="hidden print:block mt-4 pt-4 border-t text-center text-xs text-muted-foreground">
          Career profile of <strong>{fullName}</strong> · jobline.ai/talent/{username}
        </div>
      </CardContent>
    </Card>
  );
}
