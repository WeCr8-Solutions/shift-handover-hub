import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, XCircle, Zap, Sparkles, ShieldCheck, FileSpreadsheet, FileText, Database } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { WhyJoblineFAQ } from "@/components/marketing/WhyJoblineFAQ";

const matrix = [
  { dim: "Time to value",        jobline: "Under 1 hour",  sap: "6–18 months",   jobboss: "3–9 months",   epicor: "6–12 months", proshop: "2–4 months", globalshop: "4–9 months", e2: "1–3 months", excel: "Already 'live' (and already wrong)" },
  { dim: "First-year cost band", jobline: "Free → low SaaS", sap: "$100k–$1M+",  jobboss: "$20k–$100k+",  epicor: "$50k–$500k+", proshop: "$30k–$150k", globalshop: "$50k–$300k", e2: "$15k–$60k", excel: "Hidden / labor" },
  { dim: "Built for shop floor", jobline: "Yes — operator first", sap: "No — finance first", jobboss: "Office first", epicor: "Office first", proshop: "Partial", globalshop: "Office first", e2: "Partial", excel: "No" },
  { dim: "Mobile / tablet ready",jobline: "Yes — gloved hands", sap: "Limited", jobboss: "Limited", epicor: "Limited", proshop: "Yes", globalshop: "Limited", e2: "Limited", excel: "Painful" },
  { dim: "Adapts to process change", jobline: "Config, minutes", sap: "Change order, months", jobboss: "Custom dev", epicor: "Custom dev", proshop: "Structured rework", globalshop: "Custom dev", e2: "Limited", excel: "Manual rewrite" },
  { dim: "AI planning assistant", jobline: "Yes — built in", sap: "Add-on", jobboss: "No", epicor: "Add-on", proshop: "No", globalshop: "No", e2: "No", excel: "No" },
  { dim: "ITAR / AS9100 posture",jobline: "Org-level toggle + RLS", sap: "Configurable, costly", jobboss: "Manual", epicor: "Configurable", proshop: "Manual", globalshop: "Manual", e2: "Manual", excel: "Not compliant" },
  { dim: "Support model",         jobline: "Direct from product team", sap: "Consultants + tickets", jobboss: "Tickets", epicor: "Tickets", proshop: "Mixed", globalshop: "Tickets", e2: "Tickets", excel: "DIY" },
];

const compareCards = [
  { href: "/compare/sap-alternative",          label: "vs. SAP",            desc: "For shops told S/4HANA is the only modern path." },
  { href: "/compare/jobboss-alternative",      label: "vs. JobBOSS2",       desc: "For shops escaping a 3–9 month ECI rollout." },
  { href: "/compare/epicor-alternative",       label: "vs. Epicor Kinetic", desc: "For shops whose ERP never made it to the floor." },
  { href: "/compare/proshop-alternative",      label: "vs. ProShop ERP",    desc: "For shops that want execution value in week one." },
  { href: "/compare/global-shop-alternative",  label: "vs. Global Shop",    desc: "For shops done with on-prem servers and VPNs." },
  { href: "/compare/e2-shop-alternative",      label: "vs. E2 / Shoptech",  desc: "For shops where E2 quotes but the floor still drifts." },
  { href: "/compare/spreadsheet-alternative",  label: "vs. Spreadsheets",   desc: "For shops where the whiteboard is the real source of truth." },
];

const featureCards = [
  { href: "/features/manufacturing-scheduling-software", label: "Manufacturing Scheduling" },
  { href: "/features/work-center-scheduling",            label: "Work-Center Scheduling" },
  { href: "/features/digital-expeditor",                 label: "Digital Expeditor" },
  { href: "/features/shift-handoff",                     label: "Shift Handoff" },
  { href: "/features/machine-monitoring-software",       label: "Machine Monitoring" },
  { href: "/features/job-shop-erp",                      label: "Job Shop ERP Layer" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Why JobLine.ai — small & mid-size shops vs. SAP, JobBOSS, Epicor",
  description:
    "Why small and mid-size machine shops pick JobLine.ai over SAP, JobBOSS, Epicor, ProShop, Global Shop, E2, and spreadsheets. Comparison matrix, adaptability story, and an expanded FAQ.",
  url: "https://jobline.ai/why-jobline",
};

export default function WhyJobline() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Why JobLine.ai — Built for Small & Mid-Size Shops"
        description="Why small and mid-size shops choose JobLine.ai over SAP, JobBOSS, Epicor, ProShop, Global Shop, E2 and spreadsheets — faster setup, lower cost, operator-first UX, and an execution layer that adapts as your shop changes."
        keywords="why JobLine, JobLine.ai vs SAP, JobLine.ai vs JobBOSS, small shop ERP alternative, mid-size machine shop software, operator-first MES, adaptable shop floor software, ERP alternative job shop"
        canonical="/why-jobline"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Sparkles className="w-4 h-4" /> Why JobLine.ai
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              The shop-floor software{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                small & mid-size shops actually keep using
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl">
              SAP, JobBOSS, Epicor, ProShop, Global Shop and E2 were built for enterprises with IT departments and 6–18 month
              rollouts. JobLine.ai is built for the 1–50 machine shop that needs visibility this week — and the ability to
              change routings, frameworks, and integrations next week without filing a change order.
            </p>
            <div className="flex flex-wrap gap-4 mb-12">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start free <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} className="gap-2">
                <Zap className="w-5 h-5" /> See pricing
              </Button>
            </div>
          </div>
        </section>

        <AdPlacement format="horizontal" className="py-4" />

        <section id="matrix" className="py-12">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-2xl font-bold mb-2">At-a-glance comparison</h2>
            <p className="text-muted-foreground mb-6">
              Click any column header to jump to the full breakdown.
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm border-collapse min-w-[900px]">
                <thead className="bg-secondary/40">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Dimension</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">JobLine.ai</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground"><Link to="/compare/sap-alternative" className="hover:text-primary">SAP</Link></th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground"><Link to="/compare/jobboss-alternative" className="hover:text-primary">JobBOSS2</Link></th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground"><Link to="/compare/epicor-alternative" className="hover:text-primary">Epicor</Link></th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground"><Link to="/compare/proshop-alternative" className="hover:text-primary">ProShop</Link></th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground"><Link to="/compare/global-shop-alternative" className="hover:text-primary">Global Shop</Link></th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground"><Link to="/compare/e2-shop-alternative" className="hover:text-primary">E2</Link></th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground"><Link to="/compare/spreadsheet-alternative" className="hover:text-primary">Excel</Link></th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row, i) => (
                    <tr key={i} className="border-t border-border/50 hover:bg-card/50">
                      <td className="py-3 px-4 font-medium">{row.dim}</td>
                      <td className="py-3 px-4 text-status-ok">
                        <span className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{row.jobline}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground"><span className="inline-flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive flex-shrink-0" />{row.sap}</span></td>
                      <td className="py-3 px-4 text-muted-foreground"><span className="inline-flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive flex-shrink-0" />{row.jobboss}</span></td>
                      <td className="py-3 px-4 text-muted-foreground"><span className="inline-flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive flex-shrink-0" />{row.epicor}</span></td>
                      <td className="py-3 px-4 text-muted-foreground"><span className="inline-flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive flex-shrink-0" />{row.proshop}</span></td>
                      <td className="py-3 px-4 text-muted-foreground"><span className="inline-flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive flex-shrink-0" />{row.globalshop}</span></td>
                      <td className="py-3 px-4 text-muted-foreground"><span className="inline-flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive flex-shrink-0" />{row.e2}</span></td>
                      <td className="py-3 px-4 text-muted-foreground"><span className="inline-flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive flex-shrink-0" />{row.excel}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="small-shops" className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">Built for shops under 50 machines</h2>
            <p className="text-muted-foreground mb-8">
              Big-ERP vendors assume you have a Director of IT, a six-month change-management cycle, and a budget that
              survives a board meeting. Owner-operated and mid-size shops don't. JobLine.ai is sized, priced and supported
              for the way your shop actually runs.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "An owner or supervisor can stand up the whole shop floor in an afternoon — no consultants",
                "Month-to-month SaaS, transparent pricing, no implementation fees",
                "Mobile-first UI designed for operators with gloves and dirty hands",
                "Direct support from the product team, not a tier-3 ticket queue",
                "Free for the first 14 days, then per-seat pricing tuned for shops of 5–50 people",
                "No Windows server, no VPN, no SQL Server license — runs in any browser",
              ].map((b, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="w-5 h-5 text-status-ok mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="adapts" className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">Adapts as your shop — and the industry — changes</h2>
            <p className="text-muted-foreground mb-8">
              Manufacturing frameworks shift constantly. A new aerospace customer wants AS9100. ITAR or US-Person Declaration
              becomes a contract requirement. FedRAMP enters the conversation. A big ERP responds with a 6-month rework. We
              respond with a toggle.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { t: "Routings & work centers", d: "Add, remove, reorder operations live without breaking in-flight jobs." },
                { t: "Handoff fields & quality gates", d: "Add a new inspection checkpoint or shift-handoff field in seconds." },
                { t: "ERP integrations", d: "JobBOSS and SAP connectors are read-through by default, opt-in write-through, switchable any time." },
                { t: "Compliance toggles", d: "ITAR org flag forces read-through ERP automatically. US-Person declaration is non-blocking by design." },
                { t: "Roles & access", d: "8-tier security model — operator, supervisor, admin, billing, developer, platform — without custom code." },
                { t: "AI planning assistant", d: "Cross-references controller family, machine type, and capability to answer 'where can I move this program?'" },
              ].map((c, i) => (
                <div key={i} className="p-4 rounded-lg bg-card border border-border">
                  <h3 className="font-semibold mb-1">{c.t}</h3>
                  <p className="text-sm text-muted-foreground">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="audit-ready" className="py-12 bg-secondary/20 border-y border-border">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <span className="text-xs uppercase tracking-wider font-semibold text-primary">Audit-ready exports</span>
            </div>
            <h2 className="text-2xl font-bold mb-4">AS9100, ISO 9001 & ITAR audits — exported in one click</h2>
            <p className="text-muted-foreground mb-6">
              Every work order, routing step, shift handoff, downtime event, NCR, quality inspection, queue change, and
              station session is captured automatically. When an AS9100 surveillance audit lands on the calendar, your
              supervisor opens <Link to="/admin?tab=history" className="text-primary hover:underline">Admin → History</Link>,
              picks the month, picks the standard, and exports the binder. No SQL, no consultant, no scrambling.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> What's captured</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>· Work orders & routing steps (8.5.1, 8.5.2)</li>
                  <li>· Shift handoffs, operator sessions, downtime (8.5)</li>
                  <li>· NCRs & quality inspections (8.7, 9.1, 10.2)</li>
                  <li>· Queue changes — every action stamped by user (audit trail)</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> How you export it</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>· <strong>Excel</strong> — one sheet per record type + cover sheet with clause map</li>
                  <li>· <strong>CSV bundle</strong> — .zip of one CSV per record type for ETQ, Greenlight Guru, eMaint</li>
                  <li>· <strong>QuickBooks CSV</strong> — monthly reconciliation, drop-in import</li>
                  <li>· <strong>JSON / PDF / Print HTML</strong> — for binder or downstream systems</li>
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {["Excel", "CSV bundle", "QuickBooks", "JSON", "PDF", "Print"].map((f) => (
                <span key={f} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{f}</span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Filter by month, station, team, or audit standard (AS9100 / ISO 9001 / ITAR / FDA 21 CFR 820). Deep-link
              your auditor straight to the right view —{" "}
              <code className="text-xs">/admin?tab=history&amp;month=2026-05&amp;std=AS9100&amp;view=stations</code>.
            </p>
          </div>
        </section>


        <AdPlacement format="horizontal" className="py-4" />

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">How we compare, one system at a time</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-12">
              {compareCards.map((c) => (
                <Link key={c.href} to={c.href} className="group p-5 rounded-xl bg-card border border-border hover:border-primary transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold group-hover:text-primary">{c.label}</h3>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                </Link>
              ))}
            </div>

            <h2 className="text-2xl font-bold mb-4">See the proof — feature pages</h2>
            <div className="grid sm:grid-cols-3 gap-3 mb-12">
              {featureCards.map((f) => (
                <Link key={f.href} to={f.href} className="px-4 py-3 rounded-lg bg-secondary/40 border border-border hover:border-primary text-sm hover:text-primary transition-colors">
                  {f.label} →
                </Link>
              ))}
            </div>

            <LeadCaptureBar sourcePage="why-jobline" className="mb-12" />

            <WhyJoblineFAQ variant="general" hideRelated />

            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20 mt-12">
              <h2 className="text-2xl font-bold mb-3">Try it on your shop before the SAP demo even gets scheduled</h2>
              <p className="text-muted-foreground mb-6">Free for 14 days. Live in under an hour. Cancel any time.</p>
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start free <ArrowRight className="w-5 h-5" />
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
