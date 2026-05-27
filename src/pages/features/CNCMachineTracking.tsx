import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, Monitor, Activity, BarChart3, Gauge, Clock } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockShopFloorView } from "@/components/marketing/MockShopFloorView";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";

const benefits = [
  "Track every CNC machine's job, operator, and status in real time",
  "Software-only — no sensors or CNC hardware integration required",
  "Machine utilization dashboards per station and shift",
  "Downtime logging with reason codes and root cause tracking",
  "Operator-reported cycle times and parts counts",
  "Shift-over-shift machine performance comparisons",
  "Works for lathes, mills, grinders, EDM, and water jet",
  "Supervisor alerts for idle machines and quality flags",
];

const useCases = [
  {
    icon: Monitor,
    title: "Live Status Board",
    desc: "Wall-mounted or supervisor display showing every CNC machine's current job, operator, and condition — updated live by operators.",
  },
  {
    icon: Activity,
    title: "Utilization Reporting",
    desc: "See how much of your paid machine time is actual run time vs. setup, idle, or downtime. Target improvement where it matters most.",
  },
  {
    icon: Gauge,
    title: "OEE Foundation",
    desc: "Operator-driven cycle time and parts count logging builds the availability and performance data needed for OEE calculations.",
  },
  {
    icon: Clock,
    title: "Shift Comparisons",
    desc: "Compare output across first, second, and third shift per machine. Identify which shifts are underperforming and why.",
  },
];

const faqs = [
  {
    q: "Do I need to connect hardware to my CNC machines?",
    a: "No. JobLine.ai is software-only. Operators log job starts, machine states, and part counts from their phone or tablet. No RS-232 cables or MTConnect adapters required.",
  },
  {
    q: "Can I track machines across multiple departments?",
    a: "Yes. Set up work centers by department — CNC turning, milling, grinding — and track machines within each independently.",
  },
  {
    q: "Does this replace MTConnect or FOCAS monitoring?",
    a: "For most shops, no deep machine integration is needed — operator-driven tracking is faster to deploy and equally effective. For shops that want automated data feeds, our Machine Connect feature adds protocol-based integration.",
  },
  {
    q: "What does it cost?",
    a: "Machine tracking is included in the core plan. Start free and upgrade as your team grows.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai CNC Machine Tracking",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "description":
    "Real-time CNC machine tracking software. Monitor machine status, utilization, downtime, and shift performance without IoT hardware. Built for machine shops and job shops.",
  "url": "https://jobline.ai/features/cnc-machine-tracking",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function CNCMachineTracking() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="CNC Machine Monitoring & Tracking Software — No Hardware"
        description="CNC machine monitoring software with no sensors required. Track CNC machine status, utilization, downtime, and bottlenecks in real time. Built for machine shops and job shops."
        keywords="CNC machine monitoring, machine monitoring software, CNC machine tracking, CNC tracking software, CNC machine utilization, CNC bottleneck, CNC downtime tracking, machine shop monitoring software, CNC production tracking, CNC job tracking"
        canonical="/features/cnc-machine-tracking"
        jsonLd={jsonLd}
      />

      <MarketingNav />

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Monitor className="w-4 h-4" />
              No Hardware Required
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              CNC Machine Tracking{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Software for Machine Shops
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Know the status of every CNC machine on your floor — current job, operator, parts count, and
              condition — in real time. No sensors, no hardware, no IT project.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/demo")} className="gap-2">
                <Zap className="w-5 h-5" /> Book a Demo
              </Button>
            </div>

            <MockShopFloorView />
          </div>
        </section>

        <AdPlacement format="horizontal" className="py-4" />

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-8 text-center">What You Can Track</h2>
            <div className="grid sm:grid-cols-2 gap-6 mb-16">
              {useCases.map((u, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <u.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{u.title}</h3>
                  <p className="text-muted-foreground text-sm">{u.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold mb-6">Full Tracking Feature List</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-status-ok mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <LeadCaptureBar sourcePage="cnc-machine-tracking" className="mb-16" />

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
              <h2 className="text-2xl font-bold mb-3">Start tracking your machines today</h2>
              <p className="text-muted-foreground mb-6">
                Free trial — no hardware required, .
              </p>
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
