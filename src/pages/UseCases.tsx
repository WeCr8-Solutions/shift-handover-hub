import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { UseCaseRoutingPreview } from "@/components/help/UseCaseRoutingPreview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Car, Droplets, Truck, Flame, Cog, Hammer, HelpCircle, CheckCircle2 } from "lucide-react";

const useCases = [
  {
    slug: "automotive-repair-shop",
    label: "Automotive Repair",
    tagline: "Track every vehicle from intake to pickup",
    icon: Car,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    highlights: [
      "Multi-bay job tracking with live status",
      "Shift handoff notes with photos per vehicle",
      "Parts ordering checkpoints in routing",
      "Customer-ready completion reports",
    ],
  },
  {
    slug: "oil-change-quick-lube",
    label: "Oil Change & Quick Lube",
    tagline: "High-volume service, zero missed steps",
    icon: Droplets,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    highlights: [
      "Standardized multi-point inspection routing",
      "Lane-based vehicle flow tracking",
      "Upsell opportunities flagged during inspection",
      "Drive-in to drive-out under 20 minutes",
    ],
  },
  {
    slug: "fleet-maintenance",
    label: "Fleet & Heavy Equipment",
    tagline: "DOT-compliant PM scheduling at scale",
    icon: Truck,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    highlights: [
      "Preventive maintenance interval tracking",
      "Unit-level history and compliance records",
      "Oil sample and brake inspection checkpoints",
      "Road test sign-off before release",
    ],
  },
  {
    slug: "general-fabrication",
    label: "Fabrication & Welding",
    tagline: "Custom jobs with consistent tracking",
    icon: Flame,
    color: "text-red-500",
    bg: "bg-red-500/10",
    highlights: [
      "Custom routing per work order",
      "WPS-linked welding step notes",
      "Cut → Fit-Up → Weld → Grind → Paint → Ship",
      "Certification tracking for welders",
    ],
  },
  {
    slug: "cnc-machine-shop",
    label: "CNC Machine Shop",
    tagline: "The original JobLine use case",
    icon: Cog,
    color: "text-primary",
    bg: "bg-primary/10",
    highlights: [
      "Multi-op routing with tool offset notes",
      "First article inspection checkpoints",
      "Shift handoff with program & offset data",
      "Part count and scrap tracking per op",
    ],
  },
  {
    slug: "body-shop-collision",
    label: "Body Shop & Collision",
    tagline: "Insurance-grade repair documentation",
    icon: Hammer,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    highlights: [
      "Photo-documented teardown and supplements",
      "Frame rack measurements saved per step",
      "Paint code and blend zone tracking",
      "Reassembly checklist before delivery",
    ],
  },
];

export default function UseCases() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Use Cases — See How Shops Use JobLine"
        description="Explore how automotive repair shops, oil change centers, fleet maintenance, fabrication shops, CNC machine shops, and body shops use JobLine to track work and hand off between shifts."
        canonical="/use-cases"
        keywords="jobline use cases, shop tracking software, automotive repair software, fleet maintenance tracking, CNC shop software"
      />
      <MarketingNav />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border bg-muted/30 py-16 sm:py-20">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">Use Cases</Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Built for shops like yours
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              JobLine tracks work orders, shift handoffs, and quality checks for every kind of shop — from quick lubes to aerospace machine shops. See how it fits your workflow.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Button onClick={() => navigate("/auth")} size="lg" className="gap-2">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Button>
              <Button onClick={() => navigate("/demo")} variant="outline" size="lg">
                Watch Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Use case cards */}
        <section className="container mx-auto px-4 py-12 sm:py-16 max-w-5xl">
          <div className="space-y-10">
            {useCases.map((uc, idx) => {
              const Icon = uc.icon;
              const isEven = idx % 2 === 0;

              return (
                <div
                  key={uc.slug}
                  className="rounded-xl border border-border overflow-hidden bg-card"
                >
                  {/* Header */}
                  <div className={`p-6 sm:p-8 ${isEven ? "" : "sm:flex sm:flex-row-reverse sm:items-start sm:gap-8"}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2.5 rounded-lg ${uc.bg}`}>
                          <Icon className={`w-6 h-6 ${uc.color}`} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-foreground">{uc.label}</h2>
                          <p className="text-sm text-muted-foreground">{uc.tagline}</p>
                        </div>
                      </div>

                      <ul className="space-y-2 mt-4">
                        {uc.highlights.map((h) => (
                          <li key={h} className="flex items-start gap-2 text-sm text-foreground">
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            {h}
                          </li>
                        ))}
                      </ul>

                      <div className="flex flex-wrap gap-2 mt-6">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/help/use-cases/${uc.slug}`)}
                          className="gap-1.5"
                        >
                          See Full Guide <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate("/help")}
                          className="gap-1.5 text-muted-foreground"
                        >
                          <HelpCircle className="w-3.5 h-3.5" /> Help Center
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Interactive routing preview */}
                  <div className="border-t border-border">
                    <UseCaseRoutingPreview slug={uc.slug} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-muted/30 py-16">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Don't see your shop type?</h2>
            <p className="text-muted-foreground mb-6">
              JobLine is flexible enough for any shop that routes work through stations. If you cut, weld, machine, assemble, repair, or inspect — we've got you covered.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => navigate("/auth")} className="gap-2">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/help")}>
                Browse Help Center
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </>
  );
}
