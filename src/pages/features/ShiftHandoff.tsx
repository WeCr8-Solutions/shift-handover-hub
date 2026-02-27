import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, Clock, CheckCircle2, Zap } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockHandoffForm } from "@/components/marketing/MockAppPreviews";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { ConversionEvents } from "@/lib/analytics";

const benefits = [
  "Structured digital handoff forms—no more sticky notes",
  "Zero information loss between incoming and outgoing operators",
  "Supervisor sign-off and full audit trail on every transition",
];

const faqs = [
  { q: "What is a shift handoff?", a: "A shift handoff is the transition of responsibility from one operator to the next at shift change. It includes machine status, job progress, quality notes, and any outstanding issues." },
  { q: "How long does a digital handoff take?", a: "Most operators complete a digital handoff in under 5 minutes, compared to 20–30 minutes with paper-based systems." },
  { q: "Can I customize the handoff form?", a: "Yes. Forms are tailored per work center type (CNC, lathe, mill, water jet) with fields specific to each machine category." },
  { q: "Is there a mobile app?", a: "JobLine.ai is a responsive web app that works on any device—phone, tablet, or shop floor terminal. No app download needed." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JobLine.ai Shift Handoff",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  description: "Digital shift handoff system for manufacturing. Eliminate lost information between shifts with structured forms and real-time status updates.",
  url: "https://joblineai.lovable.app/shift-handoff",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free trial available" },
};

export default function ShiftHandoff() {
  const navigate = useNavigate();
  const pagePath = "/shift-handoff";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Shift Handoff System for Manufacturing"
        description="Eliminate lost information between shifts. Digital handoff forms, supervisor sign-off, and full audit trails for CNC machine shops and manufacturing teams."
        keywords="shift handoff, shift change, manufacturing handoff, operator transition, shift report, production handoff system"
        canonical={pagePath}
        jsonLd={jsonLd}
      />
      <MarketingNav />

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Clock className="w-4 h-4" />
              Seamless Shift Transitions
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Shift Handoffs,{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Finally Solved
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Stop losing critical information at shift change. JobLine.ai gives every operator a structured digital handoff that takes under 5 minutes.
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

            <MockHandoffForm />

            <h2 className="text-2xl font-bold mb-6 mt-16">Frequently Asked Questions</h2>
            <div className="space-y-4 mb-16">
              {faqs.map((faq, i) => (
                <div key={i} className="p-4 rounded-lg bg-secondary/30">
                  <h3 className="font-medium mb-1">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>

            <LeadCaptureBar sourcePage="shift-handoff" className="mb-16" />

            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <h2 className="text-2xl font-bold mb-3">Ready to fix your shift handoffs?</h2>
              <p className="text-muted-foreground mb-6">Start your free trial today. No credit card required.</p>
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
