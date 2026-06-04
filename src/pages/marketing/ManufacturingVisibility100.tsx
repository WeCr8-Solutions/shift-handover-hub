import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, ShieldCheck, Sparkles, Users, ArrowRight, CheckCircle2 } from "lucide-react";

const CATEGORIES = [
  { name: "Shop-Floor Innovators", desc: "Operators and engineers turning theory into throughput." },
  { name: "CNC and CAM Leaders", desc: "Programmers and technologists raising the floor on what's possible." },
  { name: "Manufacturing Educators", desc: "Teachers, trainers, and creators building the next generation." },
  { name: "Small and Mid-Size Shop Leaders", desc: "Owners proving SMB manufacturing can compete and lead." },
  { name: "Automation and Robotics Leaders", desc: "Practitioners deploying real automation, not slide-deck automation." },
  { name: "Tooling and Metrology Leaders", desc: "Experts pushing measurement, tooling, and inspection forward." },
  { name: "Manufacturing Software Builders", desc: "People shipping software that operators actually use." },
  { name: "Workforce Development Leaders", desc: "Apprenticeship, training, and pipeline builders." },
  { name: "Rising Manufacturing Professionals", desc: "Early-career operators and engineers worth watching." },
  { name: "Legacy Builders", desc: "Veterans whose work still shapes how the industry runs." },
  { name: "Industry Catalysts", desc: "Leaders whose platforms, capital, or public influence move manufacturing forward indirectly — AI compute, semiconductors, space and EV scale-up, supply-chain operating systems." },
];

const SCORING = [
  { weight: 25, label: "Practical manufacturing impact", desc: "Real shop-floor outcomes — throughput, setup, tooling, inspection." },
  { weight: 20, label: "Modernization / innovation", desc: "Automation, MES, digital work instructions, AI-assisted workflows." },
  { weight: 20, label: "Public visibility / industry voice", desc: "LinkedIn, YouTube, podcasts, speaking, published content." },
  { weight: 15, label: "Education / mentorship / community", desc: "Teaching, training, knowledge contribution." },
  { weight: 10, label: "SMB relevance", desc: "Applicability to small and mid-size shops, not just primes." },
  { weight: 10, label: "Momentum (12 months)", desc: "Demonstrable progress in the last year." },
];

const GUARDRAILS = [
  "Human editor review on every rank before publish.",
  "No defamation, no accusations, no rage-bait.",
  "No private-claim ranking — public evidence only.",
  "No pay-for-placement. Sponsorship never buys a rank.",
  "Opt-out honored within 7 days, no questions.",
  "Conflicts of interest are disclosed inline.",
];

const FAQ = [
  { q: "How much does it cost to be nominated?", a: "Nothing. Nomination and inclusion are free." },
  { q: "Can I nominate myself?", a: "Yes. Peer nominations carry more editorial weight, but self-nominations are accepted and reviewed on the same criteria." },
  { q: "When does the list publish?", a: "First edition publishes in Q4 2026. Nominations are open continuously and the candidate set freezes 6 weeks before publish." },
  { q: "Can I be removed from the list?", a: "Yes. Email editorial and we'll remove your entry within 7 days, no questions asked." },
  { q: "Is this a JobLine.ai promotion?", a: "JobLine.ai (operated by WeCr8 Solutions) is the publisher. The list is editorially independent of our product roadmap and customers." },
];

export default function ManufacturingVisibility100() {
  const url = "https://jobline.ai/manufacturing-100";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "The Manufacturing Visibility 100",
    description:
      "Annual recognition of 100 people, companies, builders, and educators pushing modern manufacturing forward.",
    url,
    publisher: {
      "@type": "Organization",
      name: "WeCr8 Solutions",
      url: "https://jobline.ai",
    },
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>The Manufacturing Visibility 100 — JobLine.ai</title>
        <meta
          name="description"
          content="Annual recognition of 100 people, shops, builders, and educators pushing modern manufacturing forward. Nominations open."
        />
        <link rel="canonical" href={url} />
        <meta property="og:title" content="The Manufacturing Visibility 100" />
        <meta
          property="og:description"
          content="100 people and organizations pushing modern manufacturing forward. Nominations open."
        />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-20 md:py-28 max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Inaugural edition · 2026
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            The Manufacturing Visibility 100
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-8">
            100 people, shops, builders, and educators pushing modern manufacturing forward — recognized on practical impact, not follower count.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/manufacturing-100/nominate">
                Nominate someone <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/manufacturing-100/honorees">View honorees</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link to="/manufacturing-100/methodology">Read the methodology</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Inaugural list live banner */}
      <section className="border-b border-border bg-primary/5">
        <div className="container mx-auto px-4 py-4 max-w-5xl flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="font-medium">The inaugural editorial list is live across eleven categories.</span>
          <Link to="/manufacturing-100/honorees" className="text-primary hover:underline inline-flex items-center gap-1">
            See the honorees <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Why this list */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <h2 className="text-3xl font-bold mb-10">Why this list exists</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Award,
              title: "Recognition that matters",
              body:
                "Manufacturing's best work happens out of view. We surface the people whose impact is real but under-credited.",
            },
            {
              icon: Sparkles,
              title: "Modernization, not hype",
              body:
                "We reward shipped automation, MES adoption, better tooling, and education — not vendor slide decks.",
            },
            {
              icon: Users,
              title: "A platform for the industry",
              body:
                "Featured nominees become part of an alumni network of operators, programmers, owners, and educators.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <Card key={title} className="bg-card">
              <CardHeader>
                <Icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">{body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="border-y border-border bg-muted/30">
        <div className="container mx-auto px-4 py-16 max-w-5xl">
          <h2 className="text-3xl font-bold mb-2">Eleven categories</h2>
          <p className="text-muted-foreground mb-10">
            Each nominee is reviewed inside one category. Category leaders also appear on the main 100.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {CATEGORIES.map((c) => (
              <div key={c.name} className="flex gap-3 rounded-lg border border-border bg-card p-4">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-sm text-muted-foreground">{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <h2 className="text-3xl font-bold mb-2">How scoring works</h2>
        <p className="text-muted-foreground mb-10">
          Each nominee gets a 0–100 score across six components. A human editor reviews every rank before publish.
        </p>
        <div className="space-y-3">
          {SCORING.map((s) => (
            <div key={s.label} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
              <div className="w-16 shrink-0 text-2xl font-bold text-primary">{s.weight}</div>
              <div>
                <div className="font-semibold">{s.label}</div>
                <div className="text-sm text-muted-foreground">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Button asChild variant="outline">
            <Link to="/manufacturing-100/methodology">Full methodology</Link>
          </Button>
        </div>
      </section>

      {/* Guardrails */}
      <section className="border-y border-border bg-muted/30">
        <div className="container mx-auto px-4 py-16 max-w-5xl">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <h2 className="text-3xl font-bold">Editorial guardrails</h2>
          </div>
          <p className="text-muted-foreground mb-8">
            What this list will not do. These rules protect the people on it — and the credibility of the list itself.
          </p>
          <ul className="grid md:grid-cols-2 gap-3">
            {GUARDRAILS.map((g) => (
              <li key={g} className="flex gap-3 rounded-lg border border-border bg-card p-4">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA band */}
      <section className="container mx-auto px-4 py-20 max-w-5xl">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-card p-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Know someone who should be on the list?</h2>
          <p className="text-muted-foreground text-lg mb-6 max-w-2xl mx-auto">
            Peer nominations carry more editorial weight than self-nominations. It takes 90 seconds.
          </p>
          <Button asChild size="lg">
            <Link to="/manufacturing-100/nominate">
              Submit a nomination <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <h2 className="text-3xl font-bold mb-8">FAQ</h2>
          <div className="space-y-4">
            {FAQ.map((f) => (
              <Card key={f.q}>
                <CardHeader>
                  <CardTitle className="text-lg">{f.q}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">{f.a}</CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-sm text-muted-foreground">
            Related: <Link to="/talent" className="text-primary hover:underline">JobLine Talent</Link> ·{" "}
            <Link to="/oap" className="text-primary hover:underline">OAP</Link> ·{" "}
            <Link to="/gcode-academy" className="text-primary hover:underline">G-Code Academy</Link> ·{" "}
            <Link to="/learn" className="text-primary hover:underline">Learning Center</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
