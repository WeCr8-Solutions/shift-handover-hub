import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, Gauge, AlertTriangle, Timer, TrendingUp, BarChart3, Settings } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockUtilizationChart } from "@/components/marketing/MockUtilizationChart";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";

const features = [
  { icon: Gauge, title: "OEE Dashboard", desc: "Overall Equipment Effectiveness calculated automatically from operator-entered job data. Availability, Performance, and Quality scores per machine — updated each shift." },
  { icon: Timer, title: "Downtime Tracking & Reason Codes", desc: "Operators log downtime events with reason codes (breakdown, setup, wait for material, quality hold). See which reasons are costing you the most capacity." },
  { icon: TrendingUp, title: "Machine Utilization by Shift", desc: "See utilization rates per machine, per shift, and per work center. Identify your bottleneck stations and your chronically underused capacity." },
  { icon: AlertTriangle, title: "Downtime Alerts", desc: "Real-time alerts when a machine has been idle longer than a configurable threshold. Supervisors know about capacity losses while there's still time to recover." },
  { icon: BarChart3, title: "OEE Trend Reports", desc: "Track OEE improvement over weeks and months. Compare before/after process changes and justify capital investment with actual performance data." },
  { icon: Settings, title: "Performance vs. Planned Cycle Time", desc: "Capture the Performance component of OEE by comparing actual cycle time to rated cycle time per operation — identifying where machines are running below their potential." },
];

const benefits = [
  "OEE calculated automatically — no manual spreadsheet formulas",
  "Availability, Performance, and Quality components tracked separately",
  "Downtime events tagged by reason for root cause analysis",
  "Machine-level utilization rates by shift and by week",
  "Unplanned downtime alerts while event is in progress",
  "OEE trend charts to measure continuous improvement efforts",
  "Quality losses (scrap, rework) tied back to machine and shift",
  "No hardware sensors required — operator-logged data is sufficient",
];

const oeeFormula = [
  { label: "Availability", formula: "Actual Run Time ÷ Planned Production Time", desc: "Losses from breakdowns, changeovers, and unplanned stops" },
  { label: "Performance", formula: "Actual Output ÷ Theoretical Maximum Output", desc: "Losses from slow cycles, minor stoppages, and speed losses" },
  { label: "Quality", formula: "Good Parts ÷ Total Parts Produced", desc: "Losses from scrap, rework, and first-article rejections" },
];

const faqs = [
  { q: "What is OEE and why does it matter for job shops?", a: "OEE (Overall Equipment Effectiveness) measures how effectively a manufacturing machine is being used. It combines three factors: Availability (is the machine running when planned?), Performance (is it running at rated speed?), and Quality (are parts coming out good?). World-class manufacturing targets 85% OEE. Most job shops run at 50–65% — meaning huge untapped capacity already on the floor." },
  { q: "How does JobLine.ai calculate OEE without machine sensors?", a: "Operators log job start/stop times, part counts, and downtime events from their phones or tablets. JobLine.ai uses that data to calculate availability and performance components. Quality data comes from in-process inspection logs and scrap entries. No MTConnect, OPC-UA, or PLC integration required — though we support those for shops that want automated data." },
  { q: "What's a good OEE score for a job shop?", a: "World-class manufacturers aim for 85%+, but that benchmark assumes high-volume production. For high-mix job shops, 65–75% OEE is a realistic target given frequent changeovers and varied part complexity. The value is in trending improvements, not achieving a specific number." },
  { q: "Can I track OEE by machine, shift, or operator?", a: "Yes. OEE can be sliced by machine, work center, shift, day, week, or month. You can also see which operators or shifts have different performance characteristics — a useful input for training and process improvement." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai — OEE Software",
  "applicationCategory": "BusinessApplication",
  "description": "OEE tracking software for job shops and machine shops. Track Overall Equipment Effectiveness, machine utilization, downtime, and quality losses without hardware sensors.",
  "url": "https://jobline.ai/features/oee-software",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function OeeSoftware() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="OEE Software for Job Shops — Overall Equipment Effectiveness Tracking"
        description="OEE software for manufacturers. Track Overall Equipment Effectiveness, machine utilization, downtime reasons, and quality losses per shift — without hardware sensors or PLCs. Built for job shops."
        keywords="OEE software, OEE tracking software, overall equipment effectiveness software, OEE manufacturing, OEE calculation tool, machine utilization software, downtime tracking manufacturing, OEE dashboard, OEE for job shops, manufacturing OEE tool"
        canonical="/features/oee-software"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Gauge className="w-4 h-4" />
              OEE Tracking
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              OEE Software for Manufacturers{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Without the $80K Sensor Project
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              JobLine.ai calculates Overall Equipment Effectiveness from operator-entered job data — no PLCs, no edge hardware, no OPC-UA server. Get OEE, utilization, and downtime insights for every machine starting today.
            </p>
            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">Start Free <ArrowRight className="w-5 h-5" /></Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/demo")} className="gap-2"><Zap className="w-5 h-5" /> Book a Demo</Button>
            </div>
            <MockUtilizationChart />
          </div>
        </section>
        <AdPlacement format="horizontal" className="py-4" />
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-4 text-center">OEE = Availability × Performance × Quality</h2>
            <p className="text-center text-muted-foreground mb-8">JobLine.ai tracks all three components automatically from your production data.</p>
            <div className="grid sm:grid-cols-3 gap-4 mb-16">
              {oeeFormula.map((o, i) => (
                <div key={i} className="p-5 rounded-xl bg-card border border-border text-center">
                  <div className="text-lg font-bold text-primary mb-1">{o.label}</div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">{o.formula}</div>
                  <p className="text-sm text-muted-foreground">{o.desc}</p>
                </div>
              ))}
            </div>
            <h2 className="text-2xl font-bold mb-8 text-center">OEE Features</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {features.map((f, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <f.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
            <h2 className="text-2xl font-bold mb-6">What OEE Tracking Delivers</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-status-ok mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <LeadCaptureBar sourcePage="oee-software" className="mb-16" />
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
              <h2 className="text-2xl font-bold mb-3">Start measuring OEE this week</h2>
              <p className="text-muted-foreground mb-6">Free trial — no hardware installation required.</p>
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
