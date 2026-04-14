import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, XCircle, Zap, Server, DollarSign, Clock, Smartphone } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";

const painPoints = [
  { icon: Server, title: "On-Premise Complexity", desc: "Global Shop Solutions has historically been on-premise first. Managing servers, updates, and backups shouldn't be your IT team's job." },
  { icon: DollarSign, title: "High Implementation Cost", desc: "Full Global Shop implementations require significant investment in software, setup, training, and often ongoing support contracts." },
  { icon: Clock, title: "Long Time to Value", desc: "Enterprise ERP implementations don't deliver ROI on day one. Shops pay for months before getting any production visibility." },
  { icon: Smartphone, title: "Office-Centric Design", desc: "Global Shop Solutions is designed for managers and planners. Shop floor operators need something simpler — on their phone, in seconds." },
];

const comparison = [
  { feature: "Deployment model", globalshop: "On-premise / complex cloud", jobline: "Cloud-native SaaS" },
  { feature: "Free trial", globalshop: "No", jobline: "Yes — full featured" },
  { feature: "Setup time", globalshop: "Months", jobline: "Under 1 hour" },
  { feature: "Mobile shop floor app", globalshop: "Limited", jobline: "Yes — operator-first" },
  { feature: "Shift handoff system", globalshop: "Not included", jobline: "Core feature" },
  { feature: "Real-time dashboards", globalshop: "Report-based", jobline: "Live, auto-updating" },
  { feature: "AI production assistant", globalshop: "No", jobline: "Yes" },
  { feature: "Wall display mode", globalshop: "No", jobline: "Yes" },
];

const faqs = [
  { q: "Is Global Shop Solutions a good product?", a: "Yes — Global Shop is a robust ERP with deep functionality for mid-size manufacturers. JobLine.ai isn't trying to replace its quoting, accounting, or purchasing modules. We focus on the shop floor execution gap those systems leave open." },
  { q: "Can JobLine.ai work alongside Global Shop Solutions?", a: "Yes. JobLine.ai adds real-time shop floor tracking and digital shift handoffs on top of whatever ERP or scheduling system you already have." },
  { q: "What happens to our data if we stop using JobLine.ai?", a: "Your data is yours. Export at any time in standard formats. No lock-in." },
];

const jsonLd = { "@context": "https://schema.org", "@type": "WebPage", "name": "Global Shop Solutions Alternative — JobLine.ai", "url": "https://jobline.ai/compare/global-shop-alternative" };

export default function GlobalShopAlternative() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Global Shop Solutions Alternative — Cloud-Native Shop Floor Software"
        description="Looking for a Global Shop Solutions alternative? JobLine.ai delivers real-time work order tracking, shift handoffs, and shop floor dashboards — cloud-native, mobile-friendly, live in under an hour."
        keywords="Global Shop Solutions alternative, Global Shop ERP alternative, Global Shop replacement, alternative to Global Shop Solutions, shop floor software Global Shop, ERP alternative Global Shop"
        canonical="/compare/global-shop-alternative"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              Evaluating Global Shop Solutions?
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              The Global Shop Alternative That's{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Cloud-Native from Day One
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Global Shop Solutions is a full ERP for manufacturers who need everything in one system. JobLine.ai is for shops that want real-time shop floor visibility and digital handoffs — without the enterprise price tag or on-premise infrastructure.
            </p>
            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">Try JobLine.ai Free <ArrowRight className="w-5 h-5" /></Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} className="gap-2"><Zap className="w-5 h-5" /> See Pricing</Button>
            </div>
            <h2 className="text-2xl font-bold mb-6">Why Shops Look for a Global Shop Alternative</h2>
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
            <h2 className="text-2xl font-bold mb-6 text-center">Global Shop Solutions vs. JobLine.ai</h2>
            <div className="overflow-x-auto mb-16">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Feature</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Global Shop Solutions</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">JobLine.ai</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-card/50">
                      <td className="py-3 px-4 font-medium">{row.feature}</td>
                      <td className="py-3 px-4"><span className="flex items-center gap-2 text-muted-foreground"><XCircle className="w-4 h-4 text-destructive flex-shrink-0" />{row.globalshop}</span></td>
                      <td className="py-3 px-4"><span className="flex items-center gap-2 text-status-ok"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{row.jobline}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <LeadCaptureBar sourcePage="global-shop-alternative" className="mb-16" />
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
              <h2 className="text-2xl font-bold mb-3">Live before the next shift — guaranteed</h2>
              <p className="text-muted-foreground mb-6">Free trial — no credit card, no IT department needed.</p>
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
