import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, ArrowLeft, CheckCircle2, Zap, ListTodo, BarChart3, Route, Filter } from "lucide-react";
import joblineLogo from "@/assets/jobline-logo.png";

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

      <nav className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src={joblineLogo} alt="JobLine.ai" className="h-8 w-auto" />
          </button>
          <Button onClick={() => navigate("/auth")} size="sm" className="gap-2">
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
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
            </div>

            <h2 className="text-2xl font-bold mb-6">Complete Work Order Management</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

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

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Button>
      </footer>
    </div>
  );
}
