import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, Zap, Wrench, Smartphone, Camera, TrendingUp, FileText, Clock } from "lucide-react";
import joblineLogo from "@/assets/jobline-logo.png";

const benefits = [
  "Mobile-friendly interface for shop floor tablets and phones",
  "Quick job status updates from the machine",
  "Parts count, scrap, and rework logging",
  "Photo attachments for setup sheets and issues",
  "Submit improvement ideas and performance updates",
  "View incoming handoff notes from previous shift",
  "Station-specific handoff forms (CNC, lathe, mill, grinder)",
  "Digital sign-off for shift transitions",
];

const operatorSteps = [
  { icon: Clock, title: "Start of Shift", desc: "Review handoff notes from the previous operator. See machine status, current job, parts count, and any quality issues flagged." },
  { icon: Wrench, title: "During Your Shift", desc: "Update job progress, log parts completed, report machine issues, and submit performance improvement ideas — all from your phone." },
  { icon: FileText, title: "End of Shift", desc: "Complete the structured handoff form. Document machine condition, job status, material notes, and anything the next operator needs to know." },
  { icon: TrendingUp, title: "Continuous Improvement", desc: "Your setup changes, tool adjustments, and process improvements are tracked and reviewed — your expertise matters." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai CNC Operator Tools",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "description": "Mobile-friendly tools for CNC operators. Job tracking, shift handoffs, performance updates, and continuous improvement — designed for the shop floor.",
  "url": "https://joblineai.lovable.app/features/cnc-operator-tools",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function CNCOperatorTools() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="CNC Operator Tools - Mobile Shop Floor Software"
        description="Mobile-friendly tools designed for CNC operators. Track jobs, log parts, submit improvements, and complete shift handoffs from your phone or tablet on the shop floor."
        keywords="CNC operator software, machine operator tools, shop floor mobile app, CNC operator app, machine shop operator software, operator job tracking, machinist software, CNC job tracking"
        canonical="/features/cnc-operator-tools"
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
              <Smartphone className="w-4 h-4" />
              Built for the Shop Floor
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              CNC Operator Tools{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                That Actually Work
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Designed by machinists, for machinists. JobLine.ai gives operators the tools they need — 
              right on their phone or shop floor tablet. No training manual required.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")} className="gap-2">
                <Zap className="w-5 h-5" /> Try Interactive Demo
              </Button>
            </div>

            <h2 className="text-2xl font-bold mb-6">Your Shift, Simplified</h2>
            <div className="space-y-6 mb-16">
              {operatorSteps.map((step, i) => (
                <div key={i} className="flex gap-4 p-5 rounded-xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                    <p className="text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold mb-6">Everything an Operator Needs</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <h2 className="text-2xl font-bold mb-3">Give your operators the tools they deserve</h2>
              <p className="text-muted-foreground mb-6">Free trial — works on any device with a browser.</p>
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
          <Button variant="ghost" size="sm" onClick={() => navigate("/features/shift-handoff-software")}>Shift Handoffs</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/features/machine-shop-software")}>Machine Shop</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/pricing")}>Pricing</Button>
        </div>
      </footer>
    </div>
  );
}
