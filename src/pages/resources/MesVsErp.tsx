import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, BarChart3, Layers, Settings } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";

const comparisons = [
  {
    topic: "Primary Purpose",
    mes: "Control and track what is happening on the shop floor right now — job status, machine state, operator activity, quality events",
    erp: "Manage business processes — sales orders, purchasing, accounting, inventory valuation, and financial reporting",
  },
  {
    topic: "Time Horizon",
    mes: "Real time and shift-level — minutes, hours, and days",
    erp: "Weekly, monthly, and quarterly — financial and operational planning cycles",
  },
  {
    topic: "Data Capture Point",
    mes: "At the machine or work center — operators enter data as work happens",
    erp: "After the fact — often transactions are entered by office staff from paper records",
  },
  {
    topic: "Primary Users",
    mes: "Operators, shift supervisors, quality technicians, and production managers",
    erp: "Operations managers, purchasing, accounting, sales, and executive leadership",
  },
  {
    topic: "Shop Floor Visibility",
    mes: "Native — MES is built specifically for real-time floor visibility",
    erp: "Limited — most ERPs rely on manual transactions to update job status, not real-time data",
  },
  {
    topic: "Quality Management",
    mes: "In-process inspections, NCR capture, SPC, and first article inspection built into routing",
    erp: "Basic quality tracking — usually post-process inspection records, not floor-level quality gates",
  },
  {
    topic: "Speed of Deployment",
    mes: "Days to weeks for a focused MES like JobLine.ai; months for enterprise MES",
    erp: "Months to years for any meaningful ERP implementation",
  },
  {
    topic: "Implementation Cost",
    mes: "Variable — $3k/year to $250k+ depending on scope and system",
    erp: "Typically $50k–$500k+ for mid-market ERP; enterprise ERP reaches into millions",
  },
];

const whyBoth = [
  { icon: Layers, title: "ERP Plans, MES Executes", desc: "ERP tells you what to build and when. MES tracks how it's being built right now. Neither does the other's job well." },
  { icon: BarChart3, title: "Different Data Frequencies", desc: "ERP data is correct as of last night's batch update. MES data is correct as of 30 seconds ago. Both are needed — for different decisions." },
  { icon: Settings, title: "Complementary Systems", desc: "The most effective manufacturers use ERP for business management and MES for floor execution. JobLine.ai is designed to integrate with — not replace — your ERP." },
];

const faqs = [
  { q: "Do I need both an MES and an ERP?", a: "For most growing manufacturers, yes. ERP manages your business: orders, purchasing, accounting, and inventory. MES manages your floor: real-time job status, operator tracking, quality events, and shift handoffs. If you're running ERP without MES, you have business visibility but not shop floor visibility. That gap causes late jobs, quality escapes, and operator inefficiency that ERP simply can't see." },
  { q: "Can an ERP replace an MES?", a: "Rarely. Most ERP systems capture transactions after the fact — a work order is marked 'complete' when a supervisor updates the system, not when the last operation actually finishes. MES captures production events in real time, at the machine, which is fundamentally different. Some enterprise ERP suites offer 'MES modules,' but they're often add-ons with limited floor-level functionality." },
  { q: "Can an MES replace an ERP?", a: "Not for full business management. MES handles production execution — job routing, quality, shift handoffs, and floor visibility. ERP handles the business layer — customer orders, supplier POs, accounting, and financial reporting. A job shop running only an MES will need ERP functions elsewhere (even if that's QuickBooks for now). A job shop running only ERP will lack real-time floor visibility." },
  { q: "Where does JobLine.ai fit?", a: "JobLine.ai is a manufacturing execution system (MES) with additional modules for quoting, job costing, and capacity planning. It's designed to complement your ERP — not compete with it. JobLine.ai gives your floor the real-time visibility and execution control that ERP can't provide." },
  { q: "What if we don't have an ERP yet?", a: "JobLine.ai can serve as your primary operations platform for smaller shops — handling work orders, routing, quality, and job costing. As you grow and bring on a formal ERP, JobLine.ai continues as the floor execution layer, with ERP handling the financial and procurement functions." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "MES vs ERP: What's the Difference and Do You Need Both?",
  "description": "A practical guide to the difference between MES (Manufacturing Execution System) and ERP (Enterprise Resource Planning) software — and how they work together in manufacturing.",
  "url": "https://jobline.ai/resources/mes-vs-erp",
  "author": { "@type": "Organization", "name": "JobLine.ai" },
};

export default function MesVsErp() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="MES vs ERP: What's the Difference? | JobLine.ai"
        description="Manufacturing Execution System (MES) vs ERP: what each does, where they overlap, and why manufacturers need both. A practical guide for job shops and production managers."
        keywords="MES vs ERP, difference between MES and ERP, do I need MES or ERP, MES ERP comparison, manufacturing execution system vs ERP, MES and ERP together, ERP for manufacturing, MES software comparison, MES vs ERP manufacturing, choose MES or ERP"
        canonical="/resources/mes-vs-erp"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <BarChart3 className="w-4 h-4" />
              Manufacturing Resource Guide
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              MES vs ERP:{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                What's the Difference — and Do You Need Both?
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              MES and ERP are both manufacturing software — but they solve different problems. Here's a plain-language breakdown of what each system does, where they overlap, and how they work together.
            </p>
          </div>
        </section>
        <AdPlacement format="horizontal" className="py-4" />
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-8">MES vs ERP: Side-by-Side Comparison</h2>
            <div className="overflow-x-auto mb-16">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="text-left p-3 border border-border font-semibold w-1/4">Topic</th>
                    <th className="text-left p-3 border border-border font-semibold text-primary w-[37.5%]">MES (Manufacturing Execution System)</th>
                    <th className="text-left p-3 border border-border font-semibold w-[37.5%]">ERP (Enterprise Resource Planning)</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-secondary/20"}>
                      <td className="p-3 border border-border font-medium">{row.topic}</td>
                      <td className="p-3 border border-border text-muted-foreground">{row.mes}</td>
                      <td className="p-3 border border-border text-muted-foreground">{row.erp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold mb-6">Why Manufacturers Use Both</h2>
            <div className="grid sm:grid-cols-3 gap-6 mb-16">
              {whyBoth.map((w, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <w.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{w.title}</h3>
                  <p className="text-muted-foreground text-sm">{w.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 mb-16">
              <h3 className="text-lg font-bold mb-2">Where JobLine.ai Fits</h3>
              <p className="text-muted-foreground mb-4">JobLine.ai is a manufacturing execution system built for job shops and mid-size manufacturers. It handles real-time floor visibility, work order tracking, shift handoffs, quality management, and job costing — the execution layer your ERP can't see.</p>
              <ul className="space-y-2">
                {["Works alongside your existing ERP — not in competition with it", "Connects job-level cost data to your accounting system", "Provides the shop floor visibility ERP transactions can't give you"].map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-status-ok flex-shrink-0" />{b}</li>
                ))}
              </ul>
            </div>

            <LeadCaptureBar sourcePage="mes-vs-erp" className="mb-16" />

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
              <h2 className="text-2xl font-bold mb-3">Get the MES layer your ERP is missing</h2>
              <p className="text-muted-foreground mb-6">Free trial — real-time shop floor visibility starting today.</p>
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">Start Free Trial <ArrowRight className="w-5 h-5" /></Button>
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
