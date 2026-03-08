import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, Calendar, ListOrdered, Route, Clock } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockScheduleCalendar } from "@/components/marketing/MockScheduleCalendar";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";

const benefits = [
  "Visual calendar and Kanban scheduling",
  "Priority queue with due date tracking",
  "Multi-operation routing sequences",
  "Station capacity planning",
  "Shift-aware scheduling",
  "Real-time progress from operators",
  "Bottleneck identification",
  "Schedule export for production meetings",
];

const highlights = [
  { icon: Calendar, title: "Visual Scheduling", desc: "Drag and drop jobs on a calendar. See your entire production schedule at a glance with color-coded priorities." },
  { icon: ListOrdered, title: "Smart Priority Queue", desc: "Automatically surface the most urgent jobs. Due dates, customer priority, and routing complexity all factored in." },
  { icon: Route, title: "Routing Sequences", desc: "Define multi-step operations for each job. Track progress through every station from first op to final inspection." },
  { icon: Clock, title: "Shift-Aware Planning", desc: "Schedule capacity by shift. See which stations have bandwidth and where bottlenecks will form." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai Production Scheduling",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "description": "Production scheduling software for manufacturing. Visual scheduling with calendar views, priority queues, and multi-operation routing for CNC machine shops.",
  "url": "https://joblineai.lovable.app/features/production-scheduling",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function ProductionScheduling() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Production Scheduling Software for Manufacturing"
        description="Production scheduling software for CNC machine shops. Visual calendar scheduling, priority queues, multi-operation routing, and real-time shop floor updates."
        keywords="production scheduling software, manufacturing scheduling, shop scheduling software, production planning, manufacturing planning software, job shop scheduling, CNC scheduling"
        canonical="/features/production-scheduling"
        jsonLd={jsonLd}
      />

      <MarketingNav />

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Calendar className="w-4 h-4" />
              Visual Production Planning
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Production Scheduling for{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Manufacturing
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Plan and schedule production with visual tools built for job shops. Calendar views, priority queues, and routing — all in one platform.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")} className="gap-2">
                <Zap className="w-5 h-5" /> Try Interactive Demo
              </Button>
            </div>

            <h2 className="text-2xl font-bold mb-6">Scheduling That Understands Manufacturing</h2>
            <div className="grid sm:grid-cols-2 gap-6 mb-16">
              {highlights.map((h, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <h.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{h.title}</h3>
                  <p className="text-muted-foreground text-sm">{h.desc}</p>
                </div>
              ))}
            </div>

            <MockScheduleCalendar />
          </div>
        </section>

        

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Scheduling Built for the Shop Floor</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <LeadCaptureBar sourcePage="production-scheduling" className="mb-16" />

            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <h2 className="text-2xl font-bold mb-3">Schedule smarter, produce faster</h2>
              <p className="text-muted-foreground mb-6">Free trial — no credit card required.</p>
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
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
