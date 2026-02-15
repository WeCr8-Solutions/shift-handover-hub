import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, Users, Building2, UserPlus, Shield, Bell, Lock } from "lucide-react";
import joblineLogo from "@/assets/jobline-logo.png";

const benefits = [
  "Organization and team hierarchy management",
  "Role-based access: owner, admin, supervisor, operator, viewer",
  "QR code invite system for instant team onboarding",
  "Cross-shift communication through handoff records",
  "Team-based station and work center assignments",
  "Supervisor review and approval workflows",
  "Multi-shift team coordination",
  "Secure data isolation between organizations",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai Team Collaboration",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "description": "Manufacturing team collaboration software. Role-based access, QR code invites, cross-shift communication, and multi-team coordination for production environments.",
  "url": "https://joblineai.lovable.app/features/team-collaboration",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function TeamCollaboration() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Manufacturing Team Collaboration Software"
        description="Coordinate manufacturing teams across shifts with role-based access, QR code invites, and structured handoff communication. Built for multi-shift production environments."
        keywords="manufacturing team software, production team collaboration, shift team management, manufacturing communication software, team coordination manufacturing, multi-shift coordination, production team management"
        canonical="/features/team-collaboration"
        jsonLd={jsonLd}
      />

      <nav className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src={joblineLogo} alt="JobLine.ai" className="h-8 w-auto" />
          </button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/pricing")}>Pricing</Button>
            <Button onClick={() => navigate("/auth")} size="sm" className="gap-2">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Users className="w-4 h-4" />
              Multi-Shift Team Coordination
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Team Collaboration for{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Manufacturing Teams
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Manufacturing runs on teamwork across shifts. JobLine.ai gives every team member the right access and the right information at the right time.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            <h2 className="text-2xl font-bold mb-6">How Teams Use JobLine.ai</h2>
            <div className="grid sm:grid-cols-3 gap-6 mb-16">
              {[
                { icon: UserPlus, title: "Instant Onboarding", desc: "Generate QR invite codes. New operators scan and join with the right role in seconds." },
                { icon: Shield, title: "Right Access, Every Role", desc: "Owners see everything. Operators see their stations. Viewers see dashboards. Locked down by default." },
                { icon: Bell, title: "Cross-Shift Communication", desc: "Structured handoff records ensure the next shift knows exactly what happened and what needs attention." },
              ].map((f, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <f.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold mb-6">Built for Manufacturing Teams</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <h2 className="text-2xl font-bold mb-3">Get your whole team on the same page</h2>
              <p className="text-muted-foreground mb-6">Free trial — invite your team in seconds with QR codes.</p>
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4 flex flex-wrap justify-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>Home</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/features/manufacturing-oversight")}>Oversight</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/features/cnc-operator-tools")}>Operator Tools</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/pricing")}>Pricing</Button>
        </div>
      </footer>
    </div>
  );
}
