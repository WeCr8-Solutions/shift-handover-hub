import { Helmet } from "react-helmet-async";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const EFFECTIVE_DATE = "April 22, 2026";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Privacy Policy | JobLine.ai</title>
        <meta
          name="description"
          content="How JobLine.ai collects, uses, and protects personal data across shift handovers, ERP connectors, talent network, and learning systems."
        />
        <link rel="canonical" href="https://jobline.ai/privacy" />
      </Helmet>

      <MarketingNav />

      <main className="container mx-auto max-w-4xl px-4 py-16">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Effective: {EFFECTIVE_DATE}</p>

          <p>
            This Privacy Policy describes how <strong>WeCr8 Solutions LLC</strong> d/b/a JobLine.ai
            ("<strong>JobLine</strong>") collects, uses, discloses, and safeguards personal information
            in connection with jobline.ai and the JobLine platform.
          </p>

          <h2>1. Information We Collect</h2>
          <ul>
            <li>
              <strong>Account data:</strong> name, email, password hash, organization, role, profile
              photo.
            </li>
            <li>
              <strong>Operational data:</strong> shift handovers, work orders, NCRs, queue items,
              station assignments, KPIs.
            </li>
            <li>
              <strong>ERP data (read-through):</strong> processed in-memory only, not persisted to our
              database for ITAR/FedRAMP-sensitive customers.
            </li>
            <li>
              <strong>Talent / GCA / OAP data:</strong> resumes, machine experience, test attempts,
              certificates, mentor sign-offs.
            </li>
            <li>
              <strong>Billing data:</strong> tokenized payment methods (Stripe), billing email,
              invoices. Card numbers never touch our servers.
            </li>
            <li>
              <strong>Device & usage:</strong> IP, browser, OS, timestamps, page paths, feature
              interactions, error logs.
            </li>
            <li>
              <strong>Cookies & similar:</strong> see <a href="/cookies">Cookie Policy</a>.
            </li>
          </ul>

          <h2>2. How We Use Information</h2>
          <ul>
            <li>Provide, maintain, secure, and improve the Service.</li>
            <li>Process transactions and send transactional emails (via Resend).</li>
            <li>Power AI planning context (read-through, in-memory; never used to train third-party models).</li>
            <li>Detect fraud, abuse, and unauthorized access.</li>
            <li>Comply with legal obligations and enforce our Terms.</li>
          </ul>

          <h2>3. Legal Bases (EEA / UK)</h2>
          <p>Contract performance, legitimate interests (security, product improvement), consent (marketing/non-essential cookies), and legal obligation.</p>

          <h2>4. Sharing</h2>
          <ul>
            <li>
              <strong>Sub-processors:</strong> Lovable Cloud (Supabase) for hosting/database, Stripe
              (payments), Resend (email), Google (Analytics + Consent Mode v2 when consented), AI
              Gateway (Google/OpenAI models for AI Assistant).
            </li>
            <li>
              <strong>Within your organization:</strong> data is shared per role-based access and RLS
              policies.
            </li>
            <li>
              <strong>Public profiles:</strong> only operators who opt-in to public visibility on
              /talent/:username; contact info remains masked.
            </li>
            <li>
              <strong>Legal:</strong> when compelled by valid legal process or to protect rights, safety,
              and security.
            </li>
            <li>We do not sell personal information.</li>
          </ul>

          <h2>5. ITAR & Export-Controlled Data</h2>
          <p>
            ITAR-flagged organizations operate in read-through mode; controlled technical data is not
            copied into our commercial database. Access is gated behind the US-Person Declaration. For
            workloads requiring CMMC Level 2+, contact compliance@jobline.ai for self-hosted/GovCloud
            deployment terms.
          </p>

          <h2>6. Data Retention</h2>
          <ul>
            <li>Account & operational data: retained for the life of the subscription + 30 days.</li>
            <li>Audit logs: 24 months.</li>
            <li>Issued certificates: indefinitely (so verification links remain valid), unless revoked.</li>
            <li>Backups: rolling 30-day window.</li>
          </ul>

          <h2>7. Security</h2>
          <p>
            Row-Level Security on every table, encryption in transit (TLS 1.2+) and at rest (AES-256),
            MFA enrollment gates, audit logging, principle-of-least-privilege RLS, and database triggers
            enforcing state-machine and persistence-mode invariants.
          </p>

          <h2>8. Your Rights</h2>
          <p>
            Subject to applicable law (GDPR, UK GDPR, CPRA/CCPA, PIPEDA, others) you may request access,
            correction, deletion, portability, restriction, or objection. EU/UK residents may lodge a
            complaint with their supervisory authority. Email{" "}
            <a href="mailto:privacy@jobline.ai">privacy@jobline.ai</a> — we will respond within 30 days.
          </p>

          <h2>9. International Transfers</h2>
          <p>
            Data is processed in the United States. Where data is transferred from the EEA/UK, we rely
            on Standard Contractual Clauses or equivalent safeguards.
          </p>

          <h2>10. Children</h2>
          <p>The Service is not directed to children under 16. We do not knowingly collect data from minors.</p>

          <h2>11. Changes</h2>
          <p>Material changes will be announced via in-app notice or email at least 14 days before taking effect.</p>

          <h2>12. Contact</h2>
          <p>
            <strong>WeCr8 Solutions LLC</strong> · privacy@jobline.ai · DPO inquiries:
            dpo@jobline.ai
          </p>
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
}
