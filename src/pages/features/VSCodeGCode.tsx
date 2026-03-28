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
  Eye,
  Download,
  ExternalLink,
} from "lucide-react";

const dialects = [
  { name: "Fanuc", desc: "0i/30i/31i series with full Macro B variable highlighting" },
  { name: "Haas", desc: "NGC controls — VF, ST, UMC, UR with setting codes" },
  { name: "Siemens", desc: "Sinumerik 840D/828D with CYCLE call support" },
  { name: "Mazak", desc: "Smooth technology / Matrix (EIA/ISO mode)" },
  { name: "Okuma", desc: "OSP-P series program support" },
  { name: "Fanuc Robot TP", desc: "Fanuc robot teach pendant program intelligence" },
  { name: "ABB RAPID", desc: "ABB robot RAPID language support" },
];

const features = [
  {
    icon: Eye,
    title: "Syntax Highlighting",
    desc: "Dialect-specific colorization for G-codes, M-codes, axis words, feed rates, tool calls, comments, and macro variables. Readable contrast across all VS Code themes.",
  },
  {
    icon: Lightbulb,
    title: "Hover Tooltips & IntelliSense",
    desc: "Hover any G or M code for full descriptions, parameter ranges, and usage notes inline. No tab switching. No external manual.",
  },
  {
    icon: AlertTriangle,
    title: "Real-Time Diagnostics",
    desc: "Catches missing line numbers, unmatched parentheses, invalid axis values, and feed-rate omissions before the program reaches the machine.",
  },
  {
    icon: Layers,
    title: "Live Sidebar — 5 Views",
    desc: "Operations, Tools, Offsets, Canned Cycles, and Alarms & Warnings — all updating in real time as you type. Click any item to jump to its line.",
  },
  {
    icon: FileCode2,
    title: "Macro B Parser",
    desc: "Variables (#1, #100, #5041), arithmetic expressions, and control flow (IF, WHILE, GOTO) correctly tokenized and evaluated. No false positives.",
  },
  {
    icon: Sparkles,
    title: "MCP Integration",
    desc: "Exposed as MCP tools so AI agents (Claude, Cursor, Windsurf) can validate G-code, explain operations, and suggest optimizations through natural language.",
  },
];

const MARKETPLACE_URL =
  "https://marketplace.visualstudio.com/items?itemName=WeCr8-Solutions.jobline-gcode";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JobLine G-Code Intelligence — VS Code Extension",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Windows, macOS, Linux",
  description:
    "Multi-dialect G-code and robot program intelligence for VS Code. Syntax highlighting, hover tooltips, live sidebar, diagnostics, and AI integration for CNC programmers.",
  url: "https://jobline.ai/features/vscode-gcode",
  downloadUrl: MARKETPLACE_URL,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function VSCodeGCode() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="JobLine G-Code Intelligence — Free VS Code Extension for CNC Programming"
        description="Multi-dialect G-code and robot program intelligence inside VS Code. Syntax highlighting, hover tooltips, live sidebar, diagnostics, and MCP integration for Fanuc, Haas, Siemens, Mazak, Okuma, Fanuc Robot TP, and ABB RAPID. Free to install."
        keywords="G-code VS Code extension, CNC programming IDE, Fanuc G-code editor, Haas G-code syntax, CNC code IntelliSense, G-code diagnostics, machinist code editor, Fanuc Robot TP, ABB RAPID"
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
              <Badge variant="outline" className="border-green-500/40 text-green-500 bg-green-500/10 gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Available Now
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              JobLine{" "}
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                G-Code Intelligence
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-8">
              Multi-dialect G-code and robot program intelligence inside VS Code. Syntax highlighting, hover tooltips,
              live sidebar, diagnostics, and AI integration — purpose-built for CNC programmers and manufacturing engineers.
              <strong className="text-foreground"> Free to install. No account required.</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="gap-2">
                <a href={MARKETPLACE_URL} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4" /> Install from VS Code Marketplace
                </a>
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/features/machine-connect")} className="gap-2">
                <Cpu className="w-4 h-4" /> See Machine Connect
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              Or press <code className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs">Ctrl+P</code> in VS Code and run:{" "}
              <code className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs">ext install WeCr8-Solutions.jobline-gcode</code>
            </p>
          </div>
        </section>

        {/* Supported Dialects */}
        <section className="py-12 sm:py-16 border-t border-border/50">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-2">Supported CNC Dialects & Robot Languages</h2>
            <p className="text-muted-foreground mb-8 max-w-xl">
              Five CNC dialects. Two robot languages. Each gets its own grammar, hover docs, and diagnostic ruleset.
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
              The G-Code extension provides the language intelligence layer. Pair it with{" "}
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
            <h2 className="text-2xl font-bold mb-6">Why CNC Programmers Choose JobLine G-Code Intelligence</h2>
            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
              {[
                "Free — no credit card, no account required",
                "Works offline — no cloud dependency for editing",
                "5 CNC dialects + 2 robot languages",
                "Catches errors before they reach the controller",
                "Hover docs eliminate manual-lookup time",
                "Live sidebar with 5 views updated as you type",
                "Macro B parser with expression evaluation",
                "AI agents can validate & explain your code via MCP",
                "Outline view for navigating large programs",
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

        <LeadCaptureBar sourcePage="vscode-gcode" />

        {/* CTA */}
        <section className="py-16 sm:py-24 border-t border-border/50">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 border-green-500/40 text-green-500 bg-green-500/10 gap-1">
              <CheckCircle2 className="w-3 h-3" /> Free on VS Code Marketplace
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to Write Better G-Code?</h2>
            <p className="text-muted-foreground mb-6">
              Install JobLine G-Code Intelligence from the VS Code Marketplace. Five CNC dialects, two robot languages,
              hover tooltips, live sidebar, and Macro B parsing — all free.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="gap-2">
                <a href={MARKETPLACE_URL} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4" /> Install Free Extension
                </a>
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/blog/jobline-gcode-vs-code-extension-available")} className="gap-2">
                <ExternalLink className="w-4 h-4" /> Read the Launch Post
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
