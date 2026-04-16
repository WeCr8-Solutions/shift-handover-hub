import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, Wrench, CalendarClock, AlertTriangle, BarChart2, History, Settings } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockDowntimeLog } from "@/components/marketing/MockDowntimeLog";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";

const features = [
  { icon: CalendarClock, title: "PM Schedule by Hours or Calendar", desc: "Set preventive maintenance triggers based on machine run hours, calendar intervals (weekly, monthly, quarterly), or production counts. PMs auto-generate when the threshold is reached." },
  { icon: AlertTriangle, title: "Upcoming PM Alerts", desc: "Supervisors and maintenance staff receive advance notice before a PM is due — so maintenance can be scheduled during planned downtime, not discovered mid-production." },
  { icon: Wrench, title: "Work Order Integration", desc: "PM tasks generate maintenance work orders that appear alongside production work orders. Maintenance technicians complete PM checklists and close orders with sign-off." },
  { icon: History, title: "Maintenance History Log", desc: "Every PM, breakdown repair, and inspection event is logged to the machine record. Full maintenance history available for audits, warranty claims, and capital replacement decisions." },
  { icon: BarChart2, title: "Downtime vs. PM Correlation", desc: "See whether machines with overdue PMs have higher unplanned downtime rates. Make the business case for preventive maintenance with your own production data." },
  { icon: Settings, title: "Machine Asset Registry", desc: "Maintain a digital record of every machine: model, serial number, purchase date, PM schedule, and maintenance history — all in one place, accessible from any device." },
];

const benefits = [
  "PM schedules based on run hours, calendar intervals, or cycles",
  "Advance notifications before PMs are due — not after",
  "Maintenance work orders with digital checklists and sign-off",
  "Full maintenance history per machine for audits and decisions",
  "Downtime events linked to machine records for trend analysis",
  "Machine asset registry with specs, warranty, and PM history",
  "Overdue PM alerts with supervisor escalation",
  "No separate CMMS required — integrated with production tracking",
];

const faqs = [
  { q: "What is preventive maintenance software for manufacturing?", a: "Preventive maintenance (PM) software schedules and tracks planned maintenance tasks on production equipment. It replaces paper logs and manual reminder systems with automated PM schedules, digital checklists, and maintenance history records — reducing unplanned breakdowns and extending machine life." },
  { q: "How is preventive maintenance different from reactive maintenance?", a: "Reactive maintenance (\"run to failure\") addresses breakdowns after they happen. Preventive maintenance addresses the causes of failures before they occur — through scheduled inspections, lubrication, calibration, and part replacement. PM reduces unplanned downtime, often by 25–40% in job shop environments." },
  { q: "Does JobLine.ai require separate CMMS software for maintenance?", a: "No. JobLine.ai includes maintenance tracking as part of the shop floor management platform — so PM schedules, downtime logs, and production data all live in one system. Shops that need enterprise CMMS features (detailed parts/labor costing, predictive maintenance) may need a dedicated CMMS alongside JobLine.ai." },
  { q: "Can operators log machine breakdowns during production?", a: "Yes. Operators tap to log a breakdown event with a reason code, and the machine is flagged as unavailable in the production dashboard. Maintenance is notified, and the downtime event is recorded with duration and cause — feeding OEE and PM correlation reports." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai — Preventive Maintenance Software",
  "applicationCategory": "BusinessApplication",
  "description": "Preventive maintenance software for manufacturing. Schedule PMs by run hours or calendar, track maintenance history, and reduce unplanned machine downtime.",
  "url": "https://jobline.ai/features/preventive-maintenance",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function PreventiveMaintenance() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Preventive Maintenance Software for Manufacturing — Machine PM Tracking"
        description="Preventive maintenance software for job shops and machine shops. Schedule PMs by run hours or intervals, get advance alerts, track maintenance history, and reduce unplanned machine downtime."
        keywords="preventive maintenance software manufacturing, PM software machine shop, equipment maintenance tracking, CNC machine maintenance software, preventive maintenance manufacturing, machine PM scheduling, CMMS for job shops, manufacturing maintenance software, machine downtime tracking, preventive maintenance software"
        canonical="/features/preventive-maintenance"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Wrench className="w-4 h-4" />
              Preventive Maintenance
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Preventive Maintenance Software for{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Shops That Can't Afford Surprise Breakdowns
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              JobLine.ai tracks PM schedules by run hours or calendar intervals, alerts your team before machines are due, and logs every maintenance event to a permanent machine history — all alongside your production data.
            </p>
            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">Start Free <ArrowRight className="w-5 h-5" /></Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/demo")} className="gap-2"><Zap className="w-5 h-5" /> Book a Demo</Button>
            </div>
            <MockDowntimeLog />
          </div>
        </section>
        <AdPlacement format="horizontal" className="py-4" />
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-8 text-center">Preventive Maintenance Features</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {features.map((f, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <f.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
            <h2 className="text-2xl font-bold mb-6">What PM Software Delivers</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-status-ok mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <LeadCaptureBar sourcePage="preventive-maintenance" className="mb-16" />
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
              <h2 className="text-2xl font-bold mb-3">Stop reacting to breakdowns — start preventing them</h2>
              <p className="text-muted-foreground mb-6">Free trial �.</p>
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
