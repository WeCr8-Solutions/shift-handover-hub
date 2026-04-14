import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, XCircle, Zap, BarChart3 } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockWorkOrderTracker } from "@/components/marketing/MockWorkOrderTracker";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";

const erpProblems = [
  "12–18 month implementations",
  "$50k–$500k+ upfront cost",
  "Requires a full-time admin or consultant",
  "Designed for accountants, not machinists",
  "Shop floor rarely uses it after go-live",
];

const joblineWins = [
  "Live work order routing and status — updated by operators",
  "Structured digital shift handoffs between crews",
  "Priority queue management for hot jobs",
  "Real-time station dashboards for every machine",
  "Quality gates and in-process inspection checkpoints",
  "Production analytics — cycle time, scrap, on-time delivery",
  "Works on phones and tablets on the shop floor",
  "Setup in under an hour — no consultants needed",
];

const integrations = [
  {
    name: "QuickBooks",
    desc: "Import jobs and customers without double-entry. Use QuickBooks for invoicing; JobLine.ai for production.",
  },
  {
    name: "JobBoss / E2",
    desc: "Use JobLine.ai for shop floor execution while JobBoss handles estimating and order management.",
  },
  {
    name: "Epicor / Kinetic",
    desc: "Complement Epicor with real-time shop floor data that traditional ERP reporting can't capture.",
  },
  {
    name: "Spreadsheets",
    desc: "Replace your shared Excel job log with a live digital system your whole team updates in real time.",
  },
];

const faqs = [
  {
    q: "Is JobLine.ai a full ERP replacement?",
    a: "No, and we don't pretend to be. JobLine.ai focuses on shop floor execution — the piece most ERPs get wrong. It works alongside your existing accounting and estimating tools.",
  },
  {
    q: "What if I already have an ERP system?",
    a: "JobLine.ai complements ERP by adding real-time shop floor visibility. Many shops use JobBoss or Epicor for quotes and invoicing, and JobLine.ai for production tracking.",
  },
  {
    q: "What does it cost compared to ERP?",
    a: "JobLine.ai starts free and scales based on team size. Most job shops pay less per month than a single hour of ERP consulting.",
  },
  {
    q: "How fast can we get started?",
    a: "Most shops are up and running in under an hour. Add your machines, create a team, enter open jobs — done.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai — Job Shop ERP Alternative",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "description":
    "Lightweight job shop ERP alternative. Real-time work order tracking, shift handoffs, and shop floor visibility without the cost and complexity of traditional ERP software.",
  "url": "https://jobline.ai/features/job-shop-erp",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function JobShopERP() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Job Shop ERP Alternative - Lightweight Software for Small Shops"
        description="Job shop ERP software without enterprise complexity. Real-time work order tracking, shift handoffs, and production analytics for small and mid-size machine shops. Start free — live in under an hour."
        keywords="job shop ERP, ERP for job shops, job shop ERP software, small shop ERP, machine shop ERP, lightweight ERP, ERP alternative manufacturers, job shop management system, shop floor ERP, ERP alternative job shop"
        canonical="/features/job-shop-erp"
        jsonLd={jsonLd}
      />

      <MarketingNav />

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <BarChart3 className="w-4 h-4" />
              Job Shop ERP Alternative
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Job Shop ERP —{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Without the Enterprise Complexity
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Traditional ERP is built for procurement and accounting teams. JobLine.ai is built for the shop
              floor. Get the production visibility you need — without the 18-month implementation or six-figure
              price tag.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start Free — No Credit Card <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} className="gap-2">
                <Zap className="w-5 h-5" /> See Pricing
              </Button>
            </div>

            <MockWorkOrderTracker />
          </div>
        </section>

        <AdPlacement format="horizontal" className="py-4" />

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div className="p-6 rounded-xl bg-destructive/5 border border-destructive/20">
                <h3 className="text-lg font-bold mb-4 text-destructive">Traditional Job Shop ERP</h3>
                <ul className="space-y-3">
                  {erpProblems.map((p, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 rounded-xl bg-status-ok/5 border border-status-ok/20">
                <h3 className="text-lg font-bold mb-4 text-status-ok">JobLine.ai</h3>
                <ul className="space-y-3">
                  {[
                    "Live in under an hour",
                    "Free trial, then affordable monthly plan",
                    "Operators set it up themselves",
                    "Designed for CNC machinists",
                    "Used on the shop floor every single shift",
                  ].map((p, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-status-ok flex-shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-6">What You Get Instead of ERP</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {joblineWins.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-status-ok mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <h2 className="text-2xl font-bold mb-2">Works Alongside Your Existing Tools</h2>
            <p className="text-muted-foreground mb-8">
              You don't have to rip and replace anything. JobLine.ai fills the shop floor execution gap that ERP
              leaves open.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-16">
              {integrations.map((int, i) => (
                <div key={i} className="p-4 rounded-lg bg-card border border-border">
                  <h3 className="font-semibold mb-1">{int.name}</h3>
                  <p className="text-sm text-muted-foreground">{int.desc}</p>
                </div>
              ))}
            </div>

            <LeadCaptureBar sourcePage="job-shop-erp" className="mb-16" />

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
              <h2 className="text-2xl font-bold mb-3">Stop waiting for ERP to fix your shop floor</h2>
              <p className="text-muted-foreground mb-6">
                Start free today. Be running this afternoon. No consultants, no implementation fees.
              </p>
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Try JobLine.ai Free <ArrowRight className="w-5 h-5" />
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
