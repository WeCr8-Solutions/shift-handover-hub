import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, Cpu, BarChart3, Activity, FileText, Shield, Users } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockShopFloorView } from "@/components/marketing/MockShopFloorView";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";

const benefits = [
  "Work order routing and real-time status at every station",
  "Operator-driven job tracking — no manual data entry by supervisors",
  "Structured shift handoffs with digital sign-off",
  "In-process quality checks and inspection gates",
  "Machine downtime logging with reason codes",
  "Production dashboards: throughput, scrap, and cycle times",
  "Material and lot traceability through routing steps",
  "Role-based access for operators, supervisors, and owners",
  "Cloud-native — no server, no IT project",
  "Mobile-first for shop floor phones and tablets",
];

const mesCoreModules = [
  { icon: Cpu, title: "Work Order Management", desc: "Create, route, and track work orders through every operation. Operators update status from the machine — no supervisor required." },
  { icon: Activity, title: "Real-Time Production Monitoring", desc: "Live dashboards show every station's current job, operator, and condition. No polling, no refresh — always current." },
  { icon: FileText, title: "Electronic Shift Handoffs", desc: "Replace verbal and notebook handoffs with structured digital forms capturing machine condition, part counts, and quality notes." },
  { icon: BarChart3, title: "OEE & Analytics", desc: "Utilization, downtime, cycle time, and scrap data collected at the source — compiled into actionable production analytics." },
  { icon: Shield, title: "Quality & Compliance", desc: "In-process dimension checks, NCR tracking, and first article inspection workflows built into routing steps." },
  { icon: Users, title: "Team & Shift Management", desc: "Multi-shift coordination with role-based views, supervisor alerts, and team-level performance tracking." },
];

const faqs = [
  { q: "What is a Manufacturing Execution System (MES)?", a: "A Manufacturing Execution System bridges the gap between shop floor operations and business management systems. It tracks work orders in real time, monitors machine status, captures quality data, and manages shift handoffs — giving manufacturers live visibility into what's happening on the floor." },
  { q: "How is JobLine.ai different from traditional MES software?", a: "Traditional MES systems (like Rockwell's FactoryTalk or Siemens Opcenter) are enterprise products requiring months of implementation, IT infrastructure, and significant capital investment. JobLine.ai delivers the core MES capabilities that job shops and mid-size manufacturers actually use — live in under an hour, at a fraction of the cost." },
  { q: "Do I need hardware or sensors to use JobLine.ai as an MES?", a: "No. JobLine.ai is a software-only MES. Operators log machine state, job status, and quality data from phones and tablets. No MTConnect adapters or PLC integrations required — though our Machine Connect feature adds those for shops that want automated data feeds." },
  { q: "Does JobLine.ai integrate with ERP systems?", a: "JobLine.ai is designed to complement ERP systems, not replace them. Use your ERP for quoting and accounting; use JobLine.ai for the real-time shop floor execution layer your ERP can't see." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai — Manufacturing Execution System (MES)",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "description": "Lightweight manufacturing execution system (MES) for job shops and small manufacturers. Real-time work order routing, shift handoffs, quality tracking, and production analytics — live in under an hour.",
  "url": "https://jobline.ai/features/mes-software",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function MesSoftware() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="MES Software for Job Shops — Lightweight Manufacturing Execution System"
        description="Manufacturing Execution System (MES) built for job shops and small manufacturers. Real-time work order tracking, shift handoffs, quality gates, and production analytics — without the enterprise complexity or six-figure price tag."
        keywords="MES software, manufacturing execution system, MES for small manufacturers, lightweight MES, job shop MES, MES software manufacturers, manufacturing execution system software, MES platform, shop floor MES, simple MES software"
        canonical="/features/mes-software"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Cpu className="w-4 h-4" />
              Manufacturing Execution System (MES)
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              MES Software for{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Job Shops That Can't Wait 18 Months
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              JobLine.ai is a lightweight manufacturing execution system designed for high-mix manufacturers, job shops, and machine shops. Get the real-time shop floor visibility of an MES — without the enterprise budget, IT team, or implementation timeline.
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
            <h2 className="text-2xl font-bold mb-8 text-center">Core MES Modules — Out of the Box</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {mesCoreModules.map((m, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <m.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{m.title}</h3>
                  <p className="text-muted-foreground text-sm">{m.desc}</p>
                </div>
              ))}
            </div>
            <h2 className="text-2xl font-bold mb-6">Full MES Feature List</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-status-ok mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <LeadCaptureBar sourcePage="mes-software" className="mb-16" />
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
              <h2 className="text-2xl font-bold mb-3">Your MES — live today, not next year</h2>
              <p className="text-muted-foreground mb-6">Free trial — no IT project, no consultants.</p>
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
