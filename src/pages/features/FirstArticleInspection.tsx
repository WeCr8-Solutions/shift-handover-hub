import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, ClipboardCheck, FileText, Shield, CheckSquare, Ruler, AlertCircle } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockQualityCard } from "@/components/marketing/MockQualityCard";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";

const features = [
  { icon: Ruler, title: "Dimensional Measurement Records", desc: "Capture all ballooned print dimensions digitally. Operators enter actual measured values per characteristic — flagged automatically against tolerance limits." },
  { icon: ClipboardCheck, title: "AS9102 / PPAP-Style FAI Forms", desc: "Structured first article report forms aligned with AS9102 and AS9100 requirements. Include part details, inspection method, and approval signature fields." },
  { icon: FileText, title: "Linked Work Order FAI Gate", desc: "Attach FAI requirements to a routing step so production cannot advance past first article without inspection completion and approver sign-off." },
  { icon: Shield, title: "Customer Approval Tracking", desc: "Track FAI submission, customer review, and approval status per work order. Know which first articles are pending approval and which are clear to proceed." },
  { icon: AlertCircle, title: "Deviation & Waiver Processing", desc: "Log out-of-tolerance characteristics with disposition (use-as-is, rework, reject) and document any customer-approved deviations directly tied to the FAI record." },
  { icon: CheckSquare, title: "FAI Reuse on Repeat Parts", desc: "Reference prior FAI records on repeat part numbers. Only re-inspect characteristics affected by engineering changes — not the full part every time." },
];

const benefits = [
  "Digital first article reports — no paper binders or shared folders",
  "Actual vs. nominal tol tracking per print characteristic",
  "AS9102 and PPAP-aligned form structure",
  "FAI gate blocks routing advancement until approved",
  "Customer submission and approval status in one view",
  "Deviation and waiver documentation linked to the FAI record",
  "Revision-controlled: FAI tied to specific part revision level",
  "Reuse prior FAI data for repeat parts with unchanged features",
];

const faqs = [
  { q: "What is First Article Inspection (FAI)?", a: "First Article Inspection verifies that a production part conforms to all engineering requirements before production is authorized to run at full quantity. It's required by AS9102 for aerospace suppliers, and common practice in defense, medical device, and precision machining." },
  { q: "What is AS9102?", a: "AS9102 is the aerospace industry standard for First Article Inspection Requirements. It defines the documentation, dimensional verification, and approval process required before a new or revised part can be submitted to an aerospace customer." },
  { q: "Does JobLine.ai generate AS9102-compliant FAI reports?", a: "JobLine.ai provides structured FAI forms with the key elements required by AS9102: part identification, characteristic measurement records, material certifications linkage, approval signatures, and conformance status. Always verify your specific customer's FAI requirements, as some primes have additional requirements." },
  { q: "Can I do partial FAI (delta FAI) for revised parts?", a: "Yes. JobLine.ai supports delta FAI — only the dimensions and features affected by an engineering change need to be re-inspected. The system tracks which characteristics carry over from the prior FAI and which require new measurement data." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai — First Article Inspection Software",
  "applicationCategory": "BusinessApplication",
  "description": "Digital first article inspection (FAI) software for aerospace, defense, and precision manufacturers. AS9102-aligned FAI forms, dimensional records, and approval workflow.",
  "url": "https://jobline.ai/features/first-article-inspection",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function FirstArticleInspection() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="First Article Inspection Software — Digital FAI for Aerospace & Defense"
        description="Digital first article inspection (FAI) software for precision manufacturers. AS9102-aligned forms, dimensional measurement records, customer approval tracking, and FAI routing gates. Replace paper binders."
        keywords="first article inspection software, FAI software, FAI manufacturing, first article report software, AS9102 software, AS9102 FAI, first article inspection tool, digital FAI forms, aerospace FAI software, PPAP software"
        canonical="/features/first-article-inspection"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <ClipboardCheck className="w-4 h-4" />
              First Article Inspection
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              First Article Inspection Software{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                That Replaces the Paper Binder
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              JobLine.ai digitalizes your FAI process — from dimensional records and material certs to customer approval tracking and routing gates. AS9102-aligned forms without the paper trail.
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
            <h2 className="text-2xl font-bold mb-8 text-center">First Article Inspection Features</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {features.map((f, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <f.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
            <h2 className="text-2xl font-bold mb-6">What FAI Software Delivers</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-status-ok mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <LeadCaptureBar sourcePage="first-article-inspection" className="mb-16" />
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
              <h2 className="text-2xl font-bold mb-3">Replace your FAI paper binders — starting today</h2>
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
