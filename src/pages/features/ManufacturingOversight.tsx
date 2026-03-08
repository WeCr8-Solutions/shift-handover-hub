import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, Shield, Users, Eye, Factory } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MockOversightKPIs } from "@/components/marketing/MockOversightKPIs";

import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";

const benefits = [
  "Centralized dashboard for all production activity",
  "Role-based access: owners, supervisors, operators, viewers",
  "Cross-shift visibility with structured handoff records",
  "Quality issue escalation and resolution tracking",
  "Operator performance and continuous improvement logs",
  "Equipment condition monitoring across stations",
  "Team and organization hierarchy management",
  "Audit-ready records for ISO and AS9100 compliance",
];

const personas = [
  { icon: Factory, title: "Shop Owners", desc: "See the big picture — production throughput, quality metrics, and team performance across all shifts without being on the floor." },
  { icon: Shield, title: "Production Managers", desc: "Manage work order priorities, approve handoffs, review quality escalations, and ensure on-time delivery from one dashboard." },
  { icon: Users, title: "Supervisors", desc: "Monitor your team in real-time, approve shift handoffs, address machine issues, and track operator improvement suggestions." },
  { icon: Eye, title: "Quality Teams", desc: "Track quality holds, review dimensional inspection results, and ensure corrective actions are followed through across shifts." },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "JobLine.ai Manufacturing Oversight",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "description": "Manufacturing oversight software providing real-time visibility across shifts, teams, and stations. Role-based dashboards for owners, managers, supervisors, and quality teams.",
    "url": "https://joblineai.lovable.app/features/manufacturing-oversight",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is manufacturing oversight software?",
        "acceptedAnswer": { "@type": "Answer", "text": "Manufacturing oversight software provides real-time visibility into production operations, enabling managers and supervisors to monitor work orders, track quality, manage shifts, and ensure on-time delivery across all stations and teams." }
      },
      {
        "@type": "Question",
        "name": "How does JobLine.ai help with manufacturing oversight?",
        "acceptedAnswer": { "@type": "Answer", "text": "JobLine.ai provides role-based dashboards, structured shift handoff forms, real-time station monitoring, quality escalation workflows, and operator performance tracking — all in one platform designed specifically for CNC machine shops and fabrication facilities." }
      },
    ],
  },
];

export default function ManufacturingOversight() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Manufacturing Oversight Software"
        description="Complete manufacturing oversight software for machine shops. Real-time dashboards, shift handoff tracking, quality management, and team coordination. Role-based access for owners, managers, and supervisors."
        keywords="manufacturing oversight software, production oversight, manufacturing management software, shop floor oversight, factory management software, manufacturing visibility, production management system"
        canonical="/features/manufacturing-oversight"
        jsonLd={jsonLd}
      />

      <MarketingNav />

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Eye className="w-4 h-4" />
              Complete Shop Floor Visibility
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Manufacturing Oversight{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Know exactly what's happening on your shop floor — across every shift, station, and team. 
              JobLine.ai gives everyone the right level of visibility for their role.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")} className="gap-2">
                <Zap className="w-5 h-5" /> See It In Action
              </Button>
            </div>

            <h2 className="text-2xl font-bold mb-6">Built for Every Role in Your Shop</h2>
            <div className="grid sm:grid-cols-2 gap-6 mb-16">
              {personas.map((p, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <p.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{p.title}</h3>
                  <p className="text-muted-foreground text-sm">{p.desc}</p>
                </div>
              ))}
            </div>

            <MockOversightKPIs />
          </div>
        </section>

        <AdPlacement format="horizontal" className="py-4" />

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Complete Oversight Features</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <LeadCaptureBar sourcePage="manufacturing-oversight" className="mb-16" />

            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <h2 className="text-2xl font-bold mb-3">See your entire operation in one place</h2>
              <p className="text-muted-foreground mb-6">Free trial — set up in under 5 minutes. No credit card required.</p>
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
