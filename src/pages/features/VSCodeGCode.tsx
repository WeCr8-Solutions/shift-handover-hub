import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import {
  ArrowRight,
  CheckCircle2,
  Code,
  FileCode2,
  Lightbulb,
  AlertTriangle,
  Layers,
  Cpu,
  Sparkles,
  Terminal,
  FlaskConical,
  Eye,
} from "lucide-react";

const dialects = [
  { name: "Fanuc", desc: "Full G/M-code support with macro-B variable highlighting" },
  { name: "Haas", desc: "NGC dialect with setting codes and coolant macros" },
  { name: "Mazak", desc: "Mazatrol conversational + EIA/ISO G-code" },
  { name: "Siemens", desc: "Sinumerik 840D ShopMill / ShopTurn programs" },
  { name: "Heidenhain", desc: "Klartext and DIN/ISO conversational" },
  { name: "Okuma", desc: "OSP-P300 and OSP-P200 program support" },
];

const features = [
  {
    icon: Eye,
    title: "Syntax Highlighting",
    desc: "Context-aware colorization for G-codes, M-codes, axis words, feed rates, tool calls, comments, and macro variables across all supported dialects.",
  },
  {
    icon: Lightbulb,
    title: "IntelliSense & Hover Docs",
    desc: "Hover any G or M code to see plain-English descriptions, parameter ranges, and usage examples. Autocomplete suggests valid codes as you type.",
  },
  {
    icon: AlertTriangle,
    title: "Real-Time Diagnostics",
    desc: "Catches missing line numbers, unmatched parentheses, invalid axis values, and feed-rate omissions before the program reaches the machine.",
  },
  {
    icon: Layers,
    title: "Program Structure Outline",
    desc: "VS Code's Outline view shows tool changes, subroutine calls, and operation blocks — jump to any section instantly in large programs.",
  },
  {
    icon: FileCode2,
    title: "Snippet Library",
    desc: "Pre-built snippets for tool changes, canned cycles (G81–G89), probing routines, and common setup patterns. Add your own shop-specific templates.",
  },
  {
    icon: Sparkles,
    title: "MCP Integration",
    desc: "Exposed as MCP tools so AI agents (Claude, Cursor, Windsurf) can validate G-code, explain operations, and suggest optimizations through natural language.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JobLine G-Code — VS Code Extension",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Windows, macOS, Linux",
  description:
    "Multi-dialect G-code intelligence for VS Code. Syntax highlighting, IntelliSense, diagnostics, and AI integration for CNC programmers.",
  url: "https://jobline.ai/features/vscode-gcode",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function VSCodeGCode() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="JobLine G-Code — VS Code Extension for CNC Programming"
        description="Multi-dialect G-code language intelligence inside VS Code. Syntax highlighting, autocomplete, real-time diagnostics, and MCP integration for Fanuc, Haas, Mazak, Siemens, and more."
        keywords="G-code VS Code extension, CNC programming IDE, Fanuc G-code editor, Haas G-code syntax, CNC code IntelliSense, G-code diagnostics, machinist code editor"
        canonical="/features/vscode-gcode"
        jsonLd={jsonLd}
      />

      <MarketingNav />

      <main>
        {/* Hero */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm">
                <Code className="w-4 h-4" />
                VS Code Extension
              </div>
              <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10 gap-1">
                <FlaskConical className="w-3 h-3" />
                Beta
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              JobLine{" "}
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                G-Code
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-4">
              Multi-dialect G-code intelligence inside VS Code. Syntax highlighting, autocomplete, real-time
              diagnostics, and AI integration — purpose-built for CNC programmers and manufacturing engineers.
            </p>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 mb-8 text-sm text-amber-200 flex items-start gap-2">
              <FlaskConical className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
              <span>
                <strong>Beta Program</strong> — This extension is currently in closed beta testing with select
                manufacturing partners. Core functionality is stable; we're refining dialect coverage and
                diagnostic rules based on real-world CNC programs before public release.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Join the Beta Waitlist <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/features/machine-connect")} className="gap-2">
                <Cpu className="w-4 h-4" /> See Machine Connect
              </Button>
            </div>
          </div>
        </section>

        {/* Supported Dialects */}
        <section className="py-12 sm:py-16 border-t border-border/50">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-2">Supported CNC Dialects</h2>
            <p className="text-muted-foreground mb-8 max-w-xl">
              One extension, every major control. Each dialect gets its own grammar, hover docs, and diagnostic
              ruleset.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dialects.map((d) => (
                <div
                  key={d.name}
                  className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Terminal className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">{d.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <AdPlacement slot="vscode-gcode-mid" className="my-8" />

        {/* Features Grid */}
        <section className="py-12 sm:py-16 border-t border-border/50">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl font-bold mb-2">Language Intelligence Features</h2>
            <p className="text-muted-foreground mb-8 max-w-xl">
              Everything you'd expect from a modern language extension — adapted for CNC program files.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="space-y-2">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it connects */}
        <section className="py-12 sm:py-16 border-t border-border/50 bg-card/30">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-2xl font-bold mb-3">Part of the JobLine Platform</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              The G-Code extension generates the language intelligence layer. Pair it with{" "}
              <button onClick={() => navigate("/features/machine-connect")} className="text-primary hover:underline">
                Machine Connect
              </button>{" "}
              for the transport layer — DNC transfers, live machine monitoring, and real-time status feeds — all
              syncing to the same JobLine backend your supervisors and operators already use.
            </p>
            <p className="text-sm text-muted-foreground italic">
              "The VS Code extension you use at your desk connects to the platform running on your Haas."
            </p>
          </div>
        </section>

        {/* Benefits checklist */}
        <section className="py-12 sm:py-16 border-t border-border/50">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-bold mb-6">Why CNC Programmers Choose JobLine G-Code</h2>
            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
              {[
                "Works offline — no cloud dependency for editing",
                "Catches errors before they reach the controller",
                "Hover docs reduce manual-lookup time",
                "Shop-specific snippet templates",
                "Outline view for navigating large programs",
                "AI agents can validate & explain your code",
                "Free during beta — no credit card required",
                "Feeds data into the JobLine production dashboard",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <LeadCaptureBar context="vscode-gcode" />

        {/* CTA */}
        <section className="py-16 sm:py-24 border-t border-border/50">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 border-amber-500/40 text-amber-500 bg-amber-500/10 gap-1">
              <FlaskConical className="w-3 h-3" /> Currently in Beta
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to Write Better G-Code?</h2>
            <p className="text-muted-foreground mb-6">
              Sign up to join the beta program. We're onboarding shops weekly and collecting feedback to make this
              the definitive CNC programming extension.
            </p>
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
              Join Beta Waitlist <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
