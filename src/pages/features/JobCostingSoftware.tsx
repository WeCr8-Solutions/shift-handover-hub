import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, DollarSign, Clock, FileText, TrendingDown, Calculator, BarChart2 } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockOversightKPIs } from "@/components/marketing/MockOversightKPIs";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";

const features = [
  { icon: Clock, title: "Actual Labor Time Capture", desc: "Operators log start and stop times per operation directly from the floor. Actual labor hours are captured automatically — no time cards to collect, no estimates to guess." },
  { icon: Calculator, title: "Estimate vs. Actual Variance", desc: "Compare the hours and materials you estimated for a job against what it actually took. Identify the jobs eating your margin before you bid them again." },
  { icon: DollarSign, title: "Material Cost Tracking", desc: "Attach material costs to work orders at issue from inventory. Track actual material consumption per job to capture true cost of goods." },
  { icon: TrendingDown, title: "Overhead & Burden Rate Allocation", desc: "Apply machine burden rates and overhead allocations per routing step. Get a fully loaded job cost — not just labor and materials." },
  { icon: BarChart2, title: "Job Profitability Reports", desc: "See gross margin per job, per customer, and per part number. Know which work is making money and which is eroding your shop's profitability." },
  { icon: FileText, title: "Cost Rollup by Work Order", desc: "Every labor entry, material pull, and overhead allocation rolls up into a single job cost summary — ready for review before invoicing." },
];

const benefits = [
  "Capture actual labor hours at the machine — not from memory",
  "Compare actual vs. estimated cost per job automatically",
  "Identify under-priced repeat jobs before bidding again",
  "Overhead and burden rates applied per routing operation",
  "Full material cost linked to work orders from inventory",
  "Profitability summary per customer, part, or job class",
  "Multi-shift job costing — labor captured across all shifts",
  "Historical cost data to support quoting accuracy improvements",
];

const faqs = [
  { q: "What is job costing software for manufacturing?", a: "Job costing software tracks the actual labor, material, and overhead costs incurred on each production job. It compares actual costs against your original estimate, showing you which jobs made money and which ones didn't — so you can fix your quoting and your processes." },
  { q: "Why do job shops need job costing software?", a: "Most job shops discover their margin problems too late — after the invoice is sent. Real job costing software captures costs as production happens, so you can see when a job is going over budget before it's complete, not after." },
  { q: "How is this different from QuickBooks or basic accounting?", a: "Accounting software captures costs after the fact, at the financial level. Job costing software captures costs in real time at the work order level — labor hour by labor hour, operation by operation. The two work together: job cost data from JobLine.ai feeds your accounting system with accurate COGS." },
  { q: "Can I use job costing data to improve my quoting?", a: "Yes. JobLine.ai's estimate-vs-actual reports show you where your quotes are consistently low — by operation type, machine, or part family. Over time, your quoting accuracy improves because it's backed by actual production cost data." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai — Job Costing Software",
  "applicationCategory": "BusinessApplication",
  "description": "Job costing software for job shops and machine shops. Capture actual labor, material, and overhead costs per work order. Compare estimates vs. actuals to fix your quoting and protect your margin.",
  "url": "https://jobline.ai/features/job-costing-software",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function JobCostingSoftware() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Job Costing Software for Machine Shops — Actual vs. Estimated Cost Tracking"
        description="Job costing software for job shops and machine shops. Track actual labor, materials, and overhead per work order. See estimate vs. actual variance per job to protect margin and improve quoting."
        keywords="job costing software, manufacturing job costing, job costing for machine shops, job shop costing software, production job costing, actual vs estimated manufacturing, job cost tracking, machine shop job costing, manufacturing cost tracking, job profitability software"
        canonical="/features/job-costing-software"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <DollarSign className="w-4 h-4" />
              Job Costing
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Job Costing Software That{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Shows You Where Your Margin Went
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Stop guessing at job profitability. JobLine.ai captures actual labor, material, and overhead costs per work order — and compares them to your estimates — so you know which jobs made money and which ones didn't.
            </p>
            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">Start Free <ArrowRight className="w-5 h-5" /></Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/demo")} className="gap-2"><Zap className="w-5 h-5" /> Book a Demo</Button>
            </div>
            <MockOversightKPIs />
          </div>
        </section>
        <AdPlacement format="horizontal" className="py-4" />
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-8 text-center">Job Costing Features</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {features.map((f, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <f.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
            <h2 className="text-2xl font-bold mb-6">What Job Costing Delivers</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-status-ok mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <LeadCaptureBar sourcePage="job-costing-software" className="mb-16" />
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
              <h2 className="text-2xl font-bold mb-3">Find out which jobs are actually profitable — today</h2>
              <p className="text-muted-foreground mb-6">Free trial — no credit card, no IT project required.</p>
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
