import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Activity, Monitor, AlertTriangle, Zap } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";

const benefits = [
  "Live machine status — running, setup, idle, down — across every station",
  "Operator-driven monitoring delivers 90%+ accuracy without IoT sensors",
  "Optional MTConnect / FOCAS feed via our VS Code DNC relay",
  "Downtime reason codes with bottleneck rollups",
  "Shift-over-shift utilization comparisons",
  "Supervisor alerts when a machine idles past threshold",
  "Works for CNC mills, lathes, grinders, EDM, water jet, Swiss",
  "Free 14-day trial — no credit card",
];

const useCases = [
  { icon: Monitor, title: "Live Status Board", desc: "Wall-mounted display of every machine's current job, operator, and condition — updated by operator check-ins or relay." },
  { icon: Activity, title: "Utilization Reporting", desc: "Run time vs. setup vs. idle vs. downtime per shift. Target improvement where it matters most." },
  { icon: AlertTriangle, title: "Bottleneck Detection", desc: "Surface the work centers that gate throughput, with reason-coded downtime to fix root causes." },
];

const faqs = [
  { q: "Do I need MTConnect, FOCAS, or OPC-UA?", a: "No. Operator-driven monitoring covers 90%+ of utilization tracking. If you want protocol-based feeds, our VS Code DNC extension streams machine status over WebSocket." },
  { q: "Does this replace a dedicated machine monitoring platform?", a: "For most shops under 50 machines, yes. For larger fleets we complement existing platforms by capturing the operator-visible state your sensors can't see (setup intent, hold reasons, tool issues)." },
  { q: "How fast is deployment?", a: "Same day for software-only tracking. Protocol-based monitoring takes a few hours per controller once the relay machine is on the network." },
  { q: "What does it cost?", a: "Included in the core plan. Start free." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JobLine.ai Machine Monitoring Software",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  description: "Machine monitoring software for CNC machine shops and job shops. Live status, utilization, downtime, and bottleneck detection — no IoT sensors required.",
  url: "https://jobline.ai/features/machine-monitoring-software",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free 14-day trial" },
};

export default function MachineMonitoringSoftware() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Machine Monitoring Software — CNC Live Status & Utilization"
        description="Machine monitoring software for CNC machine shops. Live status, utilization, downtime, and bottleneck detection — no sensors required. Optional MTConnect/FOCAS feed. Free trial."
        keywords="machine monitoring software, cnc machine monitoring, cnc monitoring software, machine monitoring system, manufacturing machine monitoring, cnc utilization software, real-time machine monitoring, oee monitoring software, machine status software, cnc bottleneck"
        canonical="/features/machine-monitoring-software"
        jsonLd={jsonLd}
      />

      <MarketingNav />

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Activity className="w-4 h-4" />
              Software-Only or Protocol-Based
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Machine Monitoring Software{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                For Real Shops
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              See every CNC machine's live status, utilization, and downtime — without buying sensors. Optional MTConnect/FOCAS relay when you want it.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/demo")} className="gap-2">
                <Zap className="w-5 h-5" /> Book a Demo
              </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 mb-16">
              {useCases.map((u, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <u.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{u.title}</h3>
                  <p className="text-muted-foreground text-sm">{u.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold mb-6">What's Included</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-status-ok mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <LeadCaptureBar sourcePage="machine-monitoring-software" className="mb-16" />

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
              <h2 className="text-2xl font-bold mb-3">See your machines in real time</h2>
              <p className="text-muted-foreground mb-6">Free trial — no hardware required.</p>
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
