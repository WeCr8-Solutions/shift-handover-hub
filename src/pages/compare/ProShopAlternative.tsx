import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, XCircle, Zap, DollarSign, Clock, Users, Layers } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { WhyJoblineFAQ } from "@/components/marketing/WhyJoblineFAQ";

const painPoints = [
  { icon: DollarSign, title: "Enterprise Pricing", desc: "ProShop ERP is a premium product with pricing to match — most small and mid-size shops are priced out before they even see a demo." },
  { icon: Clock, title: "Long Onboarding Curve", desc: "ProShop's depth is its strength and its weakness. Learning the system can take weeks for operators who need something they can use on day one." },
  { icon: Layers, title: "Over-Built for Small Shops", desc: "ProShop covers AS9100, ITAR, PPAP — features precision aerospace shops need. If you don't need all of that, you're paying for complexity you won't use." },
  { icon: Users, title: "Operator Adoption Challenges", desc: "Complex enterprise software struggles to get buy-in from shop floor operators who prefer tools that get out of their way." },
];

const comparison = [
  { feature: "Free trial available", proshop: "No", jobline: "Yes" },
  { feature: "Setup time", proshop: "Weeks to months", jobline: "Under 1 hour" },
  { feature: "Pricing for small shops (5–20 people)", proshop: "High", jobline: "Affordable monthly plan" },
  { feature: "Shop floor mobile first", proshop: "Partial", jobline: "Yes — built for operators" },
  { feature: "Shift handoff system", proshop: "Not primary focus", jobline: "Core feature" },
  { feature: "Wall display / kiosk mode", proshop: "No", jobline: "Yes — auto-refresh display" },
  { feature: "Real-time station dashboards", proshop: "Reporting-based", jobline: "Live, operator-driven" },
  { feature: "AI production assistant", proshop: "No", jobline: "Yes" },
  { feature: "DNC / G-code file management", proshop: "Separate module", jobline: "Included" },
];

const faqs = [
  { q: "Is JobLine.ai as full-featured as ProShop?", a: "ProShop is an exceptionally deep ERP. JobLine.ai covers the shop floor execution layer — routing, handoffs, machine tracking, and quality. Shops that need ProShop's full quoting-to-invoice ERP should evaluate ProShop; shops that primarily need to fix their shop floor visibility and shift handoffs will find JobLine.ai gets them there faster at a lower cost." },
  { q: "Can I use JobLine.ai alongside ProShop if I already have it?", a: "Yes. Some shops use ProShop for estimating and order management while using JobLine.ai for the real-time shop floor layer." },
  { q: "What's the minimum team size for JobLine.ai?", a: "There's no minimum. Shops with 3 operators up to 300+ use it. Free trial available regardless of size." },
];

const jsonLd = { "@context": "https://schema.org", "@type": "WebPage", "name": "ProShop ERP Alternative — JobLine.ai", "url": "https://jobline.ai/compare/proshop-alternative" };

export default function ProShopAlternative() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="ProShop ERP Alternative — Simpler Shop Floor Software That Ships Faster"
        description="Looking for a ProShop ERP alternative? JobLine.ai delivers real-time work order tracking, shift handoffs, and machine dashboards — without the ProShop price tag or months-long onboarding."
        keywords="ProShop ERP alternative, ProShop alternative, ProShop competitor, alternative to ProShop, ProShop ERP replacement, shop floor software ProShop, job shop ERP alternative ProShop"
        canonical="/compare/proshop-alternative"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              Evaluating ProShop ERP?
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              The ProShop Alternative That's{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Live Before Lunch
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              ProShop is excellent software — but most job shops need shop floor visibility and digital shift handoffs, not a full precision aerospace ERP. JobLine.ai gets you the 80% that matters in under an hour.
            </p>
            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">Try JobLine.ai Free <ArrowRight className="w-5 h-5" /></Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} className="gap-2"><Zap className="w-5 h-5" /> See Pricing</Button>
            </div>
            <h2 className="text-2xl font-bold mb-6">Why Shops Look for a ProShop Alternative</h2>
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
            <h2 className="text-2xl font-bold mb-6 text-center">ProShop ERP vs. JobLine.ai</h2>
            <div className="overflow-x-auto mb-16">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Feature</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">ProShop ERP</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">JobLine.ai</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-card/50">
                      <td className="py-3 px-4 font-medium">{row.feature}</td>
                      <td className="py-3 px-4"><span className="flex items-center gap-2 text-muted-foreground"><XCircle className="w-4 h-4 text-destructive flex-shrink-0" />{row.proshop}</span></td>
                      <td className="py-3 px-4"><span className="flex items-center gap-2 text-status-ok"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{row.jobline}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <LeadCaptureBar sourcePage="proshop-alternative" className="mb-16" />
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
              <h2 className="text-2xl font-bold mb-3">Start free — no hassle</h2>
              <p className="text-muted-foreground mb-6">Your shop floor dashboard is ready before your next shift.</p>
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">Get Started Free <ArrowRight className="w-5 h-5" /></Button>
            </div>
          </div>
        </section>
        <section className="py-12"><div className="container mx-auto px-4 max-w-4xl"><WhyJoblineFAQ variant="proshop" /></div></section>
        <AdPlacement format="horizontal" className="py-6" />
      </main>
      <MarketingFooter />
      <LeadCaptureModal />
    </div>
  );
}
