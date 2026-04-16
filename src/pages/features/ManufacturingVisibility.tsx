import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, Eye, CheckCircle2, Zap } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockVisibilityDashboard } from "@/components/marketing/MockVisibilityDashboard";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { ConversionEvents } from "@/lib/analytics";

const benefits = [
  "See every machine, operator, and job status in real-time",
  "Role-based dashboards for supervisors, managers, and owners",
  "Instant alerts for downtime, quality holds, and bottlenecks",
];

const faqs = [
  { q: "What does 'manufacturing visibility' mean?", a: "It means having a live, accurate view of your entire production floor—machine status, job progress, operator assignments, and quality issues—from any device, at any time." },
  { q: "Who benefits most from floor visibility?", a: "Supervisors use it to manage shifts in real-time. Managers and owners use it to track KPIs, identify bottlenecks, and make data-driven decisions without walking the floor." },
  { q: "Can I see data across multiple shifts?", a: "Yes. Historical data, shift comparisons, and trend reports give you visibility not just into the current shift but across days, weeks, and months." },
  { q: "How fast is setup?", a: "Most teams are up and running in under 5 minutes. Add your stations, invite your team, and start tracking." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JobLine.ai Manufacturing Visibility",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  description: "Real-time manufacturing floor visibility. See every machine, operator, and job from any device. Built for machine shops and production teams.",
  url: "https://jobline.ai/manufacturing-visibility",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free trial available" },
};

export default function ManufacturingVisibility() {
  const navigate = useNavigate();
  const pagePath = "/manufacturing-visibility";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Manufacturing Floor Visibility Software"
        description="Real-time production floor visibility for manufacturing teams. Track machines, operators, and jobs from any device. No hardware needed. Start free."
        keywords="manufacturing visibility, production floor visibility, shop floor monitoring, real-time manufacturing dashboard, production tracking software"
        canonical={pagePath}
        jsonLd={jsonLd}
      />
      <MarketingNav />

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Eye className="w-4 h-4" />
              Full Floor Visibility
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Manufacturing Visibility,{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Without the Clipboard
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Replace walk-the-floor expediting with a real-time digital dashboard. See every machine, job, and operator in one view.
            </p>

            <ul className="space-y-3 mb-10">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-4 mb-12">
              <Button size="lg" onClick={() => {
                ConversionEvents.ctaClick('start_free_trial', 'Start Free Trial', pagePath, 'hero');
                navigate("/auth");
              }} className="gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => {
                ConversionEvents.demoOpen(pagePath, 'hero_button');
                navigate("/demo");
              }} className="gap-2">
                <Zap className="w-5 h-5" /> Book a Demo
              </Button>
            </div>

            <MockVisibilityDashboard />

            <h2 className="text-2xl font-bold mb-6 mt-16">Frequently Asked Questions</h2>
            <div className="space-y-4 mb-16">
              {faqs.map((faq, i) => (
                <div key={i} className="p-4 rounded-lg bg-secondary/30">
                  <h3 className="font-medium mb-1">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>

            <LeadCaptureBar sourcePage="manufacturing-visibility" className="mb-16" />

            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <h2 className="text-2xl font-bold mb-3">Ready for full floor visibility?</h2>
              <p className="text-muted-foreground mb-6">Start your free trial today</p>
              <Button size="lg" onClick={() => {
                ConversionEvents.ctaClick('get_started_free', 'Get Started Free', pagePath, 'bottom_cta');
                navigate("/auth");
              }} className="gap-2">
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
