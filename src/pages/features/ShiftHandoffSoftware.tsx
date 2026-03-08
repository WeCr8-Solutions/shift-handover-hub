import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, Clock, FileText, Users, Shield, CheckCircle2, Zap } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockHandoffForm } from "@/components/marketing/MockAppPreviews";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";

const benefits = [
  "Eliminate lost information between shifts",
  "Structured handoff forms for CNC, lathe, mill, and water jet",
  "Photo attachments for machine conditions",
  "Real-time station status updates",
  "Supervisor sign-off workflows",
  "Full audit trail of every handoff",
  "Mobile-friendly for shop floor use",
  "Team-based access controls",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai Shift Handoff Software",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "description": "Digital shift handoff software for manufacturing. Structured forms for CNC machines, lathes, mills, and more. Eliminate information loss between shifts.",
  "url": "https://joblineai.lovable.app/features/shift-handoff-software",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "description": "Free trial available" },
  "featureList": benefits,
};

export default function ShiftHandoffSoftware() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Shift Handoff Software for Manufacturing"
        description="Digital shift handoff software built for CNC machine shops and manufacturing. Structured forms, photo attachments, supervisor sign-off, and full audit trails. Start free today."
        keywords="shift handoff software, manufacturing shift handoff, CNC shift change, machine handoff notes, shift transition software, shift change report, production handoff, operator shift change"
        canonical="/features/shift-handoff-software"
        jsonLd={jsonLd}
      />

      <MarketingNav />

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Clock className="w-4 h-4" />
              Zero Information Loss Between Shifts
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Shift Handoff Software for{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Manufacturing Teams
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Stop losing critical information between shifts. JobLine.ai provides structured digital handoff forms designed specifically for CNC machine shops, fabrication facilities, and production floors.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")} className="gap-2">
                <Zap className="w-5 h-5" /> Try Interactive Demo
              </Button>
            </div>

            <MockHandoffForm />

            <h2 className="text-2xl font-bold mb-6 mt-16">Why Manufacturing Teams Choose JobLine.ai for Shift Handoffs</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <AdPlacement format="horizontal" className="py-4" />

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">How Digital Shift Handoffs Work</h2>
            <div className="space-y-6 mb-16">
              {[
                { icon: FileText, title: "1. Outgoing operator completes handoff form", desc: "Structured fields capture machine status, job progress, quality notes, and material availability." },
                { icon: Users, title: "2. Incoming operator reviews & acknowledges", desc: "Next-shift operator reviews all information and confirms understanding before starting." },
                { icon: Shield, title: "3. Supervisor signs off", desc: "Optional supervisor approval ensures nothing falls through the cracks." },
                { icon: Clock, title: "4. Full audit trail maintained", desc: "Every handoff is timestamped and stored for quality audits and continuous improvement." },
              ].map((step, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-lg bg-secondary/30">
                  <step.icon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-muted-foreground text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <LeadCaptureBar sourcePage="shift-handoff-software" className="mb-16" />

            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <h2 className="text-2xl font-bold mb-3">Ready to eliminate shift handoff chaos?</h2>
              <p className="text-muted-foreground mb-6">Start your free trial today. No credit card required.</p>
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
