import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Calendar, Layers, Gauge, Zap } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";

const benefits = [
  "Drag-and-drop manufacturing schedules across every work center",
  "Capacity planning with 8-hour daily thresholds and load balancing",
  "Multi-operation routing with automatic next-step handoff",
  "Real-time reschedule when a job slips, breaks down, or is held",
  "Priority queues by due date, customer, or revenue value",
  "Shift-aware scheduling that respects operator availability",
  "No hardware, sensors, or MES integration required",
  "Free 14-day trial — no credit card",
];

const useCases = [
  { icon: Calendar, title: "Visual Calendar Scheduling", desc: "See every job, every work center, every shift on one screen. Reschedule with a drag." },
  { icon: Layers, title: "Multi-Operation Routing", desc: "Auto-route jobs through milling, turning, inspection, OP — each step on the right machine, in the right order." },
  { icon: Gauge, title: "Capacity & Load Balancing", desc: "8-hour daily caps per work center prevent over-promising. The system warns before you overbook." },
];

const faqs = [
  { q: "Is this for discrete or process manufacturing?", a: "Discrete — job shops, CNC machine shops, fabricators, assemblers. We schedule by work order and routing step." },
  { q: "Do I need an ERP?", a: "No. Run JobLine.ai standalone, or sync work orders from JobBOSS or SAP S/4HANA via our read-only ERP connector." },
  { q: "Can I schedule by operator and machine?", a: "Yes. Schedules respect operator certifications, shift coverage, and machine capability per work center." },
  { q: "How is this different from generic project management?", a: "Built for the shop floor: routing steps, scrap/rework accounting, downtime tracking, and ITAR/AS9100-friendly audit trails." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JobLine.ai Manufacturing Scheduling Software",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  description: "Manufacturing scheduling software for job shops and CNC machine shops. Visual scheduling, capacity planning, multi-operation routing — no hardware required.",
  url: "https://jobline.ai/features/manufacturing-scheduling-software",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free 14-day trial" },
};

export default function ManufacturingSchedulingSoftware() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Manufacturing Scheduling Software for Job Shops & CNC"
        description="Manufacturing scheduling software for job shops and CNC machine shops. Visual production scheduling, capacity planning, multi-operation routing — no hardware required. Free trial."
        keywords="manufacturing scheduling software, manufacturing scheduling, production scheduling software, job shop scheduling software, machine shop scheduling, cnc scheduling software, capacity planning software, work center scheduling, production planning software, shop scheduling software"
        canonical="/features/manufacturing-scheduling-software"
        jsonLd={jsonLd}
      />

      <MarketingNav />

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Calendar className="w-4 h-4" />
              Built for Discrete Manufacturing
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Manufacturing Scheduling Software{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                That Reflects the Floor
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Schedule jobs across every work center, balance capacity to real shift hours, and reschedule the moment a machine goes down — without re-importing spreadsheets.
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

            <LeadCaptureBar sourcePage="manufacturing-scheduling-software" className="mb-16" />

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
              <h2 className="text-2xl font-bold mb-3">Stop scheduling in spreadsheets</h2>
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
