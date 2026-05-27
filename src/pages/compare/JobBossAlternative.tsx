import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, XCircle, Zap, Clock, DollarSign, Smartphone, BarChart3 } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { WhyJoblineFAQ } from "@/components/marketing/WhyJoblineFAQ";

const painPoints = [
  { icon: Clock, title: "Months-Long Implementation", desc: "JobBOSS2 implementations routinely take 3–9 months with consultants, data migration, and training before you see any value." },
  { icon: DollarSign, title: "High Total Cost of Ownership", desc: "Between licensing, implementation fees, training, and annual maintenance, most shops spend $20k–$100k+ in year one alone." },
  { icon: Smartphone, title: "Not Built for the Shop Floor", desc: "Designed for office users doing estimating and accounting — not for machinists and operators who need quick updates from the machine." },
  { icon: BarChart3, title: "ERP Complexity You Don't Need", desc: "JobBOSS2 is built for every type of manufacturer. That means a UI bloated with modules your shop will never use." },
];

const comparison = [
  { feature: "Setup time", jobboss: "3–9 months", jobline: "Under 1 hour" },
  { feature: "Free trial", jobboss: "No", jobline: "Yes — full featured" },
  { feature: "Shop floor mobile app", jobboss: "Limited", jobline: "Yes — optimized for gloved hands" },
  { feature: "Operator-first UI", jobboss: "Office-first", jobline: "Shop floor-first" },
  { feature: "Shift handoff system", jobboss: "Not included", jobline: "Built in" },
  { feature: "Real-time station dashboards", jobboss: "Reporting-based", jobline: "Live, auto-updating" },
  { feature: "Wall display / kiosk mode", jobboss: "No", jobline: "Yes" },
  { feature: "IT infrastructure required", jobboss: "Yes — Windows server or cloud setup", jobline: "No — cloud-native SaaS" },
  { feature: "AI production assistant", jobboss: "No", jobline: "Yes" },
  { feature: "DNC / G-code file management", jobboss: "Separate add-on", jobline: "Included" },
];

const faqs = [
  { q: "Does JobLine.ai replace everything JobBOSS does?", a: "JobLine.ai focuses on shop floor execution — routing, station tracking, shift handoffs, dashboards, and quality. For quoting and accounting, most shops keep their existing tools (QuickBooks, estimating software) and use JobLine for the shop floor layer." },
  { q: "How hard is the migration from JobBOSS2?", a: "There's nothing to migrate. You start fresh with your machines and operators. Most shops are running live the same day they sign up." },
  { q: "Is JobLine.ai less powerful than JobBOSS?", a: "JobLine.ai does less — deliberately. It's purpose-built for what happens on the shop floor after the job is won. It does that far better than any ERP system was designed to." },
  { q: "What if I need quoting and estimating too?", a: "JobLine.ai doesn't replace estimating software. It replaces the whiteboard, clipboard, and verbal handoffs that happen after estimating — the execution layer most ERPs ignore." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "JobBOSS Alternative — JobLine.ai",
  "description": "Looking for a JobBOSS2 or JobBOSS alternative? JobLine.ai delivers real-time shop floor tracking, shift handoffs, and production dashboards — live in under an hour, no consultants needed.",
  "url": "https://jobline.ai/compare/jobboss-alternative",
};

export default function JobBossAlternative() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="JobBOSS Alternative — Lighter, Faster Shop Floor Software"
        description="Looking for a JobBOSS2 alternative? JobLine.ai gives job shops real-time work order tracking, shift handoffs, and shop floor dashboards — live in under an hour, no consultants, no six-figure implementation."
        keywords="JobBOSS alternative, JobBOSS2 alternative, JobBoss replacement, alternative to JobBoss ERP, JobBoss competitor, job shop software alternative to JobBoss, ECI software alternative"
        canonical="/compare/jobboss-alternative"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              Switching from JobBOSS2?
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              The JobBOSS Alternative Built{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                for Your Shop Floor
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              JobBOSS2 is a powerful ERP — but most job shops are paying for accounting and procurement
              modules while their shop floor still runs on clipboards and verbal handoffs. JobLine.ai fixes
              that — live in under an hour.
            </p>
            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Try JobLine.ai Free <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} className="gap-2">
                <Zap className="w-5 h-5" /> See Pricing
              </Button>
            </div>

            <h2 className="text-2xl font-bold mb-6">Why Shops Look for a JobBOSS Alternative</h2>
            <div className="grid sm:grid-cols-2 gap-6 mb-16">
              {painPoints.map((p, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <p.icon className="w-7 h-7 text-destructive mb-3" />
                  <h3 className="font-semibold mb-2">{p.title}</h3>
                  <p className="text-muted-foreground text-sm">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <AdPlacement format="horizontal" className="py-4" />

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6 text-center">JobBOSS2 vs. JobLine.ai</h2>
            <div className="overflow-x-auto mb-16">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Feature</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">JobBOSS2</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">JobLine.ai</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-card/50">
                      <td className="py-3 px-4 font-medium">{row.feature}</td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <XCircle className="w-4 h-4 text-destructive flex-shrink-0" /> {row.jobboss}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-2 text-status-ok">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {row.jobline}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <LeadCaptureBar sourcePage="jobboss-alternative" className="mb-16" />

            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4 mb-16">
              {faqs.map((faq, i) => (
                <div key={i} className="p-4 rounded-lg bg-secondary/30">
                  <h3 className="font-medium mb-1">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>

            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <h2 className="text-2xl font-bold mb-3">Start free today — no consultant required</h2>
              <p className="text-muted-foreground mb-6">Most shops are live before lunch on day one.</p>
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>
        <AdPlacement format="horizontal" className="py-6" />
      </main>
      <MarketingFooter />
      <LeadCaptureModal />
    </div>
  );
}
