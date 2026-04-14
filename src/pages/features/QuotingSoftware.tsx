import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, FileText, Calculator, Clock, BarChart2, DollarSign, Package } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockWorkOrderTracker } from "@/components/marketing/MockWorkOrderTracker";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";

const features = [
  { icon: Calculator, title: "Operation-Based Cost Buildup", desc: "Build quotes from the ground up — operation by operation, work center by work center. Apply machine hourly rates, setup times, and run times per routing step." },
  { icon: Package, title: "Material Costing", desc: "Add raw material with unit costs, cut lengths, and scrap allowance. Material cost rolls up automatically into the total quote value." },
  { icon: Clock, title: "Setup and Run Time Entry", desc: "Enter setup hours and cycle time per operation. The quote calculates total labor at your defined labor rates — or by work-center-specific rates." },
  { icon: DollarSign, title: "Markup and Margin Controls", desc: "Apply markups by operation, material, or total job cost. See gross margin percentage in real time as you build the quote — so you know what you're making before you submit." },
  { icon: FileText, title: "Quote-to-Work-Order Conversion", desc: "When a quote is won, convert it to a work order in one click — routing steps, material, and job details carry over automatically. No re-entry." },
  { icon: BarChart2, title: "Quote Win/Loss Tracking", desc: "Track which quotes were won, lost, or pending. See win rates by customer and by job type — and tie actual job costs back to original quotes to improve future estimates." },
];

const benefits = [
  "Operation-based quotes with work-center labor rates",
  "Material costs with cut length, scrap allowance, and unit pricing",
  "Gross margin visible in real time during quote buildup",
  "One-click quote-to-work-order conversion when won",
  "Customer-specific pricing and discounting",
  "Quote history with revision tracking",
  "Actual vs. estimated cost variance by quote line",
  "Win/loss tracking with notes and reason codes",
];

const faqs = [
  { q: "What is machine shop quoting software?", a: "Machine shop quoting software helps job shops estimate the cost of production jobs — capturing labor time per operation, material costs, setup, and overhead — and generates a formal quote for the customer. Unlike spreadsheet-based quoting, dedicated software maintains part history, tracks win/loss rate, and links quotes directly to production work orders." },
  { q: "How does JobLine.ai quoting connect to production?", a: "When a quote is won, it converts to a work order with all routing steps, materials, and estimated hours pre-populated. As the job runs, actual costs are captured against the estimate — giving you real quote-vs-actual data to improve your next bid." },
  { q: "Can I quote jobs with multiple operations and materials?", a: "Yes. JobLine.ai supports multi-operation quotes with separate work center rates per step. Each operation can have its own setup time, run time, and labor rate — plus material lines with unit costs, quantities, and scrap factors." },
  { q: "Does this replace my ERP quoting module?", a: "For many small and mid-size shops, yes. If you're currently quoting in Excel or in an ERP with a limited estimating module, JobLine.ai provides a faster, more accurate quoting workflow that's directly connected to your shop floor production data." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai — Machine Shop Quoting Software",
  "applicationCategory": "BusinessApplication",
  "description": "Job shop quoting software for machine shops. Build accurate quotes from operation-level labor rates, material costs, and overhead — then convert to work orders when won.",
  "url": "https://jobline.ai/features/quoting-software",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function QuotingSoftware() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Machine Shop Quoting Software — Job Shop Estimating & Quote Management"
        description="Quoting software for machine shops and job shops. Build operation-level quotes with labor rates, material costs, and margin controls. Convert won quotes to work orders in one click."
        keywords="machine shop quoting software, job shop quoting software, manufacturing quote software, CNC shop estimating software, job shop estimating, machine shop estimating, manufacturing quoting tool, job costing estimating software, quote to work order, shop quoting software"
        canonical="/features/quoting-software"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <FileText className="w-4 h-4" />
              Quoting & Estimating
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Machine Shop Quoting Software{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                That Knows Your Actual Costs
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              JobLine.ai builds quotes from real operation data — labor rates per work center, actual material costs, setup times. See your margin before you submit, and compare estimated vs. actual costs when the job is done.
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
            <h2 className="text-2xl font-bold mb-8 text-center">Quoting Software Features</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {features.map((f, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <f.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
            <h2 className="text-2xl font-bold mb-6">What Quoting Software Delivers</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-status-ok mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <LeadCaptureBar sourcePage="quoting-software" className="mb-16" />
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
              <h2 className="text-2xl font-bold mb-3">Quote with confidence — backed by your real shop data</h2>
              <p className="text-muted-foreground mb-6">Free trial — no credit card required.</p>
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
