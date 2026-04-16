import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, TrendingUp, Clock, Package, AlertCircle, BarChart3 } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockWorkOrderTracker } from "@/components/marketing/MockWorkOrderTracker";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";

const features = [
  { icon: TrendingUp, title: "Live Job Status Across the Floor", desc: "Every work order has a real-time status: queued, running, on hold, complete. Supervisors see the full picture from any device — no walkaround required." },
  { icon: Clock, title: "Actual vs. Estimated Time Tracking", desc: "Compare planned cycle times against actual production times per operation. Surface the jobs running long before they blow your delivery date." },
  { icon: Package, title: "WIP Inventory Visibility", desc: "Know exactly how many parts are at each routing step and work center. Stop losing jobs in the queue between operations." },
  { icon: AlertCircle, title: "Behind-Schedule Alerts", desc: "Automatic alerts when a job's actual run time exceeds its scheduled pace. Catch late jobs while there's still time to react." },
  { icon: BarChart3, title: "Shift-Level Production Reports", desc: "End-of-shift summaries: jobs completed, parts produced, downtime events, and quality holds — built automatically from operator activity." },
  { icon: CheckCircle2, title: "Milestone & Gate Tracking", desc: "Define critical routing gates — first article approval, quality inspection, final test — and track their real-time completion status per work order." },
];

const benefits = [
  "Real-time production status visible to everyone — from operators to owners",
  "No manual status updates or daily stand-up calls to track jobs",
  "Compare actual output to planned production targets each shift",
  "Catch bottlenecks before they cause late shipments",
  "Reduce the time supervisors spend tracking down job status",
  "Historical production data for quoting and capacity planning",
  "Works across any number of machines, cells, or work centers",
  "Cloud-hosted — accessible from the office, phone, or remote",
];

const faqs = [
  { q: "What is production tracking software?", a: "Production tracking software captures the real-time status of work orders, parts, and machines on the manufacturing floor. It shows what's running, what's behind, and what's complete — replacing the whiteboard, clipboard, or \"walk and look\" method of knowing where a job stands." },
  { q: "How does production tracking help job shops specifically?", a: "High-mix job shops juggle dozens or hundreds of active work orders across shared work centers. Without tracking software, jobs get lost between routing steps, on-time delivery suffers, and supervisors spend their shifts tracking down status instead of managing production." },
  { q: "Does JobLine.ai require operators to enter data?", a: "Yes, but minimally. Operators tap to start or complete a job from their station — it takes under 10 seconds. That single action updates job status, starts time tracking, and notifies supervisors. No spreadsheet entry, no separate time card system." },
  { q: "Can I track production across multiple shifts?", a: "Yes. Production data flows continuously across shifts. Incoming supervisors see current WIP, active jobs at each station, and any quality or downtime events from the prior shift — in one real-time view." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai — Production Tracking Software",
  "applicationCategory": "BusinessApplication",
  "description": "Real-time production tracking software for job shops. Track work order status, WIP, cycle times, and production output in real time — without spreadsheets or manual updates.",
  "url": "https://jobline.ai/features/production-tracking",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function ProductionTracking() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Production Tracking Software for Job Shops — Real-Time WIP Visibility"
        description="Real-time production tracking software for job shops and machine shops. Track work orders, WIP, and actual vs. planned output without spreadsheets. Catch late jobs before they miss ship dates."
        keywords="production tracking software, manufacturing production tracking, real-time production tracking, job shop production tracking, WIP tracking software, work order tracking, production status software, manufacturing job tracking, shop floor tracking, production monitoring software"
        canonical="/features/production-tracking"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <TrendingUp className="w-4 h-4" />
              Production Tracking
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Production Tracking Software{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                That Ends the Status Hunt
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Stop walking the floor to find out where a job is. JobLine.ai gives every stakeholder live production status — what's running, what's behind, and what's done — updated in real time by operators at the machine.
            </p>
            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">Start Free <ArrowRight className="w-5 h-5" /></Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/demo")} className="gap-2"><Zap className="w-5 h-5" /> Book a Demo</Button>
            </div>
            <MockWorkOrderTracker />
          </div>
        </section>
        <AdPlacement format="horizontal" className="py-4" />
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-8 text-center">How We Track Production</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {features.map((f, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <f.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
            <h2 className="text-2xl font-bold mb-6">What Production Tracking Delivers</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-status-ok mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <LeadCaptureBar sourcePage="production-tracking" className="mb-16" />
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
              <h2 className="text-2xl font-bold mb-3">Know exactly where every job is — right now</h2>
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
