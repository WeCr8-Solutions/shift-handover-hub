import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, ArrowLeft, CheckCircle2, Zap, Target, TrendingUp, Eye, AlertTriangle, Clock, Route } from "lucide-react";
import joblineLogo from "@/assets/jobline-logo.png";

const benefits = [
  "Real-time production visibility across all stations",
  "Automated bottleneck detection and alerts",
  "Priority-based work order queue management",
  "Multi-step routing coordination with outside processing",
  "Shift-to-shift continuity with digital handoffs",
  "Quality hold escalation and tracking",
  "Material availability monitoring",
  "Downtime tracking and root cause analysis",
];

const useCases = [
  { icon: Eye, title: "Full Floor Visibility", desc: "See every station, operator, and job status at a glance. No more walking the floor to find answers." },
  { icon: AlertTriangle, title: "Proactive Problem Detection", desc: "Get alerted when jobs fall behind, machines go down, or quality issues arise — before they cascade." },
  { icon: Route, title: "Routing Coordination", desc: "Track jobs through multi-operation routing including outside processing. Know exactly where every part is." },
  { icon: Clock, title: "On-Time Delivery Tracking", desc: "Monitor due dates, identify at-risk orders, and prioritize accordingly to keep customers happy." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai Digital Expeditor",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "description": "Digital expeditor software for manufacturing. Real-time production visibility, bottleneck detection, routing coordination, and on-time delivery tracking for machine shops.",
  "url": "https://joblineai.lovable.app/features/digital-expeditor",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "featureList": benefits,
};

export default function DigitalExpeditor() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Digital Expeditor Software for Manufacturing"
        description="Replace clipboard-carrying expeditors with real-time digital production visibility. Track every job, station, and operator across your shop floor. Built for CNC machine shops."
        keywords="digital expeditor, manufacturing expeditor software, production expeditor, shop floor visibility, manufacturing oversight, production monitoring, expediting software, job tracking manufacturing"
        canonical="/features/digital-expeditor"
        jsonLd={jsonLd}
      />

      <nav className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src={joblineLogo} alt="JobLine.ai" className="h-8 w-auto" />
          </button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/pricing")}>Pricing</Button>
            <Button onClick={() => navigate("/auth")} size="sm" className="gap-2">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Target className="w-4 h-4" />
              Production Oversight Reimagined
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              The Digital Expeditor for{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Modern Manufacturing
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Stop walking the floor with a clipboard. JobLine.ai gives you instant visibility into every job, machine, and operator — from anywhere, on any device.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")} className="gap-2">
                <Zap className="w-5 h-5" /> Try Interactive Demo
              </Button>
            </div>

            <h2 className="text-2xl font-bold mb-6">Why Shops Are Going Digital</h2>
            <div className="grid sm:grid-cols-2 gap-6 mb-16">
              {useCases.map((uc, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <uc.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{uc.title}</h3>
                  <p className="text-muted-foreground text-sm">{uc.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold mb-6">Everything You Need to Expedite Digitally</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="p-8 rounded-2xl bg-secondary/30 border border-border mb-16">
              <h2 className="text-xl font-bold mb-3">📊 The Cost of Manual Expediting</h2>
              <p className="text-muted-foreground mb-4">
                Manufacturing shops spend an average of 2-4 hours per shift on manual expediting — walking the floor, 
                making phone calls, and updating whiteboards. That's $50K-$100K per year in lost productivity per expeditor.
              </p>
              <p className="text-foreground font-medium">
                JobLine.ai replaces the clipboard with real-time digital oversight in under 5 minutes.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <h2 className="text-2xl font-bold mb-3">Ready to digitize your expediting?</h2>
              <p className="text-muted-foreground mb-6">Free trial — no credit card required. Set up in under 5 minutes.</p>
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4 flex flex-wrap justify-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>Home</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/features/shift-handoff-software")}>Shift Handoffs</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/features/work-order-tracking")}>Work Orders</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/features/production-scheduling")}>Scheduling</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/pricing")}>Pricing</Button>
        </div>
      </footer>
    </div>
  );
}
