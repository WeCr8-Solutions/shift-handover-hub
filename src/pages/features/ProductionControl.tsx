import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, ArrowLeft, CheckCircle2, Gauge, BarChart3, Bell, Shield } from "lucide-react";
import joblineLogo from "@/assets/jobline-logo.png";

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

      <nav className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src={joblineLogo} alt="JobLine.ai" className="h-8 w-auto" />
          </button>
          <Button onClick={() => navigate("/auth")} size="sm" className="gap-2">
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
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
            </div>

            <h2 className="text-2xl font-bold mb-6">Complete Production Visibility</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <h2 className="text-2xl font-bold mb-3">Take control of your production floor</h2>
              <p className="text-muted-foreground mb-6">Free trial — no credit card required.</p>
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Button>
      </footer>
    </div>
  );
}
