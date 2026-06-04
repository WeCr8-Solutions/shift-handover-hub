import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const CATEGORIES = [
  "Shop-Floor Innovators",
  "CNC and CAM Leaders",
  "Manufacturing Educators",
  "Small and Mid-Size Shop Leaders",
  "Automation and Robotics Leaders",
  "Tooling and Metrology Leaders",
  "Manufacturing Software Builders",
  "Workforce Development Leaders",
  "Rising Manufacturing Professionals",
  "Legacy Builders",
];

const SCORE = [
  { w: 25, l: "Practical manufacturing impact", d: "Real shop-floor outcomes: throughput, setup, tooling, inspection, programming, helping SMB shops operate better." },
  { w: 20, l: "Modernization / innovation", d: "Automation, digital work instructions, MES adoption, tool management, robotics, AI-assisted workflows, better data capture." },
  { w: 20, l: "Public visibility / industry voice", d: "LinkedIn, YouTube, podcasts, speaking, published technical content, community engagement." },
  { w: 15, l: "Education / mentorship / community", d: "Teaching, training programs, apprenticeships, public knowledge contribution." },
  { w: 10, l: "SMB relevance", d: "Applicability to small and mid-size shops, not just primes." },
  { w: 10, l: "Momentum (trailing 12 months)", d: "Demonstrable progress in the last year." },
];

const RULES = [
  ["Human editor review is mandatory", "before any rank is published. No published rank derives solely from automated scoring."],
  ["No defamation.", "We do not publish accusations, insults, or character claims about anyone — featured, omitted, or otherwise."],
  ["No private-claim ranking.", "Scores rely on publicly verifiable evidence (linked content, public talks, published outcomes)."],
  ["No pay-for-placement.", "Sponsors may underwrite category awards or surrounding media; sponsorship never buys a rank."],
  ["Opt-out is honored immediately.", "Any nominee can request to be removed; we comply within 7 days, no questions asked."],
  ["Conflicts of interest are disclosed.", "Anyone with a JobLine.ai commercial relationship is labeled."],
  ["Year-over-year rank movement is explained,", "never implied as a personal verdict."],
  ["Nomination is not admission.", "Being nominated does not guarantee inclusion or implicate the nominator."],
];

export default function ManufacturingVisibility100Methodology() {
  const url = "https://jobline.ai/manufacturing-100/methodology";
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Methodology — Manufacturing Visibility 100</title>
        <meta
          name="description"
          content="How the Manufacturing Visibility 100 ranks nominees: 100-point scoring across six components, plus the editorial guardrails that protect the list."
        />
        <link rel="canonical" href={url} />
      </Helmet>

      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/manufacturing-100">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to the list
          </Link>
        </Button>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Methodology</h1>
        <p className="text-lg text-muted-foreground mb-10">
          The Manufacturing Visibility 100 ranks people, shops, educators, builders, and companies pushing manufacturing forward. The list rewards practical impact, not follower count.
        </p>

        <section className="mb-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Eligible nominees</h2>
          <p className="text-muted-foreground">
            CNC programmers, machinists, manufacturing engineers, quality leaders, shop owners, tooling experts, automation integrators, manufacturing educators, technical content creators, MES / software builders, robotics and industrial-AI builders, and workforce-development leaders.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Categories</h2>
          <ol className="list-decimal pl-6 space-y-1 text-muted-foreground">
            {CATEGORIES.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Scoring — 100 points</h2>
          <div className="space-y-3">
            {SCORE.map((s) => (
              <div key={s.l} className="flex gap-4 rounded-lg border border-border bg-card p-4">
                <div className="w-12 shrink-0 text-2xl font-bold text-primary">{s.w}</div>
                <div>
                  <div className="font-semibold">{s.l}</div>
                  <div className="text-sm text-muted-foreground">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Editorial guardrails</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            These rules are non-negotiable. They protect the list's credibility and the people on it.
          </p>
          <ol className="space-y-3 list-decimal pl-6">
            {RULES.map(([head, body]) => (
              <li key={head}>
                <span className="font-semibold">{head}</span>{" "}
                <span className="text-muted-foreground">{body}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Process</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Nominations open continuously; the candidate set freezes 6 weeks before publish.</li>
            <li>An editor pairs each top-50 entry with at least two pieces of public evidence.</li>
            <li>The published list is timestamped and versioned; corrections are issued with a visible changelog.</li>
          </ul>
        </section>

        <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
          <p className="text-lg font-semibold mb-3">Ready to nominate someone?</p>
          <Button asChild>
            <Link to="/manufacturing-100/nominate">Submit a nomination</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
