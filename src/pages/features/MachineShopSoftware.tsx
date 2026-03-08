import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, Wrench, Monitor, BarChart3, Users } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockShopFloorView } from "@/components/marketing/MockShopFloorView";

import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";

const benefits = [
  "Built specifically for CNC machine shops",
  "Track lathe, mill, grinder, and EDM stations",
  "Operator-driven job status updates",
  "Shift handoff forms by work center type",
  "Parts count, scrap, and rework tracking",
  "Equipment condition monitoring",
  "Team management for multi-shift operations",
  "Works on tablets and phones on the floor",
];

const highlights = [
  { icon: Wrench, title: "Work Center Specific", desc: "Handoff forms and station setups tailored for CNC lathes, mills, grinders, EDM, water jet, and more." },
  { icon: Monitor, title: "Real-Time Station Status", desc: "See every machine's current job, operator, and condition at a glance from any device." },
  { icon: BarChart3, title: "Production Analytics", desc: "Track parts completed, scrap rates, and cycle times across stations and shifts." },
  { icon: Users, title: "Multi-Shift Coordination", desc: "Structured handoffs ensure nothing gets lost between first, second, and third shift." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai Machine Shop Software",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "description": "Machine shop management software for CNC operations. Track stations, manage shifts, coordinate work orders, and monitor equipment — all from one platform.",
  "url": "https://joblineai.lovable.app/features/machine-shop-software",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function MachineShopSoftware() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Machine Shop Software - CNC Shop Management"
        description="Machine shop management software designed for CNC operations. Track stations, manage operator shifts, coordinate work orders, and monitor equipment condition in real-time."
        keywords="machine shop software, CNC shop management, machine shop management software, CNC software, shop floor software, machining software, job shop software, CNC machine management"
        canonical="/features/machine-shop-software"
        jsonLd={jsonLd}
      />

      <MarketingNav />

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Wrench className="w-4 h-4" />
              Purpose-Built for Machine Shops
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Machine Shop Software for{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                CNC Operations
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Purpose-built software for machine shops. Manage stations, operators, work orders, and shift handoffs — designed by people who understand manufacturing.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")} className="gap-2">
                <Zap className="w-5 h-5" /> Try Interactive Demo
              </Button>
            </div>

            <h2 className="text-2xl font-bold mb-6">Not Generic Software — Built for Your Shop</h2>
            <div className="grid sm:grid-cols-2 gap-6 mb-16">
              {highlights.map((h, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <h.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{h.title}</h3>
                  <p className="text-muted-foreground text-sm">{h.desc}</p>
                </div>
              ))}
            </div>

            <MockShopFloorView />
          </div>
        </section>

        <AdPlacement format="horizontal" className="py-4" />

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Everything Your Shop Needs</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <LeadCaptureBar sourcePage="machine-shop-software" className="mb-16" />

            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <h2 className="text-2xl font-bold mb-3">Run your shop smarter</h2>
              <p className="text-muted-foreground mb-6">Free trial — set up in under 5 minutes.</p>
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
