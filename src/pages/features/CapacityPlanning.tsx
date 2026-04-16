import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, CalendarDays, BarChart3, Clock, Users, AlertCircle, Layers } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockScheduleCalendar } from "@/components/marketing/MockScheduleCalendar";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";

const features = [
  { icon: Layers, title: "Work Center Load View", desc: "See the total scheduled hours against available capacity per work center — day by day. Spot overloaded cells before they cause late deliveries." },
  { icon: CalendarDays, title: "Job Scheduling Board", desc: "Drag jobs across the scheduling board to align production with due dates and machine availability. Adjustments flow through to operator queues instantly." },
  { icon: Users, title: "Operator Capacity Planning", desc: "Plan workload against available headcount per shift. See when a work center is scheduled beyond operator availability for the day." },
  { icon: AlertCircle, title: "Capacity Conflict Alerts", desc: "Automatic flags when scheduled work exceeds a work center's available hours for a given day or shift — before production starts, not after it fails." },
  { icon: BarChart3, title: "Utilization vs. Capacity Reports", desc: "Compare scheduled utilization against theoretical capacity over weeks and months. Decide when to add a machine, add a shift, or offload work." },
  { icon: Clock, title: "Lead Time Visibility", desc: "Calculate estimated completion dates based on current queue depth and work center availability — not just planned cycle times." },
];

const benefits = [
  "See open capacity vs. scheduled load per work center",
  "Stop quoting lead times you can't actually meet",
  "Catch scheduling conflicts before jobs go to the floor",
  "Drag-and-drop job scheduling board for quick adjustments",
  "Operator headcount factored into capacity calculations",
  "Week-ahead and month-ahead capacity views",
  "Lead time estimates based on current queue depth",
  "Historical data shows actual vs. planned capacity vs. utilization",
];

const faqs = [
  { q: "What is manufacturing capacity planning software?", a: "Capacity planning software shows you the scheduled production workload on each work center versus the available hours for those machines and operators. It helps you answer: Can we take on this new job? Will we hit these ship dates? Where is our bottleneck this week?" },
  { q: "How is capacity planning different from production scheduling?", a: "Production scheduling assigns specific jobs to specific time slots. Capacity planning zooms out to ask whether your work centers have the total available hours to meet all the scheduled jobs in a window. Both are needed — planning first, then scheduling." },
  { q: "Does JobLine.ai handle finite capacity scheduling?", a: "JobLine.ai provides a constraint-aware scheduling board that accounts for work center hours and operator availability. It's an approachable capacity view designed for job shops — not a complex finite capacity optimizer that requires a PhD to configure." },
  { q: "Can I see capacity across multiple work centers at once?", a: "Yes. The capacity planning view shows all work centers on a single dashboard — their scheduled hours, available hours, and utilization percentage — so you can see bottleneck stations at a glance." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai — Capacity Planning Software",
  "applicationCategory": "BusinessApplication",
  "description": "Manufacturing capacity planning software for job shops. See work center load vs. available hours, schedule jobs around real capacity, and catch conflicts before they cause late deliveries.",
  "url": "https://jobline.ai/features/capacity-planning",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function CapacityPlanning() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Capacity Planning Software for Manufacturers — Job Shop Scheduling"
        description="Capacity planning software for job shops and machine shops. See scheduled load vs. available hours per work center. Catch overloads before they cause late deliveries. No complex setup required."
        keywords="capacity planning software manufacturing, production capacity planning, manufacturing capacity planning tool, shop capacity scheduling, work center capacity planning, capacity planning job shop, manufacturing capacity software, production planning tool, job shop scheduling software, capacity vs load manufacturing"
        canonical="/features/capacity-planning"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <CalendarDays className="w-4 h-4" />
              Capacity Planning
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Capacity Planning Software for{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Shops Tired of Promising What They Can't Deliver
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              JobLine.ai shows you scheduled workload vs. available capacity per work center — so you stop quoting lead times you can't meet and start promising delivery dates you can actually hit.
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
            <h2 className="text-2xl font-bold mb-8 text-center">Capacity Planning Features</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {features.map((f, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <f.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
            <h2 className="text-2xl font-bold mb-6">What Capacity Planning Delivers</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-status-ok mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <LeadCaptureBar sourcePage="capacity-planning" className="mb-16" />
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
              <h2 className="text-2xl font-bold mb-3">See your actual capacity vs. scheduled load today</h2>
              <p className="text-muted-foreground mb-6">Free trial — no IT project required.</p>
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
