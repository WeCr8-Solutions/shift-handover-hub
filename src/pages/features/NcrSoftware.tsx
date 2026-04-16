import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, XCircle, FileWarning, GitBranch, ClipboardList, AlertTriangle, BarChart2 } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockQualityCard } from "@/components/marketing/MockQualityCard";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";

const features = [
  { icon: FileWarning, title: "NCR Initiation from the Floor", desc: "Operators and inspectors log nonconformances directly from their phone or tablet. Capture part number, quantity, defect description, and location in seconds — no desk walk required." },
  { icon: XCircle, title: "Nonconformance Disposition Workflow", desc: "Route NCRs through a structured review and disposition process: use-as-is, rework, repair, scrap, or return to supplier. Capture MRB decisions and approver sign-offs digitally." },
  { icon: GitBranch, title: "Root Cause & Corrective Action", desc: "Attach root cause analysis (5-why, fishbone) and corrective action plans directly to each NCR. Track CAPA open/closed status and verify effectiveness after closure." },
  { icon: ClipboardList, title: "Linked to Work Orders", desc: "NCRs are linked to the specific work order, routing step, and part quantity affected. See the full quality history of a work order from one screen." },
  { icon: AlertTriangle, title: "Supplier NCR Tracking", desc: "Log supplier nonconformances, track returned material, and maintain a supplier quality record — supporting 8D responses and supplier scorecards." },
  { icon: BarChart2, title: "NCR Trend Reports", desc: "See nonconformance frequency by defect code, part number, operation, operator, and customer. Identify systemic quality problems before they become escapes." },
];

const benefits = [
  "NCR logged in under 60 seconds from the shop floor",
  "Structured disposition workflow with digital approvals",
  "Root cause and corrective action linked to each NCR",
  "CAPA tracking with open/closed status and effectiveness review",
  "NCR register with full history for audits and customer reviews",
  "Supplier NCR tracking and 8D support documentation",
  "NCR trend charts: top defect codes, top offenders by part/operation",
  "Supports AS9100, ISO 9001, and IATF 16949 NCR requirements",
];

const faqs = [
  { q: "What is NCR software?", a: "NCR (Nonconformance Report) software manages the lifecycle of quality escapes and defects in manufacturing — from initial detection and documentation through root cause analysis, corrective action, and closure. It replaces paper NCR forms and shared spreadsheets with a tracked, auditable digital process." },
  { q: "What's the difference between an NCR and a CAPA?", a: "An NCR documents a specific nonconforming part or event. A CAPA (Corrective and Preventive Action) is the systemic response to prevent the issue from recurring. JobLine.ai links CAPAs to their source NCRs, so you can trace every corrective action back to the original nonconformance." },
  { q: "How does JobLine.ai support ISO 9001 NCR requirements?", a: "ISO 9001 clause 8.7 requires documented control of nonconforming outputs, including identification, segregation, disposition, and authority to accept under concession. JobLine.ai provides all of these elements in a digital workflow with audit-ready records." },
  { q: "Can I use NCR data to evaluate supplier quality?", a: "Yes. Supplier NCRs are tagged to the supplier, part number, and purchase order. You can view a supplier's nonconformance history, run quality scorecards, and document the 8D response — all linked to the original NCR record." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai — NCR Software",
  "applicationCategory": "BusinessApplication",
  "description": "Nonconformance report (NCR) software for manufacturers. Log, disposition, and track nonconformances from the shop floor with CAPA workflow and audit-ready records.",
  "url": "https://jobline.ai/features/ncr-software",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function NcrSoftware() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="NCR Software — Nonconformance Report Tracking for Manufacturers"
        description="NCR software for manufacturers. Log nonconformances from the shop floor, manage disposition workflows, track corrective actions, and generate audit-ready reports. Supports ISO 9001 and AS9100."
        keywords="NCR software, nonconformance reporting software, NCR tracking manufacturing, nonconformance report system, CAPA software manufacturing, quality nonconformance software, ISO 9001 NCR software, AS9100 nonconformance tracking, MRB software, NCR management manufacturing"
        canonical="/features/ncr-software"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <FileWarning className="w-4 h-4" />
              NCR & Quality Management
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              NCR Software That{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Closes Quality Escapes — Not Just Tickets
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              JobLine.ai provides a full nonconformance workflow — from floor detection to root cause, corrective action, and closure — with the audit trail your quality system requires.
            </p>
            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">Start Free <ArrowRight className="w-5 h-5" /></Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/demo")} className="gap-2"><Zap className="w-5 h-5" /> Book a Demo</Button>
            </div>
            <MockQualityCard />
          </div>
        </section>
        <AdPlacement format="horizontal" className="py-4" />
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-8 text-center">NCR Management Features</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {features.map((f, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <f.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
            <h2 className="text-2xl font-bold mb-6">What NCR Software Delivers</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-status-ok mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <LeadCaptureBar sourcePage="ncr-software" className="mb-16" />
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
              <h2 className="text-2xl font-bold mb-3">Replace paper NCR forms with a real digital process</h2>
              <p className="text-muted-foreground mb-6">Free trial �.</p>
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
