import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, LayoutDashboard, Activity, Bell, TrendingUp } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockVisibilityDashboard } from "@/components/marketing/MockVisibilityDashboard";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";

const benefits = [
  "Live status for every machine and work center on the floor",
  "Wall-display mode for shop TV screens and kiosks",
  "Shift-by-shift production summaries and comparisons",
  "Parts completed, scrap, and rework counts per station",
  "At-a-glance on-time delivery status for open orders",
  "Downtime flags and supervisor alert notifications",
  "OEE and utilization metrics without spreadsheets",
  "Role-based views for operators, supervisors, and owners",
];

const panels = [
  {
    icon: LayoutDashboard,
    title: "Station Overview",
    desc: "Every work center displayed with current job, operator, machine condition, and parts count. Fits on any screen — from a phone to a 65-inch shop TV.",
  },
  {
    icon: Activity,
    title: "Live Production Feed",
    desc: "A real-time activity stream showing job transitions, handoff completions, downtime events, and quality flags as they happen across the floor.",
  },
  {
    icon: TrendingUp,
    title: "Shift Performance",
    desc: "Compare today's shift output against targets and historical averages. See which stations are on pace and which need attention — before the shift ends.",
  },
  {
    icon: Bell,
    title: "Supervisor Alerts",
    desc: "Instant notifications when a machine goes down, a job falls behind pace, or a quality issue is flagged. React in minutes, not at end of shift.",
  },
];

const faqs = [
  {
    q: "Can this run on a wall-mounted TV in the shop?",
    a: "Yes. JobLine.ai has a dedicated kiosk/display mode that auto-refreshes and shows your full shop floor status optimized for large screens.",
  },
  {
    q: "Does it require any hardware or sensors on machines?",
    a: "No hardware required. Operators update machine state from phones and tablets. The dashboard reflects those updates in real time.",
  },
  {
    q: "Can different roles see different dashboards?",
    a: "Yes. Operators see their station. Supervisors see their work center. Shop owners and managers get a full-floor view. All configurable.",
  },
  {
    q: "Can I share access with a customer or plant manager?",
    a: "Yes. Read-only external links can be created for customers to track their job status, or for remote plant managers to monitor production.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai Manufacturing Floor Dashboard",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "description":
    "Real-time manufacturing floor dashboard software. Monitor every machine, work center, and shift from a single view — on any screen, without hardware sensors.",
  "url": "https://jobline.ai/features/shop-floor-dashboard",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function ShopFloorDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Manufacturing Floor Dashboard Software - Real-Time Shop Visibility"
        description="Real-time manufacturing floor dashboard. Monitor every machine, work center, and shift from a single view — wall displays, mobile, or desktop. No sensors required. Built for machine shops and job shops."
        keywords="manufacturing floor dashboard, shop floor dashboard, production dashboard software, manufacturing dashboard, shop floor visibility, real-time manufacturing dashboard, factory floor dashboard, shop floor monitoring, manufacturing KPI dashboard"
        canonical="/features/shop-floor-dashboard"
        jsonLd={jsonLd}
      />

      <MarketingNav />

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <LayoutDashboard className="w-4 h-4" />
              Wall Display · Mobile · Desktop
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Manufacturing Floor Dashboard{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                That Updates Itself
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              See every machine's status, every job's location, and every shift's performance — live, from any
              screen on your floor or in your office. No sensors, no IT project, no spreadsheet maintenance.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/demo")} className="gap-2">
                <Zap className="w-5 h-5" /> Book a Demo
              </Button>
            </div>

            <MockVisibilityDashboard />
          </div>
        </section>

        <AdPlacement format="horizontal" className="py-4" />

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-8 text-center">Four Dashboard Views, One Platform</h2>
            <div className="grid sm:grid-cols-2 gap-6 mb-16">
              {panels.map((p, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <p.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{p.title}</h3>
                  <p className="text-muted-foreground text-sm">{p.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold mb-6">Dashboard Features</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-status-ok mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <LeadCaptureBar sourcePage="shop-floor-dashboard" className="mb-16" />

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
              <h2 className="text-2xl font-bold mb-3">See your entire floor at a glance</h2>
              <p className="text-muted-foreground mb-6">
                Free trial — your dashboard is live the same day you sign up.
              </p>
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
