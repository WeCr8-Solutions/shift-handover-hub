import { Helmet } from "react-helmet-async";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const EFFECTIVE_DATE = "April 22, 2026";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Terms of Service | JobLine.ai</title>
        <meta
          name="description"
          content="JobLine.ai Terms of Service governing use of shift handover, work order, ERP connector, talent network, GCA, and OAP services."
        />
        <link rel="canonical" href="https://jobline.ai/terms" />
      </Helmet>

      <MarketingNav />

      <main className="container mx-auto max-w-4xl px-4 py-16">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Effective: {EFFECTIVE_DATE}</p>

          <p>
            These Terms of Service ("<strong>Terms</strong>") govern access to and use of the JobLine.ai
            platform, websites (jobline.ai, dev.jobline.ai, docs.jobline.ai), mobile and desktop
            applications, edge functions, APIs, integrations, and all related services (collectively, the
            "<strong>Service</strong>") operated by <strong>WeCr8 Solutions LLC</strong> d/b/a JobLine.ai
            ("<strong>JobLine</strong>", "we", "us"). By creating an account, clicking "I agree", or using
            the Service, you and the entity you represent ("<strong>Customer</strong>", "you") agree to
            these Terms.
          </p>

          <h2>1. Eligibility & Accounts</h2>
          <ul>
            <li>You must be 18+ and authorized to bind your organization.</li>
            <li>You are responsible for safeguarding credentials and all activity under your account.</li>
            <li>You agree to provide accurate information and to keep it current.</li>
          </ul>

          <h2>2. The Service</h2>
          <p>
            JobLine provides a multi-tenant SaaS platform for manufacturing operations including: shift
            handovers, work order tracking, queue/Kanban scheduling, capacity planning, KPIs, NCR/quality
            workflows, AI planning assistance, ERP connectors (JobBOSS, SAP S/4HANA), the Talent Network,
            G-Code Academy ("<strong>GCA</strong>"), and the Operator Acceptance Program ("<strong>OAP</strong>").
          </p>

          <h2>3. ERP Connectors & Data Source of Truth</h2>
          <p>
            For Customers using a third-party ERP (e.g., JobBOSS, SAP), JobLine offers two persistence
            modes configurable per organization:
          </p>
          <ul>
            <li>
              <strong>Read-Through (default for ITAR/FedRAMP-sensitive orgs):</strong> ERP data is fetched
              in-memory and rendered to the dashboard without copying to JobLine's database. Your ERP
              remains the system of record.
            </li>
            <li>
              <strong>Write-Through:</strong> ERP records are mirrored into JobLine's database for
              offline-resilient operation, analytics, and AI enrichment. Not available to organizations
              flagged as requiring US-Person declarations.
            </li>
          </ul>
          <p>
            You represent that you have all rights necessary to authorize JobLine to access your ERP and
            transmit data through the connector. JobLine is not responsible for inaccuracies, gaps, or
            outages originating in third-party systems.
          </p>

          <h2>4. ITAR, Export Control & US-Person Restrictions</h2>
          <p>
            Customers handling defense articles or technical data subject to the International Traffic in
            Arms Regulations (22 CFR §§ 120–130) ("<strong>ITAR</strong>") must enable the ITAR flag in
            organization settings. When enabled:
          </p>
          <ul>
            <li>Persistence mode is locked to read-through; write-through attempts are rejected at the database trigger.</li>
            <li>Each user must complete the US-Person Declaration Gate prior to accessing controlled views.</li>
            <li>Customer is solely responsible for classification, licensing, and TAA/MLA compliance.</li>
          </ul>
          <p>
            JobLine's commercial cloud is <strong>not</strong> a substitute for an authorized GovCloud
            enclave. Customers requiring NIST SP 800-171 / CMMC Level 2+ environments should contact us
            for a self-hosted deployment under a separate addendum.
          </p>

          <h2>5. Talent Network, GCA & OAP</h2>
          <ul>
            <li>
              <strong>Talent Network:</strong> Operators control profile visibility (private,
              employers-only, public). Personal contact info is masked and never exposed publicly.
              Outreach must route through in-platform messaging.
            </li>
            <li>
              <strong>G-Code Academy (GCA):</strong> Self-study question banks. Certificate issuance is a
              one-time $12 USD Stripe charge per certificate. Certificates are publicly verifiable at
              /verify/:certId and contain no ITAR-sensitive data.
            </li>
            <li>
              <strong>Operator Acceptance Program (OAP):</strong> AS9100/ISO 9001/OSHA-aligned training
              with mentor sign-off. Recertification events are auditable. JobLine is not an accredited
              certification body; OAP completion is an internal qualification record only.
            </li>
            <li>
              <strong>Mentorship & Sign-off:</strong> Mentors warrant their assessments are accurate. We
              may revoke certificates obtained through fraud or misrepresentation.
            </li>
          </ul>

          <h2>6. Subscriptions, Billing & Trials</h2>
          <ul>
            <li>14-day free trial requires a valid payment method collected at signup.</li>
            <li>Subscriptions auto-renew until cancelled in account settings.</li>
            <li>Fees are non-refundable except where required by law.</li>
            <li>Tax may be added based on jurisdiction. Stripe is the payment processor.</li>
            <li>JobLine may modify pricing with 30 days' notice prior to renewal.</li>
          </ul>

          <h2>7. Customer Data & License</h2>
          <p>
            You retain all rights in data you submit ("<strong>Customer Data</strong>"). You grant
            JobLine a worldwide, non-exclusive license to host, process, transmit, and display Customer
            Data solely to provide and improve the Service. Aggregated, de-identified usage data may be
            used for analytics and product improvement.
          </p>

          <h2>8. AI Features</h2>
          <p>
            The AI Planning Assistant uses Lovable AI Gateway (Google Gemini / OpenAI models). For
            read-through orgs, ERP work-order context is fetched in-memory per request and not persisted.
            AI outputs are advisory only — supervisors must review and approve routing changes via the
            Routing Proposal Card workflow before they take effect.
          </p>

          <h2>9. Acceptable Use</h2>
          <p>You will not:</p>
          <ul>
            <li>Reverse-engineer, scrape, or attempt to circumvent rate limits or RLS.</li>
            <li>Upload malware, ITAR data into non-ITAR orgs, or unlawful content.</li>
            <li>Resell, sublicense, or use the Service to build a competing product.</li>
            <li>Impersonate other users or misrepresent organizational authority.</li>
          </ul>

          <h2>10. Third-Party Services</h2>
          <p>
            The Service integrates with Supabase (managed by Lovable Cloud), Stripe, Resend, Google
            Analytics, and ERP vendors. Your use of those services is governed by their own terms.
          </p>

          <h2>11. Intellectual Property</h2>
          <p>
            JobLine, the JobLine.ai logo, GCA, OAP, and all software, content, and trademarks are owned
            by WeCr8 Solutions LLC. No rights are granted except as expressly set forth in these Terms.
          </p>

          <h2>12. Confidentiality</h2>
          <p>
            Each party will protect the other's confidential information with at least the same degree of
            care it uses for its own (no less than reasonable care).
          </p>

          <h2>13. Warranty Disclaimer</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE". JOBLINE DISCLAIMS ALL WARRANTIES,
            EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
            AND NON-INFRINGEMENT.
          </p>

          <h2>14. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, JOBLINE'S AGGREGATE LIABILITY WILL NOT EXCEED THE
            FEES PAID BY CUSTOMER IN THE 12 MONTHS PRECEDING THE CLAIM. JOBLINE WILL NOT BE LIABLE FOR
            INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR LOST-PROFITS DAMAGES.
          </p>

          <h2>15. Indemnification</h2>
          <p>
            Customer will defend and indemnify JobLine against claims arising from Customer Data, ERP
            misconfiguration, ITAR misclassification, or violation of these Terms.
          </p>

          <h2>16. Term & Termination</h2>
          <p>
            Either party may terminate for material breach with 30 days' notice and an opportunity to
            cure. Upon termination, Customer may export data for 30 days; thereafter we may delete it.
          </p>

          <h2>17. Changes</h2>
          <p>
            We may update these Terms; material changes will be announced via in-app notice or email at
            least 14 days before taking effect.
          </p>

          <h2>18. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Florida, USA, excluding its conflicts
            rules. Venue lies in the state and federal courts located in Hillsborough County, Florida.
          </p>

          <h2>19. Contact</h2>
          <p>
            <strong>WeCr8 Solutions LLC</strong> · legal@jobline.ai · For DPA/BAA/ITAR addenda:
            compliance@jobline.ai
          </p>
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
}
