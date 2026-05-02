import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, ShieldCheck, FileBadge2, GraduationCap, ArrowRight } from "lucide-react";
import { AdPlacement } from "@/components/marketing/AdPlacement";

function normalizeCertId(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export default function CertificateLookup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [certId, setCertId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isOapPage = location.pathname.startsWith("/oap/");
  const isGcaPage = location.pathname.startsWith("/gcode-academy/");
  const allowedPrefix = isOapPage ? "OAP-" : isGcaPage ? "GCA-" : null;
  const title = isOapPage
    ? "OAP Certificates & Verification"
    : isGcaPage
      ? "GCA Certificates & Verification"
      : "Certificate Verification";
  const description = isOapPage
    ? "Look up a portable OAP certificate by cert ID and jump straight to the public verification record."
    : isGcaPage
      ? "Look up a portable GCA certificate by cert ID and jump straight to the public verification record."
      : "Look up any public JobLine certificate by cert ID and jump straight to the verification record.";

  const examples = useMemo(
    () => (isOapPage ? ["OAP-MACH-000123", "OAP-AUTO-004572"] : isGcaPage ? ["GCA-000845", "GCA-001204"] : ["OAP-MACH-000123", "GCA-000845"]),
    [isGcaPage, isOapPage],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeCertId(certId);
    if (!normalized) {
      setError("Enter a certificate ID to verify.");
      return;
    }
    if (allowedPrefix && !normalized.startsWith(allowedPrefix)) {
      setError(`Certificate IDs on this page must start with ${allowedPrefix}.`);
      return;
    }
    if (!normalized.startsWith("OAP-") && !normalized.startsWith("GCA-")) {
      setError("Certificate IDs must start with OAP- or GCA-.");
      return;
    }
    setError(null);
    navigate(`/verify/${normalized}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title} | JobLine.ai</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index,follow" />
      </Helmet>
      <Header />

      <main className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">JobLine</Link>
          <ArrowRight className="w-3 h-3" />
          {isOapPage ? (
            <>
              <Link to="/oap" className="hover:text-foreground">Operator Acceptance Program</Link>
              <ArrowRight className="w-3 h-3" />
              <Link to="/oap/certificates/verify" className="hover:text-foreground">Certificates</Link>
              <ArrowRight className="w-3 h-3" />
            </>
          ) : isGcaPage ? (
            <>
              <Link to="/gcode-academy" className="hover:text-foreground">G-Code Academy</Link>
              <ArrowRight className="w-3 h-3" />
              <Link to="/gcode-academy/certificates/verify" className="hover:text-foreground">Certificates</Link>
              <ArrowRight className="w-3 h-3" />
            </>
          ) : null}
          <span>Certificate Verification</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {isOapPage ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link to="/oap">Back to OAP</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/oap/app">Open OAP app</Link>
              </Button>
            </>
          ) : isGcaPage ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link to="/gcode-academy">Back to GCA</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/gcode-academy/app">Open GCA app</Link>
              </Button>
            </>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-semibold">{title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" /> Enter certificate ID
              </CardTitle>
              <CardDescription>
                Verification is public. No sign-in is required for employers, recruiters, or operators.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-3" onSubmit={handleSubmit}>
                <Input
                  value={certId}
                  onChange={(event) => setCertId(event.target.value)}
                  placeholder={examples[0]}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <div className="flex flex-wrap gap-2">
                  {examples.map((example) => (
                    <Button key={example} type="button" size="sm" variant="outline" onClick={() => setCertId(example)}>
                      Use {example}
                    </Button>
                  ))}
                </div>
                <Button type="submit" className="gap-2">
                  Verify certificate <ArrowRight className="w-4 h-4" />
                </Button>
              </form>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileBadge2 className="w-4 h-4 text-primary" /> What verification shows
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Certificate verification shows the recipient, program, issued date, expiry or lifetime status, and whether the credential is valid, expired, or revoked.</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Portable certificates</Badge>
                <Badge variant="secondary">Public verification</Badge>
                <Badge variant="secondary">Printable record</Badge>
              </div>
              <div className="space-y-2 pt-1">
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/oap/app">
                    <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> OAP learning and certification</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/gcode-academy/app">
                    <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> GCA learning and tests</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                {!isGcaPage && (
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to="/gcode-academy/certificates/verify">
                      <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> GCA certificate lookup</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
                {!isOapPage && (
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to="/oap/certificates/verify">
                      <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> OAP certificate lookup</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}