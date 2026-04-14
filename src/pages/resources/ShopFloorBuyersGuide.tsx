import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, BookOpen, CheckSquare, AlertCircle, Users, DollarSign, Layers } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";

const steps = [
  {
    step: "1",
    title: "Define Your Problems Before Evaluating Software",
    icon: AlertCircle,
    content: "Start with pain, not features. The most common shop floor problems that software solves are: losing track of where jobs are, late deliveries with no early warning, quality escapes that could have been caught in-process, shift handoffs where critical information gets lost, and no visibility into machine utilization or downtime. Write down your top three. Every vendor evaluation should be measured against whether the software actually eliminates those specific problems.",
  },
  {
    step: "2",
    title: "Understand the Software Categories",
    icon: Layers,
    content: "Job shop software falls into several overlapping categories: ERP (business management: orders, purchasing, financials), MES (manufacturing execution: floor visibility, work order tracking, quality), CMMS (maintenance management), and QMS (quality management system). Many platforms market themselves as 'all-in-one' but are strong in some areas and weak in others. Know which category you need most urgently. Most job shops need real-time floor visibility (MES) before the financial management layer (ERP).",
  },
  {
    step: "3",
    title: "Identify Your Must-Have vs. Nice-to-Have Features",
    icon: CheckSquare,
    content: "Build a two-column list: features you cannot run without (must-haves) and features that would be helpful but aren't blocking you (nice-to-haves). Common must-haves for job shops: real-time work order status, routing with operation-level tracking, digital shift handoffs, basic quality inspection records, and job costing (actual vs. estimated). Nice-to-haves: advanced scheduling optimization, EDI integration, customer portals, predictive maintenance AI. Don't let a vendor's impressive nice-to-have features distract you from must-have gaps.",
  },
  {
    step: "4",
    title: "Evaluate Operator Adoption Risk",
    icon: Users,
    content: "The most expensive software failure mode is a system your operators don't use. Evaluate: How many taps does it take for an operator to log a job start? Is the interface readable on a shop floor tablet or phone from 18 inches? Can operators who aren't computer-savvy learn the key tasks in under an hour? If the system requires operators to make complex entries to track their work, it will fail on the shop floor regardless of how powerful the reporting is on the back end.",
  },
  {
    step: "5",
    title: "Understand the True Total Cost",
    icon: DollarSign,
    content: "Subscription price is only part of the cost. Add: implementation and configuration time (who does it — you or a consultant?), training cost per employee, integration cost if you need to connect to existing systems, ongoing support fees, and the cost of your IT team's time if the software is on-premise. Cloud-native software with self-serve onboarding is almost always lower total cost for small and mid-size shops than on-premise systems requiring IT infrastructure.",
  },
  {
    step: "6",
    title: "Run a Realistic Pilot Before Committing",
    icon: BookOpen,
    content: "Request a free trial or pilot period — not just a demo. Run the software on real jobs with real operators for at least two weeks. Evaluate: Did operators actually use it? Did you get data that helped you make better decisions? Were there gaps you didn't expect? A demo by a sales rep shows the software at its best. A pilot on your real shop floor shows you how it actually performs.",
  },
];

const redFlags = [
  "Vendor can't give you a working trial — only a scripted demo",
  "Long implementation timeline just to get started (>30 days for cloud software)",
  "Per-seat pricing that makes it unaffordable to give every operator access",
  "No mobile app or mobile-optimized web interface for shop floor use",
  "Requires dedicated IT infrastructure or on-premise server",
  "Key features are 'coming soon' or required paid add-ons",
  "References are all from large manufacturers — none from shops your size",
  "Contract requires multi-year commitment before you've proven ROI",
];

const faqs = [
  { q: "How much should job shop software cost?", a: "Cloud-based job shop software typically ranges from $200–$2,000/month for small to mid-size shops (5–50 employees). Enterprise solutions for larger manufacturers run $5,000–$20,000/month or more. Be wary of pricing that scales dramatically with users — shop floor software is only useful if every operator can access it." },
  { q: "How long does it take to implement shop floor software?", a: "Cloud-native shop floor software should be usable within days — not months. If a vendor is quoting you 3–6 months to go live, they're describing an enterprise ERP implementation timeline, not shop floor management software. A well-designed platform should have you tracking real jobs in production within a week." },
  { q: "Should I buy a full ERP or a focused MES first?", a: "For most job shops, start with the specific problem that's costing you the most money. If you're losing jobs between routing steps and missing ship dates, you need MES first. If your quote-to-cash process is broken and your financials are a mess, you need ERP. Most shops benefit from getting shop floor visibility (MES) before the business management layer (ERP) — because floor data informs every other business decision." },
  { q: "What's the biggest mistake shops make when buying manufacturing software?", a: "Buying based on features instead of adoption. The most feature-rich platform that sits unused generates zero ROI. The simpler platform that your operators actually engage with transforms your production visibility. Evaluate usability and adoption potential as seriously as you evaluate the feature list." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Shop Floor Software Buyer's Guide for Job Shops and Machine Shops",
  "description": "A step-by-step guide to evaluating and selecting job shop software — from defining your requirements through running a realistic pilot evaluation.",
  "url": "https://jobline.ai/resources/buyers-guide",
  "author": { "@type": "Organization", "name": "JobLine.ai" },
};

export default function ShopFloorBuyersGuide() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Shop Floor Software Buyer's Guide — How to Choose Manufacturing Software"
        description="A practical buyer's guide for evaluating and selecting job shop software. Learn what to look for, what questions to ask, and how to avoid the most common software buying mistakes in manufacturing."
        keywords="shop floor software buyers guide, how to choose manufacturing software, manufacturing software comparison guide, job shop software guide, MES software selection, best manufacturing software job shop, how to evaluate shop floor software, manufacturing software buyer guide, job shop ERP buyers guide"
        canonical="/resources/buyers-guide"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <BookOpen className="w-4 h-4" />
              Buyer's Guide
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Shop Floor Software Buyer's Guide{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                for Job Shops and Machine Shops
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              A practical, vendor-agnostic guide to evaluating manufacturing software — from defining your requirements through running a realistic pilot. Written for production managers, shop owners, and operations directors who don't want to get burned by a bad software decision.
            </p>
          </div>
        </section>
        <AdPlacement format="horizontal" className="py-4" />
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-8">The 6-Step Evaluation Framework</h2>
            <div className="space-y-8 mb-16">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-6 p-6 rounded-xl bg-card border border-border">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-bold text-primary text-lg">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-lg">{s.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{s.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold mb-6">Red Flags to Watch For</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {redFlags.map((r, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{r}</span>
                </li>
              ))}
            </ul>

            <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 mb-16">
              <h3 className="text-lg font-bold mb-4">JobLine.ai: How We Stack Up Against This Framework</h3>
              <ul className="space-y-3">
                {[
                  "Free trial — no sales call required to see real software",
                  "Live in under 1 hour — no implementation project",
                  "Flat pricing — every operator gets access",
                  "Mobile-first interface built for shop floor phones and tablets",
                  "Cloud-native — no server, no IT team required",
                  "References from job shops 5–150 employees",
                ].map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-status-ok flex-shrink-0" />{b}</li>
                ))}
              </ul>
            </div>

            <LeadCaptureBar sourcePage="buyers-guide" className="mb-16" />

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
              <h2 className="text-2xl font-bold mb-3">Start your realistic pilot — today</h2>
              <p className="text-muted-foreground mb-6">Free trial — see the real software on your real jobs, no demo required.</p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">Start Free Trial <ArrowRight className="w-5 h-5" /></Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/demo")} className="gap-2"><Zap className="w-5 h-5" /> Book a Demo</Button>
              </div>
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
