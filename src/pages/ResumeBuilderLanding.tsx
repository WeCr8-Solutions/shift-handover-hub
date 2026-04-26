import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText,
  Upload,
  Sparkles,
  ShieldCheck,
  Download,
  History,
  Wand2,
  ArrowRight,
  CheckCircle2,
  Eye,
  Cpu,
} from "lucide-react";

const FEATURES = [
  {
    icon: Upload,
    title: "Upload once — autofill everything",
    desc: "Drop your existing PDF or DOCX résumé. Our parser extracts work history, machines, controls, and skills straight onto your profile.",
  },
  {
    icon: Wand2,
    title: "AI-assisted profile autofill",
    desc: "Toggle auto-update on upload to instantly populate your JobLine talent profile from any résumé — no retyping.",
  },
  {
    icon: FileText,
    title: "Generate a shop-floor résumé PDF",
    desc: "Build a clean, machinist-focused résumé from your profile data — machines, controls, GD&T, OAP/GCA badges, and verified work history.",
  },
  {
    icon: ShieldCheck,
    title: "Verified credentials embedded",
    desc: "Every OAP and GCA cert on your profile carries a cryptographic verification link — employers can confirm in one click.",
  },
  {
    icon: History,
    title: "Version history",
    desc: "Every upload and generated résumé is archived. Restore, download, or delete previous versions any time.",
  },
  {
    icon: Eye,
    title: "Public résumé toggle",
    desc: "Choose whether your résumé is visible on your public profile. Off by default — you control exactly who sees what.",
  },
];

const STEPS = [
  { n: "1", title: "Sign in or create your free profile", desc: "Talent profiles on JobLine are always free." },
  { n: "2", title: "Upload your existing résumé", desc: "PDF or DOCX, up to 8MB. Stored securely with version history." },
  { n: "3", title: "Let AI autofill your profile", desc: "Or fill it in manually — your call. Verified certs auto-import either way." },
  { n: "4", title: "Generate & share", desc: "Build a polished PDF résumé from your profile, save it, or publish it publicly." },
];

export default function ResumeBuilderLanding() {
  const { user } = useAuth();
  // Deep link straight into the Résumé tab on the operator profile page.
  const ctaHref = user ? "/operator/profile?tab=resume" : "/auth?next=/operator/profile?tab=resume";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "JobLine Résumé Builder for Machinists",
    description:
      "Free résumé builder and parser for CNC machinists and operators. Upload, autofill, and generate a verified shop-floor résumé from your JobLine talent profile.",
    url: "https://jobline.ai/talent/resume-builder",
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Résumé Builder for Machinists — JobLine Talent"
        description="Upload, parse, and generate a verified machinist résumé. AI-assisted autofill, OAP/GCA badge embedding, version history. Always free for operators."
        keywords="machinist resume builder, CNC operator resume, resume parser, OAP certificate resume, talent profile, shop floor resume"
        canonical="/talent/resume-builder"
        jsonLd={jsonLd}
      />
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" aria-hidden />
        <div className="container relative py-16 md:py-24 max-w-5xl">
          <Badge variant="outline" className="mb-4 gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Free for operators
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            One résumé.
            <br />
            <span className="text-primary">Built for the shop floor.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
            Upload your résumé, autofill your JobLine talent profile, and generate a verified, machinist-focused PDF —
            with OAP and GCA badges built in. No retyping. No subscription.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link to={ctaHref}>
                Open résumé builder <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/talent">
                <Cpu className="w-4 h-4" /> About the Talent Network
              </Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary" /> Always free
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary" /> No ads, no recruiter spam
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary" /> Versioned & private by default
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything in one upload</h2>
          <p className="mt-3 text-muted-foreground">
            One file does the work of a dozen. The résumé builder lives inside your operator profile — no separate tool to learn.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="border-2">
              <CardHeader>
                <f.icon className="w-7 h-7 text-primary" />
                <CardTitle className="mt-2 text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{f.desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y bg-muted/30">
        <div className="container py-16 max-w-5xl">
          <h2 className="text-3xl font-bold text-center">How it works</h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-xl border bg-background p-5">
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center">
                  {s.n}
                </div>
                <p className="mt-3 font-semibold">{s.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container py-16 max-w-4xl text-center">
        <Download className="w-10 h-10 text-primary mx-auto mb-3" />
        <h2 className="text-3xl md:text-4xl font-bold">Ready to build yours?</h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Open the résumé tab on your profile, drop in a file, and let JobLine handle the rest.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link to={ctaHref}>
              Open résumé builder <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          {!user && (
            <Button asChild variant="outline" size="lg">
              <Link to="/auth">Create a free profile</Link>
            </Button>
          )}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
