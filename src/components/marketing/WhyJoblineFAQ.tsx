import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Zap, RefreshCw, Wrench, ShieldCheck } from "lucide-react";

export type CompareVariant =
  | "jobboss"
  | "sap"
  | "epicor"
  | "proshop"
  | "globalshop"
  | "e2"
  | "spreadsheet"
  | "general";

type FAQ = { q: string; a: string };

const GENERAL_FAQS: FAQ[] = [
  {
    q: "Why is JobLine.ai a better fit for small and mid-size shops than SAP, JobBOSS or Epicor?",
    a: "Tier-1 ERPs are built for finance and procurement teams at companies with dedicated IT departments. They assume a 6–18 month implementation, a five- or six-figure first-year spend, and a full-time admin. JobLine.ai is built shop-floor-first for shops under ~50 machines — set up by an owner or supervisor in under an hour, paid month-to-month, with no consultants required.",
  },
  {
    q: "How quickly can JobLine.ai adapt when our processes or frameworks change?",
    a: "Routing steps, work centers, handoff fields, queues, dashboards, and integrations are configuration — not custom code. Adding a new customer flow, a new cert standard (AS9100, ISO 9001), or restructuring teams takes minutes, not a change-order. Even ERP connectors (JobBOSS, SAP) and compliance toggles (ITAR / US-Person Declaration) ship as switches you flip, not multi-month re-implementations.",
  },
  {
    q: "Do we have to replace our existing ERP or accounting system?",
    a: "No. JobLine.ai is the execution layer that lives on top of whatever you already use. Most shops keep QuickBooks for invoicing and either keep JobBOSS / SAP / Epicor for quoting and POs, or drop them entirely. See the integration model on the /features/job-shop-erp page.",
  },
  {
    q: "What happens to our data if we ever leave?",
    a: "It's yours. Work orders, handoffs, routings, and quality records can be exported as CSV or JSON from the admin area. No proprietary file formats, no exit fees, no 90-day data hostage clauses.",
  },
  {
    q: "Is JobLine.ai safe for ITAR or AS9100 shops?",
    a: "Yes. ITAR organizations are flagged at the org level and forced into read-through mode for ERP data (no shop-floor data is persisted outside the controlled boundary). Every table is RLS-isolated by org, all roles audit through a single hierarchy, and the FedRAMP-readiness path is published in our enterprise docs.",
  },
  {
    q: "Does JobLine.ai work on phones and tablets on the shop floor?",
    a: "Yes — that's the design center. Operators update jobs from a phone or shop tablet with gloved hands; supervisors see live dashboards on a wall display. No installable client, no Windows server.",
  },
  {
    q: "What's the real cost vs. a traditional ERP?",
    a: "Most small and mid-size shops pay less per month for JobLine.ai than a single hour of ERP consulting. There's a free trial, transparent monthly pricing on the /pricing page, and no implementation fees.",
  },
  {
    q: "Can JobLine.ai produce AS9100 or ISO 9001 audit evidence on demand?",
    a: "Yes — that's a core capability. The Audit & History Center in /admin?tab=history bundles work orders, routing steps, shift handoffs, downtime events, NCRs, quality inspections, queue changes, and station sessions for any month, mapped to AS9100 / ISO 9001 / ITAR / FDA 21 CFR 820 clauses, and exports them as Excel, CSV bundle, QuickBooks CSV, JSON, or PDF in a single click. No SQL, no consultant.",
  },
  {
    q: "Can we export by month for QuickBooks reconciliation or auditor binders?",
    a: "Yes. Every export is month-scoped (or any custom range) and stamped with the organization, period, standard, and generator. QuickBooks-format CSV imports cleanly into invoicing; the Excel bundle is a one-file binder with one tab per record type plus a cover sheet that maps each clause to the evidence inside.",
  },
];

const VARIANT_EXTRA: Record<Exclude<CompareVariant, "general">, FAQ[]> = {
  jobboss: [
    {
      q: "We already pay for JobBOSS2 — can we run JobLine.ai alongside it?",
      a: "Yes. Many shops keep JobBOSS for estimating and accounting and use JobLine.ai for the shop-floor execution layer JobBOSS was never designed for. Our JobBOSS connector pulls work orders read-through with zero double-entry.",
    },
    {
      q: "Will my JobBOSS data be locked in if we adopt JobLine.ai?",
      a: "No. The JobBOSS connector is read-through by default — your system of record stays JobBOSS until you decide otherwise. You can switch persistence modes (or turn the connector off) at any time.",
    },
  ],
  sap: [
    {
      q: "SAP told us S/4HANA is the only modern path. Why pick JobLine.ai instead?",
      a: "S/4HANA Cloud or Business One is a great financial backbone for an enterprise — and a poor fit for a 30-machine shop floor. JobLine.ai handles shop-floor execution far better than SAP's PP/PM modules and connects back to SAP (OAuth client_credentials) so finance keeps its source of truth.",
    },
    {
      q: "How does the SAP connector work?",
      a: "Production tenants authenticate over OAuth client_credentials. By default we run read-through (no SAP data persisted in JobLine), with write-through to the queue as an opt-in for non-ITAR orgs. ITAR orgs are forced read-through automatically.",
    },
  ],
  epicor: [
    {
      q: "We're on Epicor Kinetic — does JobLine.ai replace it?",
      a: "Not necessarily. Keep Epicor for accounting and quoting; use JobLine.ai for what Kinetic's MES module struggles with — real-time operator updates, structured shift handoffs, and live work-center dashboards.",
    },
  ],
  proshop: [
    {
      q: "ProShop ERP is also marketed to small shops — what's different?",
      a: "ProShop is a heavy paperless-ERP suite that takes months of structuring before it pays off. JobLine.ai focuses on the execution layer (queues, handoffs, dashboards, quality gates) so you see value in week one, and you can adopt the rest of our modules at your own pace.",
    },
  ],
  globalshop: [
    {
      q: "Global Shop Solutions is on-prem — does JobLine.ai require any IT?",
      a: "None. JobLine.ai is cloud-native SaaS. No Windows server, no SQL Server install, no VPN tunnels, no IT staff. An owner with a laptop can stand up the whole shop floor in an afternoon.",
    },
  ],
  e2: [
    {
      q: "We're on E2 / Shoptech — can JobLine.ai add the shop-floor piece we're missing?",
      a: "Yes. Most E2 shops still run the actual floor on whiteboards and verbal handoffs. JobLine.ai layers on top of E2 to give operators a live queue, structured handoffs, and quality gates — without touching your existing E2 estimating workflow.",
    },
  ],
  spreadsheet: [
    {
      q: "Our spreadsheet 'works.' Why bring in another tool at all?",
      a: "If it truly worked you wouldn't be reading this page. The hidden cost of spreadsheets isn't the file — it's the reconciliation meeting every morning, the second whiteboard everyone actually trusts, and the bad decisions made on stale data. JobLine.ai eliminates that overhead with a tool operators actually update.",
    },
    {
      q: "Can we keep the spreadsheet as a backup during the switch?",
      a: "Absolutely — most shops do for the first week. By week two the spreadsheet is stale because nobody bothers updating it anymore.",
    },
  ],
};

const RELATED: { href: string; label: string }[] = [
  { href: "/why-jobline", label: "Why JobLine.ai" },
  { href: "/compare/jobboss-alternative", label: "vs. JobBOSS2" },
  { href: "/compare/sap-alternative", label: "vs. SAP" },
  { href: "/compare/epicor-alternative", label: "vs. Epicor Kinetic" },
  { href: "/compare/proshop-alternative", label: "vs. ProShop" },
  { href: "/compare/global-shop-alternative", label: "vs. Global Shop" },
  { href: "/compare/e2-shop-alternative", label: "vs. E2 / Shoptech" },
  { href: "/compare/spreadsheet-alternative", label: "vs. Spreadsheets" },
];

interface Props {
  variant?: CompareVariant;
  /** Hide the "Other comparisons" footer strip (e.g. on /why-jobline itself). */
  hideRelated?: boolean;
}

export function WhyJoblineFAQ({ variant = "general", hideRelated = false }: Props) {
  const faqs: FAQ[] =
    variant === "general"
      ? GENERAL_FAQS
      : [...VARIANT_EXTRA[variant], ...GENERAL_FAQS];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section id="why-jobline-faq" className="mt-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Adaptability strip */}
      <div id="adaptability" className="grid sm:grid-cols-3 gap-4 mb-12">
        {[
          { icon: Zap, title: "Live in under an hour", desc: "Owner or supervisor self-serve. No consultants, no IT department, no SOW." },
          { icon: RefreshCw, title: "Adapts as you change", desc: "Routings, work centers, handoff fields, dashboards — all configuration, not custom code." },
          { icon: Wrench, title: "Built for shops under 50 machines", desc: "Priced and scoped for owner-operated and mid-size shops, not Fortune 500 plants." },
        ].map((c, i) => (
          <div key={i} className="p-5 rounded-xl bg-card border border-border">
            <c.icon className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-semibold mb-1">{c.title}</h3>
            <p className="text-sm text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </div>

      <h2 id="faq" className="text-2xl font-bold mb-6">More questions shops ask before switching</h2>
      <Accordion type="single" collapsible className="mb-12">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left font-medium">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {!hideRelated && (
        <div className="p-6 rounded-xl bg-secondary/30 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Comparing JobLine.ai to other systems?</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {RELATED.map((r) => (
              <Link
                key={r.href}
                to={r.href}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-background border border-border text-sm hover:border-primary hover:text-primary transition-colors"
              >
                {r.label} <ArrowRight className="w-3 h-3" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default WhyJoblineFAQ;
