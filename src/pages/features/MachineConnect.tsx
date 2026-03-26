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
  Cable,
  Wifi,
  Radio,
  Server,
  Activity,
  Shield,
  Cpu,
  Code,
  FlaskConical,
  Gauge,
  Bell,
  BarChart3,
} from "lucide-react";

const protocols = [
  {
    icon: Server,
    name: "FTP / SFTP",
    desc: "Upload and download programs to controllers with FTP support. Secure transfers with SFTP where the control supports it.",
  },
  {
    icon: Radio,
    name: "RS-232 Serial",
    desc: "Direct serial DNC for legacy controls. Configurable baud rate, parity, handshaking — handles drip-feed and block transfers.",
  },
  {
    icon: Wifi,
    name: "Ethernet / Network",
    desc: "TCP/IP connectivity for modern CNCs. Shared network folder mapping, direct socket connections, and auto-discovery.",
  },
  {
    icon: Cable,
    name: "WebSocket Relay",
    desc: "Real-time bidirectional channel between VS Code and the JobLine platform. Streams machine snapshots, alarms, and DNC status.",
  },
];

const monitoringFeatures = [
  {
    icon: Activity,
    title: "Live Machine Status",
    desc: "Real-time spindle state, feed overrides, axis positions, and cycle progress streamed via FOCAS2 and MTConnect protocols.",
  },
  {
    icon: Bell,
    title: "Alarm & Event Streaming",
    desc: "Active alarms, operator messages, and machine events are relayed to the JobLine dashboard and surfaced as alerts for supervisors.",
  },
  {
    icon: Gauge,
    title: "OEE Data Collection",
    desc: "Captures cycle times, idle durations, and part counts at the source. Feeds directly into production analytics without manual entry.",
  },
  {
    icon: BarChart3,
    title: "Historical Snapshots",
    desc: "Machine state snapshots are stored in the backend for trend analysis, downtime root cause investigation, and shift-over-shift comparison.",
  },
  {
    icon: Shield,
    title: "Entitlement-Gated",
    desc: "Machine monitoring features are available on Enterprise plans. Non-entitled organizations see a clean upgrade prompt — no broken UI.",
  },
  {
    icon: Cpu,
    title: "MCP Tool Exposure",
    desc: "AI agents query machine state, send programs, and write shift notes through natural language via the jobline-mcp server.",
  },
];

const supportedControllers = [
  "Haas NGC",
  "Fanuc 0i / 30i / 31i",
  "Mazak Smooth / Matrix",
  "Siemens 840D sl",
  "Okuma OSP-P300",
  "Brother CNC",
  "DMG MORI CELOS",
  "Doosan Fanuc",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JobLine Machine Connect — VS Code Extension",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Windows, macOS, Linux",
  description:
    "DNC connectivity and real-time machine monitoring from VS Code. FTP, serial, network, FOCAS2, and MTConnect support for CNC machines.",
  url: "https://jobline.ai/features/machine-connect",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function MachineConnect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="JobLine Machine Connect — DNC & CNC Monitoring VS Code Extension"
        description="DNC program transfers and real-time CNC machine monitoring inside VS Code. FTP, serial, network, FOCAS2, and MTConnect support. Currently in beta."
        keywords="DNC software, CNC machine monitoring, FOCAS2 VS Code, MTConnect integration, CNC program transfer, DNC FTP serial, machine connect extension, CNC OEE tracking"
        canonical="/features/machine-connect"
        jsonLd={jsonLd}
      />

      <MarketingNav />

      <main>
        {/* Hero */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm">
                <Cable className="w-4 h-4" />
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
                Machine Connect
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-4">
              The transport layer between your CNC machines and the JobLine platform. DNC program transfers, live
              machine monitoring, alarm streaming — all from inside VS Code.
            </p>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 mb-8 text-sm text-amber-200 flex items-start gap-2">
              <FlaskConical className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
              <span>
                <strong>Beta Program</strong> — Machine Connect is in closed beta with manufacturing partners
                running Haas and Fanuc controls. We're validating protocol reliability, alarm mapping, and
                snapshot accuracy across real production environments before public release.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Join the Beta Waitlist <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/features/vscode-gcode")} className="gap-2">
                <Code className="w-4 h-4" /> See G-Code Extension
              </Button>
            </div>
          </div>
        </section>

        {/* DNC Protocols */}
        <section className="py-12 sm:py-16 border-t border-border/50">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-2">DNC Transfer Protocols</h2>
            <p className="text-muted-foreground mb-8 max-w-xl">
              Send programs to any CNC — legacy serial machines to modern networked controls. Station-specific
              connection profiles are persisted so operators don't reconfigure every session.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {protocols.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.name}
                    className="rounded-lg border border-border bg-card p-5 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                        <Icon className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">{p.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <AdPlacement slot="machine-connect-mid" className="my-8" />

        {/* Machine Monitoring */}
        <section className="py-12 sm:py-16 border-t border-border/50">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl font-bold mb-2">Real-Time Machine Monitoring</h2>
            <p className="text-muted-foreground mb-8 max-w-xl">
              Machine Connect doesn't just transfer files — it keeps a live data feed flowing from your CNC
              controls into the JobLine platform.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {monitoringFeatures.map((f) => {
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

        {/* Supported Controllers */}
        <section className="py-12 sm:py-16 border-t border-border/50 bg-card/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-bold mb-2 text-center">Tested Controllers</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-lg mx-auto">
              Beta testing is focused on these controller families. Additional controls are being added based on
              partner shop equipment.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {supportedControllers.map((c) => (
                <Badge
                  key={c}
                  variant="secondary"
                  className="text-sm px-3 py-1.5"
                >
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Architecture callout */}
        <section className="py-12 sm:py-16 border-t border-border/50">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-2xl font-bold mb-3">Two Extensions, One Platform</h2>
            <p className="text-muted-foreground mb-4 max-w-xl mx-auto">
              The{" "}
              <button onClick={() => navigate("/features/vscode-gcode")} className="text-primary hover:underline">
                G-Code extension
              </button>{" "}
              generates the language intelligence layer. Machine Connect handles the transport layer. Both feed
              data into the same JobLine backend — so supervisors see machine status on their dashboards, operators
              get handoff context, and AI agents can query everything through MCP tools.
            </p>
            <p className="text-sm text-muted-foreground italic">
              "The VS Code extension you use at your desk connects to the platform running on your Haas."
            </p>
          </div>
        </section>

        <LeadCaptureBar context="machine-connect" />

        {/* CTA */}
        <section className="py-16 sm:py-24 border-t border-border/50">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 border-amber-500/40 text-amber-500 bg-amber-500/10 gap-1">
              <FlaskConical className="w-3 h-3" /> Currently in Beta
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Connect Your Machines</h2>
            <p className="text-muted-foreground mb-6">
              We're onboarding shops with Haas and Fanuc controls first, expanding to additional brands based on
              demand. Sign up and tell us what you're running.
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
