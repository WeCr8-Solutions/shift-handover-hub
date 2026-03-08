import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, ListChecks, Calendar, Route, Upload } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockWorkOrderTracker } from "@/components/marketing/MockWorkOrderTracker";

import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";

const benefits = [
  "Kanban board, list, and calendar views",
  "Priority-based scheduling with drag & drop",
  "Multi-step routing with operation tracking",
  "Outside processing coordination",
  "Real-time status updates from operators",
  "Part number and work order search",
  "Bulk import from Excel templates",
  "Export reports for production meetings",
];

const highlights = [
  { icon: ListChecks, title: "Three View Modes", desc: "Switch between Kanban, list, and calendar views instantly to see your queue the way that works for you." },
  { icon: Route, title: "Multi-Step Routing", desc: "Track jobs through every operation — from raw stock to final inspection — including outside processing." },
  { icon: Calendar, title: "Due Date Visibility", desc: "Instantly see what's at risk. Color-coded due dates and priority badges keep your team focused." },
  { icon: Upload, title: "Bulk Import", desc: "Upload work orders from Excel. Download our template, fill it in, and import hundreds of jobs in seconds." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai Work Order Tracking",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "description": "Work order tracking and queue management for manufacturing. Kanban boards, priority scheduling, multi-step routing, and real-time status updates.",
  "url": "https://joblineai.lovable.app/features/work-order-tracking",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function WorkOrderTracking() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Work Order Tracking Software for Manufacturing"
        description="Track manufacturing work orders with Kanban boards, priority scheduling, multi-step routing, and real-time operator updates. Built for CNC machine shops and fabrication."
        keywords="work order tracking, manufacturing work orders, production tracking software, job tracking manufacturing, work order management, shop floor tracking, production order system"
        canonical="/features/work-order-tracking"
        jsonLd={jsonLd}
      />

      <MarketingNav />

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <ListChecks className="w-4 h-4" />
              Complete Queue Management
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Work Order Tracking for{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Machine Shops
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Manage your production queue with visual Kanban boards, priority scheduling, and real-time status updates from the shop floor.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")} className="gap-2">
                <Zap className="w-5 h-5" /> Try Interactive Demo
              </Button>
            </div>

            <h2 className="text-2xl font-bold mb-6">Why Shops Choose JobLine.ai for Work Orders</h2>
            <div className="grid sm:grid-cols-2 gap-6 mb-16">
              {highlights.map((h, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <h.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{h.title}</h3>
                  <p className="text-muted-foreground text-sm">{h.desc}</p>
                </div>
              ))}
            </div>

            <MockWorkOrderTracker />
          </div>
        </section>

        

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Complete Work Order Management</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <LeadCaptureBar sourcePage="work-order-tracking" className="mb-16" />

            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <h2 className="text-2xl font-bold mb-3">Stop managing work orders on paper</h2>
              <p className="text-muted-foreground mb-6">Digitize your production queue in under 5 minutes.</p>
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
