import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, XCircle, Zap, Monitor, Smartphone, Clock, RefreshCw } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { WhyJoblineFAQ } from "@/components/marketing/WhyJoblineFAQ";

const painPoints = [
  { icon: Monitor, title: "Aging Desktop Interface", desc: "E2 Shop System's desktop-first UI was built for an era before mobile devices. Shop floor operators need modern tools that work on any device." },
  { icon: Smartphone, title: "No Mobile Shop Floor App", desc: "Running between the office and the floor to check job status shouldn't be a daily ritual. E2 wasn't designed for the connected, mobile shop." },
  { icon: Clock, title: "Complex Setup and Training", desc: "Legacy ERP systems like E2 carry years of accumulated complexity. New staff take weeks to learn what should take an afternoon." },
  { icon: RefreshCw, title: "Limited Real-Time Updates", desc: "E2's reporting model means you're always looking at yesterday's data. Modern shops need live visibility into what's happening right now." },
];

const comparison = [
  { feature: "Cloud-native (no server install)", e2: "Desktop / legacy cloud", jobline: "Yes — fully cloud-native" },
  { feature: "Mobile shop floor app", e2: "No", jobline: "Yes — operator-first" },
  { feature: "Free trial", e2: "No", jobline: "Yes" },
  { feature: "Setup time", e2: "Days to weeks", jobline: "Under 1 hour" },
  { feature: "Real-time station dashboards", e2: "Report-based", jobline: "Live, auto-updating" },
  { feature: "Shift handoff system", e2: "Not included", jobline: "Core feature" },
  { feature: "Wall display / kiosk mode", e2: "No", jobline: "Yes" },
  { feature: "AI production assistant", e2: "No", jobline: "Yes" },
];

const faqs = [
  { q: "Is E2 Shop System (Shoptech) being discontinued?", a: "ECI Software Solutions acquired Shoptech and has been transitioning customers toward JobBOSS2. If you're on E2, you may already be planning a migration — JobLine.ai is worth evaluating as your shop floor layer." },
  { q: "Can JobLine.ai replace E2 completely?", a: "JobLine.ai handles work order routing, shift handoffs, machine tracking, and quality — the shop floor execution layer. For quoting and accounting, many shops keep their existing tools and add JobLine.ai for real-time floor visibility." },
  { q: "How long does migration take?", a: "There's no migration. Start fresh with your machines and open jobs. Most shops are running live the same day." },
];

const jsonLd = { "@context": "https://schema.org", "@type": "WebPage", "name": "E2 Shop System Alternative — JobLine.ai", "url": "https://jobline.ai/compare/e2-shop-alternative" };

export default function E2ShopAlternative() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="E2 Shop System Alternative — Modern Shop Floor Software"
        description="Looking for an E2 Shop System alternative? JobLine.ai delivers cloud-native work order tracking, shift handoffs, and real-time machine dashboards — mobile-first, no installation required."
        keywords="E2 Shop alternative, E2 Shop System alternative, Shoptech E2 alternative, E2 ERP alternative, E2 job shop replacement, alternative to E2 shop, E2 manufacturing software alternative"
        canonical="/compare/e2-shop-alternative"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              Moving on from E2 Shop System?
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              The E2 Shop Alternative That's{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Built for Today's Shop Floor
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              E2 Shop System (Shoptech) served manufacturers well for decades — but today's shop floor needs cloud-native, mobile-first tools. JobLine.ai delivers real-time visibility without the legacy baggage.
            </p>
            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">Try JobLine.ai Free <ArrowRight className="w-5 h-5" /></Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} className="gap-2"><Zap className="w-5 h-5" /> See Pricing</Button>
            </div>
            <h2 className="text-2xl font-bold mb-6">Why Shops Are Moving Away from E2</h2>
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
            <h2 className="text-2xl font-bold mb-6 text-center">E2 Shop System vs. JobLine.ai</h2>
            <div className="overflow-x-auto mb-16">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Feature</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">E2 Shop System</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">JobLine.ai</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-card/50">
                      <td className="py-3 px-4 font-medium">{row.feature}</td>
                      <td className="py-3 px-4"><span className="flex items-center gap-2 text-muted-foreground"><XCircle className="w-4 h-4 text-destructive flex-shrink-0" />{row.e2}</span></td>
                      <td className="py-3 px-4"><span className="flex items-center gap-2 text-status-ok"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{row.jobline}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <LeadCaptureBar sourcePage="e2-shop-alternative" className="mb-16" />
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
              <h2 className="text-2xl font-bold mb-3">Ready to modernize your shop floor?</h2>
              <p className="text-muted-foreground mb-6">Free trial — no installation.</p>
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">Get Started Free <ArrowRight className="w-5 h-5" /></Button>
            </div>
          </div>
        </section>
        <section className="py-12"><div className="container mx-auto px-4 max-w-4xl"><WhyJoblineFAQ variant="e2" /></div></section>
        <AdPlacement format="horizontal" className="py-6" />
      </main>
      <MarketingFooter />
      <LeadCaptureModal />
    </div>
  );
}
