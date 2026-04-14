import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, XCircle, Zap, Layers, DollarSign, Users, Clock } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";

const painPoints = [
  { icon: Layers, title: "Enterprise Scale, SMB Budget", desc: "Epicor is designed for mid-to-large manufacturers with dedicated IT teams. SMBs and job shops are often left under-supported and over-billed." },
  { icon: DollarSign, title: "Implementation Costs Are Brutal", desc: "Epicor implementations for small manufacturers routinely hit $50k–$200k+ before a single job is tracked on the floor." },
  { icon: Users, title: "Requires Consultants to Operate", desc: "Epicor's power comes with complexity. Many shops find they need ongoing consultant support that rivals the software license cost." },
  { icon: Clock, title: "12–18 Month Time to Value", desc: "By the time Epicor is fully configured, your shop's needs will have evolved twice. JobLine.ai is live the same day." },
];

const comparison = [
  { feature: "Target company size", epicor: "Mid-Large enterprise", jobline: "Job shops to mid-manufacturers" },
  { feature: "Free trial", epicor: "No", jobline: "Yes — full featured" },
  { feature: "Setup time", epicor: "12–18 months", jobline: "Under 1 hour" },
  { feature: "IT / consultant required", epicor: "Yes", jobline: "No — self-service" },
  { feature: "Mobile shop floor app", epicor: "Add-on modules", jobline: "Included, operator-first" },
  { feature: "Shift handoff system", epicor: "Not included", jobline: "Core feature" },
  { feature: "Real-time station dashboards", epicor: "Complex BI setup", jobline: "Live, out of the box" },
  { feature: "AI production assistant", epicor: "No", jobline: "Yes" },
  { feature: "Annual cost for 10-person shop", epicor: "$30k–$100k+", jobline: "Fraction of that" },
];

const faqs = [
  { q: "Epicor is for large manufacturers — should small shops look at it at all?", a: "Epicor has been making moves into the SMB market, but the product remains complex and the pricing remains enterprise-grade. Small job shops routinely get oversold on capabilities they won't use and underprepared for the implementation burden." },
  { q: "What does JobLine.ai not do that Epicor does?", a: "Epicor has full ERP modules: financials, procurement, HR, and supply chain. JobLine.ai is a shop floor execution platform — work orders, machine tracking, shift handoffs, and quality. Most small shops use QuickBooks or a simple ERP for financials and use JobLine.ai for the shop floor layer." },
  { q: "Can JobLine.ai scale as we grow?", a: "Yes. JobLine.ai is cloud-native and scales from 3 operators to hundreds without infrastructure changes. Enterprise plans include ITAR controls, MFA, and compliance features for regulated manufacturers." },
];

const jsonLd = { "@context": "https://schema.org", "@type": "WebPage", "name": "Epicor Alternative for Small Manufacturers — JobLine.ai", "url": "https://jobline.ai/compare/epicor-alternative" };

export default function EpicorAlternative() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Epicor Alternative for Small Manufacturers — JobLine.ai"
        description="Looking for an Epicor alternative for your job shop or small manufacturer? JobLine.ai delivers real-time shop floor tracking, shift handoffs, and production dashboards without the enterprise complexity or six-figure implementation cost."
        keywords="Epicor alternative, Epicor alternative small manufacturer, alternative to Epicor ERP, Epicor replacement, Epicor Kinetic alternative, smaller Epicor alternative, job shop Epicor alternative, Epicor ERP competitor"
        canonical="/compare/epicor-alternative"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              Priced Out of Epicor?
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              The Epicor Alternative Built for{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Shops, Not Enterprises
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Epicor is built for large manufacturers with IT departments and implementation budgets that most job shops don't have. JobLine.ai delivers the shop floor visibility you actually need — without the $100k price tag or 18-month timeline.
            </p>
            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">Try JobLine.ai Free <ArrowRight className="w-5 h-5" /></Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} className="gap-2"><Zap className="w-5 h-5" /> See Pricing</Button>
            </div>
            <h2 className="text-2xl font-bold mb-6">Why Small Manufacturers Look for an Epicor Alternative</h2>
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
            <h2 className="text-2xl font-bold mb-6 text-center">Epicor vs. JobLine.ai</h2>
            <div className="overflow-x-auto mb-16">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Feature</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Epicor</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">JobLine.ai</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-card/50">
                      <td className="py-3 px-4 font-medium">{row.feature}</td>
                      <td className="py-3 px-4"><span className="flex items-center gap-2 text-muted-foreground"><XCircle className="w-4 h-4 text-destructive flex-shrink-0" />{row.epicor}</span></td>
                      <td className="py-3 px-4"><span className="flex items-center gap-2 text-status-ok"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{row.jobline}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <LeadCaptureBar sourcePage="epicor-alternative" className="mb-16" />
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
              <h2 className="text-2xl font-bold mb-3">Enterprise results — without the enterprise budget</h2>
              <p className="text-muted-foreground mb-6">Free trial — no credit card, no consultant, no timeline.</p>
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">Get Started Free <ArrowRight className="w-5 h-5" /></Button>
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
