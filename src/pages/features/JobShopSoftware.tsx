import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, List, Users, Wrench, BarChart3, Clock } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockQueueBoard } from "@/components/marketing/MockAppPreviews";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";

const benefits = [
  "Track every job from quote to ship — in real time",
  "Priority queue board with drag-and-drop sequencing",
  "Structured shift handoffs so nothing falls through the cracks",
  "Station-level work order routing across CNC, lathe, mill, EDM",
  "Parts count, scrap, and rework logging per operation",
  "On-time delivery dashboards and past-due alerts",
  "Customer job notes, material certs, and photo attachments",
  "Multi-shift coordination for first, second, and third shift",
];

const highlights = [
  {
    icon: List,
    title: "Job Queue Management",
    desc: "A live queue board that shows every open job's priority, routing step, and operator — updated by your team in real time.",
  },
  {
    icon: Clock,
    title: "Shift Handoffs",
    desc: "Structured digital handoff forms capture machine condition, part counts, quality issues, and next-shift priorities at every station.",
  },
  {
    icon: BarChart3,
    title: "Production Analytics",
    desc: "Cycle times, scrap rates, on-time delivery, and utilization metrics — built in, no spreadsheets required.",
  },
  {
    icon: Users,
    title: "Multi-Shift Teams",
    desc: "Role-based access for operators, supervisors, and shop owners. Everyone sees exactly what they need.",
  },
];

const faqs = [
  {
    q: "Is this software built for small job shops?",
    a: "Yes. JobLine.ai is designed for job shops with 5–100 employees. Setup takes minutes, not months. No ERP consultants required.",
  },
  {
    q: "Do I need to replace my existing ERP or scheduling system?",
    a: "No. JobLine.ai works alongside QuickBooks, JobBoss, Epicor, and other ERP systems. It fills the shop floor execution gap that ERP leaves open.",
  },
  {
    q: "Can operators use it from the machine?",
    a: "Yes. The interface is optimized for tablets and phones on the shop floor — large touch targets, minimal clicks, works in any lighting.",
  },
  {
    q: "How long does setup take?",
    a: "Most shops are live in under an hour. Add your machines, operators, and open jobs — you're tracking immediately.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai Job Shop Software",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "description":
    "Job shop management software for high-mix, low-volume production. Track work orders, manage shift handoffs, and optimize scheduling across CNC, lathe, mill, and fabrication operations.",
  "url": "https://jobline.ai/features/job-shop-software",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function JobShopSoftware() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Job Shop Software - Production Management for High-Mix Shops"
        description="Job shop software built for high-mix, low-volume manufacturing. Track work orders, manage shift handoffs, and optimize scheduling across CNC lathes, mills, and fabrication — without the complexity of enterprise ERP."
        keywords="job shop software, job shop management software, job shop production software, high mix low volume software, small job shop software, job shop scheduling software, job shop tracking software, CNC job shop software"
        canonical="/features/job-shop-software"
        jsonLd={jsonLd}
      />

      <MarketingNav />

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Wrench className="w-4 h-4" />
              Built for High-Mix, Low-Volume Shops
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Job Shop Software That{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Keeps Up With Your Floor
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Job shops run on fast-changing priorities, tribal knowledge, and operator expertise. JobLine.ai
              gives you the digital tools to capture all of it — without the complexity of enterprise ERP.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/demo")} className="gap-2">
                <Zap className="w-5 h-5" /> Book a Demo
              </Button>
            </div>

            <MockQueueBoard />
          </div>
        </section>

        <AdPlacement format="horizontal" className="py-4" />

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-8 text-center">
              Everything a Job Shop Needs — Nothing It Doesn't
            </h2>
            <div className="grid sm:grid-cols-2 gap-6 mb-16">
              {highlights.map((h, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <h.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{h.title}</h3>
                  <p className="text-muted-foreground text-sm">{h.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold mb-6">What's Included</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-status-ok mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <LeadCaptureBar sourcePage="job-shop-software" className="mb-16" />

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
              <h2 className="text-2xl font-bold mb-3">Ready to modernize your job shop?</h2>
              <p className="text-muted-foreground mb-6">
                Free trial — no credit card required. Most shops are live in under an hour.
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
