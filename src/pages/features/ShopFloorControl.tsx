import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, Layout, Settings, Radio, Clock, BarChart2 } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockShopFloorView } from "@/components/marketing/MockShopFloorView";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";

const features = [
  { icon: Radio, title: "Live Station Status Board", desc: "Every work center shows its current job, operator, run time, and status — running, idle, down, or on hold. Updated in real time by operators from the machine." },
  { icon: Settings, title: "Work Order Dispatch", desc: "Route work orders to the right work centers automatically. Operators see their queue, pull the next job, and start or pause with one tap." },
  { icon: Clock, title: "Cycle Time Monitoring", desc: "Capture actual vs. estimated cycle times per operation. Identify where your production plan breaks down before you miss a ship date." },
  { icon: Layout, title: "Floor Layout View", desc: "A visual grid of your shop floor showing every machine cell's current production state — without a SCADA system or OPC-UA server." },
  { icon: BarChart2, title: "Throughput & WIP Tracking", desc: "See work-in-process counts per routing step, average queue depth, and daily throughput — production metrics managers can act on." },
  { icon: CheckCircle2, title: "Shift Execution Control", desc: "Tie shift handoff notes directly to active jobs on the floor. Quality holds, machine issues, and operator notes travel with the work order, not a notebook." },
];

const benefits = [
  "Real-time job status at every machine — no calls across the floor",
  "Operator-paced job tracking — works the way machinists actually work",
  "Queue management: next-job priorities visible to operators",
  "Downtime events captured with reason codes and duration",
  "In-process alerts when jobs fall behind schedule",
  "Production counts vs. required counts per routing step",
  "No PLC or hardware integration required — software-only SFC",
  "Works on any phone, tablet, or shop floor kiosk display",
];

const faqs = [
  { q: "What is shop floor control (SFC) software?", a: "Shop floor control software manages the execution of production jobs on the manufacturing floor. It dispatches work orders to stations, lets operators update job status in real time, and gives supervisors live visibility into throughput, downtime, and bottlenecks." },
  { q: "How does shop floor control differ from an ERP?", a: "ERP systems manage business data — orders, billing, scheduling, and inventory — but rarely give real-time floor-level visibility. Shop floor control software closes the gap, capturing what's actually happening at each machine in the moment the work is being done." },
  { q: "Does JobLine.ai require machine connectivity or sensors?", a: "No hardware integration is required. Operators update job status from phones or tablets. For shops that want automated machine data, our Machine Connect feature integrates with MTConnect-compatible equipment." },
  { q: "Can multiple shifts use shop floor control across the same jobs?", a: "Yes. Job status, machine notes, quality flags, and priority changes carry across shifts. Incoming operators see exactly where jobs stand without relying on verbal handoffs." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai — Shop Floor Control Software",
  "applicationCategory": "BusinessApplication",
  "description": "Real-time shop floor control (SFC) software for job shops. Operator job tracking, work order dispatch, machine status visibility, and downtime monitoring.",
  "url": "https://jobline.ai/features/shop-floor-control",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function ShopFloorControl() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Shop Floor Control Software — Real-Time SFC for Job Shops"
        description="Shop floor control software that lets operators update jobs in real time, gives supervisors live machine status, and captures downtime without hardware. Built for job shops and CNC machine shops."
        keywords="shop floor control software, SFC software, production floor control, shop floor execution, SFC MES, manufacturing shop floor control, job shop SFC, real-time shop floor, shop floor visibility, production control"
        canonical="/features/shop-floor-control"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Layout className="w-4 h-4" />
              Shop Floor Control
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Shop Floor Control Software{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                That Operators Will Actually Use
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              JobLine.ai gives every machine center a live status, every operator a job queue, and every supervisor a real-time production floor view — no SCADA, no PLCs, no six-month integration project.
            </p>
            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">Start Free Trial <ArrowRight className="w-5 h-5" /></Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/demo")} className="gap-2"><Zap className="w-5 h-5" /> Book a Demo</Button>
            </div>
            <MockShopFloorView />
          </div>
        </section>
        <AdPlacement format="horizontal" className="py-4" />
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-8 text-center">Shop Floor Control Features</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {features.map((f, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <f.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
            <h2 className="text-2xl font-bold mb-6">What You Get on Day One</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-status-ok mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <LeadCaptureBar sourcePage="shop-floor-control" className="mb-16" />
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
              <h2 className="text-2xl font-bold mb-3">See your shop floor in real time — today</h2>
              <p className="text-muted-foreground mb-6">Free trial — no credit card, no IT project required.</p>
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
