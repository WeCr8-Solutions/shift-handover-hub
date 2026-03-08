import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, Clock, BarChart3, Gauge, CheckCircle2, Zap } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockUtilizationChart } from "@/components/marketing/MockUtilizationChart";

import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { ConversionEvents } from "@/lib/analytics";

const benefits = [
  "Track run time, idle time, and setup time per machine",
  "Real-time utilization dashboards for every station",
  "Shift-over-shift production comparisons",
];

const faqs = [
  { q: "How does machine time tracking work?", a: "Operators log job start/stop and machine states through digital handoff forms. The system automatically calculates run time, setup time, and downtime per station." },
  { q: "Can I track multiple machines at once?", a: "Yes. Each station is tracked independently, and supervisors get a consolidated dashboard showing all machines in real-time." },
  { q: "Do I need sensors or IoT hardware?", a: "No. JobLine.ai is software-only—operators log status changes from any device. No hardware installation required." },
  { q: "What reports are available?", a: "Utilization reports, shift comparisons, downtime breakdowns by reason code, and OEE-style metrics are all available." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JobLine.ai Machine Time Tracking",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  description: "Track CNC machine time, utilization, and downtime with software-only manufacturing tracking. No IoT hardware required.",
  url: "https://joblineai.lovable.app/machine-time-tracking",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free trial available" },
};

export default function MachineTimeTracking() {
  const navigate = useNavigate();
  const pagePath = "/machine-time-tracking";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Machine Time Tracking Software"
        description="Track CNC machine run time, setup time, and downtime without IoT hardware. Real-time utilization dashboards for manufacturing teams. Start free."
        keywords="machine time tracking, CNC utilization tracking, machine downtime tracking, manufacturing time tracking software, OEE tracking"
        canonical={pagePath}
        jsonLd={jsonLd}
      />
      <MarketingNav />

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Clock className="w-4 h-4" />
              Software-Only Machine Tracking
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Machine Time Tracking for{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Manufacturing Teams
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Know exactly how your machines are being used—run time, setup time, and downtime—without installing sensors or IoT hardware.
            </p>

            <ul className="space-y-3 mb-10">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-4 mb-12">
              <Button size="lg" onClick={() => {
                ConversionEvents.ctaClick('start_free_trial', 'Start Free Trial', pagePath, 'hero');
                navigate("/auth");
              }} className="gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => {
                ConversionEvents.demoOpen(pagePath, 'hero_button');
                navigate("/demo");
              }} className="gap-2">
                <Zap className="w-5 h-5" /> Book a Demo
              </Button>
            </div>

            <MockUtilizationChart />

            {/* FAQ */}
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4 mb-16">
              {faqs.map((faq, i) => (
                <div key={i} className="p-4 rounded-lg bg-secondary/30">
                  <h3 className="font-medium mb-1">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>

            <LeadCaptureBar sourcePage="machine-time-tracking" className="mb-16" />

            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <h2 className="text-2xl font-bold mb-3">Ready to track your machine time?</h2>
              <p className="text-muted-foreground mb-6">Start your free trial today. No credit card required.</p>
              <Button size="lg" onClick={() => {
                ConversionEvents.ctaClick('get_started_free', 'Get Started Free', pagePath, 'bottom_cta');
                navigate("/auth");
              }} className="gap-2">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>

        
      </main>

      <MarketingFooter />
      <LeadCaptureModal />
    </div>
  );
}
