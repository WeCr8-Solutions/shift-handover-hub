import { Helmet } from "react-helmet-async";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { openCookiePreferences } from "@/lib/consent";

const EFFECTIVE_DATE = "April 22, 2026";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Cookie Policy | JobLine.ai</title>
        <meta
          name="description"
          content="JobLine.ai cookie usage, categories, and Google Consent Mode v2 controls."
        />
        <link rel="canonical" href="https://jobline.ai/cookies" />
      </Helmet>

      <MarketingNav />

      <main className="container mx-auto max-w-4xl px-4 py-16">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Cookie Policy</h1>
          <p className="text-muted-foreground">Effective: {EFFECTIVE_DATE}</p>

          <p>
            JobLine.ai uses cookies and similar technologies (localStorage, sessionStorage, pixels) to
            operate the Service, remember preferences, and—only with your consent—measure performance and
            improve marketing. We implement{" "}
            <strong>Google Consent Mode v2</strong> with a default-deny posture: until you click
            "Accept", non-essential storage is blocked and Google tags run in cookieless "denied" mode.
          </p>

          <div className="not-prose my-6">
            <Button onClick={openCookiePreferences} variant="default">
              Manage cookie preferences
            </Button>
          </div>

          <h2>Categories</h2>

          <h3>1. Strictly Necessary (always on)</h3>
          <ul>
            <li><code>sb-*</code> — Supabase auth session (login, RLS).</li>
            <li><code>jobline_consent</code> — your consent choices.</li>
            <li><code>jobline_team_*</code>, <code>jobline_org_*</code> — selected workspace context.</li>
          </ul>

          <h3>2. Functional (consent required)</h3>
          <ul>
            <li>UI preferences (theme, sidebar collapse, dismissed banners).</li>
            <li>Onboarding state (welcome modal seen, tour completed).</li>
          </ul>

          <h3>3. Analytics (consent required)</h3>
          <ul>
            <li>
              <strong>Google Analytics 4</strong> — page views, feature usage, performance. Runs in{" "}
              <em>denied</em> mode until consent is granted (no <code>_ga</code> cookies set).
            </li>
          </ul>

          <h3>4. Marketing / Ad (consent required)</h3>
          <ul>
            <li>
              <strong>Google Ads / Floodlight</strong> — conversion measurement on marketing pages only.
              Disabled inside the authenticated app.
            </li>
          </ul>

          <h2>Google Consent Mode v2 Signals</h2>
          <p>We pass the following signals to Google tags based on your choices:</p>
          <ul>
            <li><code>ad_storage</code> — Marketing</li>
            <li><code>ad_user_data</code> — Marketing</li>
            <li><code>ad_personalization</code> — Marketing</li>
            <li><code>analytics_storage</code> — Analytics</li>
            <li><code>functionality_storage</code> — Functional</li>
            <li><code>personalization_storage</code> — Functional</li>
            <li><code>security_storage</code> — Always granted (necessary)</li>
          </ul>

          <h2>Do Not Track / Global Privacy Control</h2>
          <p>
            We honor the GPC signal: when your browser sends <code>Sec-GPC: 1</code>, all non-essential
            categories default to denied and we treat it as an opt-out of "sale/sharing" under CPRA.
          </p>

          <h2>Withdrawing Consent</h2>
          <p>
            Use the "Manage cookie preferences" button above at any time, or clear site data in your
            browser. Withdrawal does not affect prior lawful processing.
          </p>

          <h2>Contact</h2>
          <p>privacy@jobline.ai</p>
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
}
