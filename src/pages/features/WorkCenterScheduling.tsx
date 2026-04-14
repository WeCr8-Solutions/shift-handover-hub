import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, Layers, CalendarDays, Clock, AlertCircle, Users, BarChart2 } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockScheduleCalendar } from "@/components/marketing/MockScheduleCalendar";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";

const features = [
  { icon: Layers, title: "Work Center Queue Management", desc: "Every work center has a live job queue showing priority, due date, estimated run time, and current operator assignment. Adjust priority with a drag or a tap." },
  { icon: CalendarDays, title: "Operation-Level Scheduling", desc: "Schedule individual routing operations to specific work centers and dates. See the cascading effect of schedule changes across downstream operations." },
  { icon: Clock, title: "Setup Time Planning", desc: "Include setup and changeover time in work center scheduling. Avoid scheduling conflicts where a machine can't run two jobs at once given teardown and setup requirements." },
  { icon: AlertCircle, title: "Late Operation Alerts", desc: "When actual production falls behind the scheduled operation date, supervisors are alerted — with enough lead time to expedite, reassign, or adjust the downstream schedule." },
  { icon: Users, title: "Operator Assignment by Work Center", desc: "Assign operators to specific work centers per shift. See scheduling gaps when work is planned at a work center with no scheduled operator coverage." },
  { icon: BarChart2, title: "Work Center Utilization Forecast", desc: "See scheduled hours against available capacity per work center over the planning horizon — a week, two weeks, or a month — so capacity constraints are visible before production surprises you." },
];

const benefits = [
  "Queue view per work center — priority, due date, operator",
  "Operation-level scheduling with cascading date logic",
  "Setup and changeover time included in scheduling",
  "Late operation alerts before shipments are at risk",
  "Operator assignment tracking per work center per shift",
  "Capacity utilization forecast by week and month",
  "Reschedule entire work orders or individual operations",
  "Multi-cell shops: all work centers visible from one screen",
];

const faqs = [
  { q: "What is work center scheduling software?", a: "Work center scheduling software assigns production operations to specific machines or work centers with planned start/end dates and operator assignments. It gives production planners visibility into queue depth, capacity constraints, and due-date feasibility across the entire shop floor." },
  { q: "How is work center scheduling different from job scheduling?", a: "Job scheduling assigns completion dates to entire jobs. Work center scheduling goes deeper — breaking jobs into routing operations and assigning each operation to a specific machine on a specific date. This level of detail is necessary for managing shared work centers with multiple competing jobs." },
  { q: "Does JobLine.ai handle multi-operation routing?", a: "Yes. Work orders can have multi-step routings (e.g., saw → turn → mill → grind → inspect), with each operation scheduled at a specific work center. The system tracks each operation's status independently and alerts when any operation falls behind schedule." },
  { q: "Can I see all work centers on one scheduling screen?", a: "Yes. The work center scheduling board shows all active work centers in a single view — with their current queue, scheduled load, and any overdue or at-risk operations flagged visually. You can drill into any work center for full operation detail." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai — Work Center Scheduling Software",
  "applicationCategory": "BusinessApplication",
  "description": "Work center scheduling software for job shops. Manage queue depth, assign operations to machines, plan capacity, and alert supervisors to at-risk operations before ship dates are missed.",
  "url": "https://jobline.ai/features/work-center-scheduling",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function WorkCenterScheduling() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Work Center Scheduling Software for Job Shops — CNC Machine Scheduling"
        description="Work center scheduling software for job shops and machine shops. Manage queues, assign operations to CNC work centers, plan capacity, and alert supervisors to late operations before ship dates are at risk."
        keywords="work center scheduling software, CNC work center software, work center capacity planning, machine scheduling software, job shop work center scheduling, operation scheduling software, production scheduling job shop, CNC scheduling software, work center queue management, manufacturing scheduling"
        canonical="/features/work-center-scheduling"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Layers className="w-4 h-4" />
              Work Center Scheduling
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Work Center Scheduling Software for{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Shops Managing Multiple Competing Priorities
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              JobLine.ai assigns routing operations to specific work centers with due dates and operator coverage — giving production planners the visibility to juggle priorities, catch capacity constraints, and keep jobs on schedule.
            </p>
            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">Start Free <ArrowRight className="w-5 h-5" /></Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/demo")} className="gap-2"><Zap className="w-5 h-5" /> Book a Demo</Button>
            </div>
            <MockScheduleCalendar />
          </div>
        </section>
        <AdPlacement format="horizontal" className="py-4" />
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-8 text-center">Work Center Scheduling Features</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {features.map((f, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <f.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
            <h2 className="text-2xl font-bold mb-6">What Work Center Scheduling Delivers</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-status-ok mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <LeadCaptureBar sourcePage="work-center-scheduling" className="mb-16" />
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
              <h2 className="text-2xl font-bold mb-3">Schedule your work centers — not just your jobs</h2>
              <p className="text-muted-foreground mb-6">Free trial — no credit card required.</p>
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
