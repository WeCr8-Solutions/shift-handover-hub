import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, Shield, AlertTriangle, FileText, TrendingUp } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { AdPlacement } from "@/components/marketing/AdPlacement";

const benefits = [
  "First-article inspection documentation",
  "Dimensional verification checklists per handoff",
  "Quality hold escalation with supervisor notification",
  "Scrap and rework tracking per shift and station",
  "Photo attachments for quality evidence",
  "Continuous improvement submissions from operators",
  "Cross-shift quality issue handoff continuity",
  "Audit-ready records for ISO 9001 and AS9100",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai Quality Management",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "description": "Manufacturing quality management software. Track inspections, manage quality holds, reduce scrap, and maintain audit-ready records for ISO and AS9100 compliance.",
  "url": "https://joblineai.lovable.app/features/quality-management",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function QualityManagement() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Quality Management Software for Manufacturing"
        description="Manufacturing quality management with inspection tracking, quality hold escalation, scrap reduction, and ISO/AS9100 audit-ready records. Built into your shift handoff workflow."
        keywords="quality management manufacturing, manufacturing quality software, quality control software, inspection tracking, scrap tracking, ISO 9001 software, AS9100 compliance, quality hold management, first article inspection"
        canonical="/features/quality-management"
        jsonLd={jsonLd}
      />

      <MarketingNav />

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Shield className="w-4 h-4" />
              Quality Built Into Every Handoff
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Quality Management for{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                the Shop Floor
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Quality doesn't stop between shifts. JobLine.ai ensures quality information flows seamlessly across every handoff, every station, and every team.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")} className="gap-2">
                <Zap className="w-5 h-5" /> Try Interactive Demo
              </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 mb-16">
              {[
                { icon: AlertTriangle, value: "47%", label: "Fewer quality escapes", desc: "With structured handoff quality checks" },
                { icon: TrendingUp, value: "$200K+", label: "Scrap reduction", desc: "Reported by early adopters per year" },
                { icon: FileText, value: "100%", label: "Audit ready", desc: "Every quality event documented" },
              ].map((s, i) => (
                <div key={i} className="text-center p-6 rounded-xl bg-card border border-border">
                  <s.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-bold mb-1">{s.value}</div>
                  <div className="font-medium text-sm mb-1">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <AdPlacement format="horizontal" className="py-4" />

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Quality Features Built for Manufacturing</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <h2 className="text-2xl font-bold mb-3">Build quality into every shift transition</h2>
              <p className="text-muted-foreground mb-6">Free trial — no credit card required.</p>
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>

        <AdPlacement format="horizontal" className="py-6" />
      </main>

      <MarketingFooter />
    </div>
  );
}
