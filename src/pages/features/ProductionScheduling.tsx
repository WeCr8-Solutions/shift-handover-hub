import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import joblineLogo from "@/assets/jobline-logo.png";

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
            </div>

            <h2 className="text-2xl font-bold mb-6">Scheduling Built for the Shop Floor</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

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
    </div>
  );
}
