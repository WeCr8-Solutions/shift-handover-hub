import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, AlertTriangle, BarChart3, Wrench, Activity } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockDowntimeLog } from "@/components/marketing/MockAppPreviews";

import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";

const benefits = [
  "Log downtime events with reason codes and descriptions",
  "Track planned vs. unplanned downtime per station",
  "Automatic duration calculation",
  "Resolution notes and corrective action tracking",
  "Downtime reporting by station, team, and shift",
  "Maintenance record integration",
  "Equipment condition monitoring in handoff forms",
  "Trend analysis for recurring issues",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai Downtime Tracking",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "description": "Manufacturing downtime tracking software. Log downtime events, track reason codes, analyze trends, and reduce unplanned downtime across your shop floor.",
  "url": "https://joblineai.lovable.app/features/downtime-tracking",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function DowntimeTracking() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Manufacturing Downtime Tracking Software"
        description="Track and reduce manufacturing downtime. Log events with reason codes, analyze trends, and integrate with shift handoffs and maintenance records. Built for CNC machine shops."
        keywords="downtime tracking software, manufacturing downtime, machine downtime tracking, OEE tracking, downtime reporting, equipment downtime, production downtime analysis, unplanned downtime reduction"
        canonical="/features/downtime-tracking"
        jsonLd={jsonLd}
      />

      <MarketingNav />

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Activity className="w-4 h-4" />
              Reduce Unplanned Downtime
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Downtime Tracking for{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Manufacturing
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              You can't reduce what you don't measure. JobLine.ai makes it easy to log, categorize, and analyze downtime events — so you can fix root causes and keep machines running.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")} className="gap-2">
                <Zap className="w-5 h-5" /> See It In Action
              </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 mb-16">
              {[
                { icon: AlertTriangle, title: "Log Events", desc: "Quick downtime logging with categorized reason codes and severity levels." },
                { icon: BarChart3, title: "Analyze Trends", desc: "See which machines, shifts, and reasons account for the most lost production time." },
                { icon: Wrench, title: "Fix Root Causes", desc: "Link downtime to maintenance records and corrective actions for lasting improvements." },
              ].map((f, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border text-center">
                  <f.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </div>
              ))}
            </div>

            <MockDowntimeLog />
          </div>
        </section>

        <AdPlacement format="horizontal" className="py-4" />

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Complete Downtime Visibility</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <LeadCaptureBar sourcePage="downtime-tracking" className="mb-16" />

            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <h2 className="text-2xl font-bold mb-3">Start tracking downtime today</h2>
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
