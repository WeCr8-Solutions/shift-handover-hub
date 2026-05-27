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
  { icon: Clock, title: "6–18 Month Implementations", desc: "S/4HANA Cloud and Business One rollouts routinely consume a year or more before the shop floor sees a single screen built for them." },
  { icon: DollarSign, title: "Six- to Seven-Figure First Year", desc: "Licensing, partner-led implementation, integration work, and required training quickly land between $100k and $1M+ in year one." },
  { icon: Smartphone, title: "Built for Finance, Not Machinists", desc: "SAP excels at GL, AP and procurement. The shop floor gets PP and PM modules that operators almost never touch directly." },
  { icon: BarChart3, title: "Change Costs You a Change Order", desc: "Every routing tweak, new cert, or process update routes through a partner SOW. Small shops can't move at SAP's pace." },
];

const comparison = [
  { feature: "Setup time", sap: "6–18 months", jobline: "Under 1 hour" },
  { feature: "First-year cost", sap: "$100k–$1M+", jobline: "Free → low monthly SaaS" },
  { feature: "Built for shop floor operators", sap: "No — finance-first", jobline: "Yes — operator-first" },
  { feature: "Free trial", sap: "No", jobline: "Yes — full featured" },
  { feature: "Mobile / tablet ready", sap: "Limited", jobline: "Yes — gloved hands" },
  { feature: "Shift handoff system", sap: "Custom build", jobline: "Built in" },
  { feature: "Real-time station dashboards", sap: "Add-on modules", jobline: "Live, auto-updating" },
  { feature: "AI planning assistant", sap: "Add-on", jobline: "Yes — built in" },
  { feature: "ITAR posture", sap: "Configurable, costly", jobline: "Org-level toggle + RLS" },
  { feature: "Works with SAP", sap: "—", jobline: "Yes — OAuth connector, read-through or write-through" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "SAP Alternative — JobLine.ai",
  description:
    "Looking for an SAP alternative for your machine shop? JobLine.ai is the shop-floor execution layer built for small and mid-size shops — and connects back to SAP S/4HANA when you need to.",
  url: "https://jobline.ai/compare/sap-alternative",
};

export default function SAPAlternative() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="SAP Alternative for Machine Shops — JobLine.ai"
        description="Looking for an SAP alternative? JobLine.ai gives small and mid-size machine shops real-time work-order tracking, shift handoffs, and operator-first dashboards — live in under an hour, with an SAP connector for the finance backbone."
        keywords="SAP alternative, SAP S/4HANA alternative, SAP Business One alternative, SAP PP alternative, SAP MES alternative, SAP small shop, SAP machine shop alternative, S4HANA shop floor, SAP execution layer"
        canonical="/compare/sap-alternative"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              Reconsidering an SAP rollout?
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              The SAP alternative built{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                for your shop floor — not finance
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              SAP is a world-class financial backbone. It is also wildly oversized for a 30-machine job shop. JobLine.ai
              handles shop-floor execution far better than SAP's PP / PM modules — and connects back to SAP via OAuth so
              finance keeps its source of truth.
            </p>
            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Try JobLine.ai Free <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} className="gap-2">
                <Zap className="w-5 h-5" /> See Pricing
              </Button>
            </div>

            <h2 id="cost" className="text-2xl font-bold mb-6">Why shops look for an SAP alternative</h2>
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

        <section id="implementation" className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6 text-center">SAP vs. JobLine.ai</h2>
            <div className="overflow-x-auto mb-16">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Feature</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">SAP (S/4HANA · Business One)</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">JobLine.ai</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-card/50">
                      <td className="py-3 px-4 font-medium">{row.feature}</td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <XCircle className="w-4 h-4 text-destructive flex-shrink-0" /> {row.sap}
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

            <LeadCaptureBar sourcePage="sap-alternative" className="mb-16" />

            <WhyJoblineFAQ variant="sap" />

            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20 mt-12">
              <h2 className="text-2xl font-bold mb-3">Try us on your shop before the SAP SOW lands</h2>
              <p className="text-muted-foreground mb-6">14-day free trial. Live in under an hour. Keep SAP for finance.</p>
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
