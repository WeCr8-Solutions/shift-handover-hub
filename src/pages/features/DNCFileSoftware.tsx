import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  Server,
  Radio,
  Wifi,
  Cable,
  FileCode,
  FolderOpen,
  ShieldCheck,
} from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";

const protocols = [
  {
    icon: Server,
    name: "FTP / SFTP",
    desc: "Upload and download G-code programs to CNC controllers with FTP support. Secure SFTP transfers where the control allows it.",
  },
  {
    icon: Radio,
    name: "RS-232 Serial (DNC)",
    desc: "Classic direct numerical control over serial. Configurable baud rate, parity, and handshaking — handles drip-feed and block transfers for older controls.",
  },
  {
    icon: Wifi,
    name: "Ethernet / Network Folder",
    desc: "TCP/IP for modern CNCs. Shared network folder mapping, direct socket connections, and auto-discovery for Fanuc, Haas, Mazak, and Siemens controls.",
  },
  {
    icon: Cable,
    name: "WebSocket Relay",
    desc: "Real-time bidirectional channel between the JobLine VS Code extension and the cloud platform. Transfers programs and streams machine status.",
  },
];

const benefits = [
  "Send and retrieve CNC programs from one central library",
  "RS-232 serial DNC for legacy controls — no new hardware needed",
  "FTP / SFTP transfers for modern Fanuc, Haas, and Siemens controls",
  "Network folder mapping for shared drive CNC file delivery",
  "Version-controlled G-code with revision history",
  "Audit trail of every program sent, when, and to which machine",
  "Integrates with the JobLine VS Code G-code extension",
  "Works across multi-machine, multi-department shops",
];

const features = [
  {
    icon: FileCode,
    title: "Central Program Library",
    desc: "Store all your G-code files in a searchable, version-controlled library. No more hunting network drives or USB sticks for the right revision.",
  },
  {
    icon: FolderOpen,
    title: "Program Version Control",
    desc: "Track every change to every program. See who updated it, when, and why. Roll back to any previous revision in seconds.",
  },
  {
    icon: ShieldCheck,
    title: "Transfer Audit Trail",
    desc: "Every file send is logged — operator, machine, timestamp, and program revision. Critical for aerospace, medical, and ITAR environments.",
  },
];

const faqs = [
  {
    q: "What is DNC software?",
    a: "DNC (Direct Numerical Control) software manages the transfer of CNC G-code programs from a host computer to CNC machine controllers. It replaces USB sticks and manual file copying with a controlled, auditable process.",
  },
  {
    q: "Can I transfer files to older CNC controls without Ethernet?",
    a: "Yes. The JobLine Machine Connect agent supports RS-232 serial communication for older Fanuc, Mazak, and other legacy controllers that don't have network connectivity.",
  },
  {
    q: "Does this work with Haas, Fanuc, Siemens, and Mazak?",
    a: "Yes. JobLine supports FTP-enabled Haas controls, Fanuc with FTP option, Siemens Sinumerik, and Mazak controls via FTP or shared folder. RS-232 covers older models of all brands.",
  },
  {
    q: "Is the VS Code extension required?",
    a: "No. The VS Code G-code extension is optional and designed for programmers who want to edit and transfer programs directly from their editor. DNC transfers also work through the JobLine web interface.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JobLine.ai DNC Software — CNC File Transfer",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "description":
    "DNC software and CNC file transfer system. Transfer G-code programs via RS-232, FTP, SFTP, or Ethernet to Fanuc, Haas, Siemens, and Mazak controls. Includes version control and audit trail.",
  "url": "https://jobline.ai/features/dnc-software",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

export default function DNCFileSoftware() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="DNC Software - CNC File Transfer & G-Code Program Management"
        description="DNC software for CNC file transfer. Send G-code programs to Fanuc, Haas, Siemens, and Mazak controls via RS-232, FTP, or Ethernet. Version control, audit trail, and central program library included."
        keywords="DNC software, DNC CNC file transfer, direct numerical control software, CNC program transfer, drip feed CNC software, CNC G-code transfer, DNC program management, CNC file management, RS-232 DNC, FTP CNC transfer"
        canonical="/features/dnc-software"
        jsonLd={jsonLd}
      />

      <MarketingNav />

      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Cable className="w-4 h-4" />
              RS-232 · FTP · Ethernet · WebSocket
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              DNC Software for{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                CNC File Transfer
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Stop transferring G-code programs with USB sticks and shared drives. JobLine.ai provides a
              controlled, version-tracked DNC file transfer system that works with legacy serial controls and
              modern networked machines alike.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/features/machine-connect")} className="gap-2">
                <Zap className="w-5 h-5" /> See Machine Connect
              </Button>
            </div>

            {/* Protocol Cards */}
            <div className="grid sm:grid-cols-2 gap-4 mb-16">
              {protocols.map((p, i) => (
                <div key={i} className="p-5 rounded-xl bg-card border border-border flex gap-4">
                  <p.icon className="w-7 h-7 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <AdPlacement format="horizontal" className="py-4" />

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-8 text-center">Beyond File Transfer</h2>
            <div className="grid sm:grid-cols-3 gap-6 mb-16">
              {features.map((f, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border text-center">
                  <f.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold mb-6">Supported Capabilities</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-16">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-status-ok mt-0.5 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <LeadCaptureBar sourcePage="dnc-software" className="mb-16" />

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
              <h2 className="text-2xl font-bold mb-3">Replace USB sticks with controlled DNC transfers</h2>
              <p className="text-muted-foreground mb-6">
                Free trial — supports RS-232, FTP, and Ethernet out of the box.
              </p>
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
