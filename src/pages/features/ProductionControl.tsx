import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, Activity, BarChart3, AlertTriangle, TrendingUp } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockProductionMetrics } from "@/components/marketing/MockProductionMetrics";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";

const benefits = [
  "Real-time station status monitoring",
  "Production analytics and dashboards",
  "Quality alert escalation",
  "Scrap and rework tracking",
  "Cycle time monitoring",
  "Downtime tracking and reporting",
  "Operator performance insights",
  "Continuous improvement submissions",
];

const highlights = [
  { icon: Activity, title: "Live Station Monitoring", desc: "See every machine's status, current job, and operator in real-time from any device." },
  { icon: BarChart3, title: "Production Dashboards", desc: "Visual analytics for throughput, scrap rates, cycle times, and shift comparisons." },
  { icon: AlertTriangle, title: "Quality Escalation", desc: "Automatic alerts when quality holds are triggered. Supervisors get notified instantly." },
  { icon: TrendingUp, title: "Continuous Improvement", desc: "Operators submit improvement ideas directly from the floor. Track adoption and impact." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai Production Control",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "description": "Production control software for manufacturing. Real-time monitoring, quality tracking, analytics dashboards, and continuous improvement tools for the shop floor.",
  "url": "https://joblineai.lovable.app/features/production-control",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function ProductionControl() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Production Control Software for Manufacturing"
        description="Production control software with real-time monitoring, quality tracking, analytics dashboards, and continuous improvement tools. Built for CNC and manufacturing operations."
        keywords="production control software, manufacturing control, production monitoring, shop floor control, manufacturing analytics, production tracking, quality control manufacturing, MES software"
        canonical="/features/production-control"
        jsonLd={jsonLd}
      />

      <MarketingNav />

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Activity className="w-4 h-4" />
              Real-Time Production Visibility
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Production Control for{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                the Shop Floor
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Monitor production in real-time, track quality, and drive continuous improvement — all from a single platform built for manufacturing.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")} className="gap-2">
                <Zap className="w-5 h-5" /> See It In Action
              </Button>
            </div>

            <h2 className="text-2xl font-bold mb-6">Take Control of Your Production Floor</h2>
            <div className="grid sm:grid-cols-2 gap-6 mb-16">
              {highlights.map((h, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <h.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{h.title}</h3>
                  <p className="text-muted-foreground text-sm">{h.desc}</p>
                </div>
              ))}
            </div>

            <MockProductionMetrics />
          </div>
        </section>

        <AdPlacement format="horizontal" className="py-4" />

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Complete Production Visibility</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <LeadCaptureBar sourcePage="production-control" className="mb-16" />

            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <h2 className="text-2xl font-bold mb-3">Take control of your production floor</h2>
              <p className="text-muted-foreground mb-6">Free trial — no credit card required.</p>
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
