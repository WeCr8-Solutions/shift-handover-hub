/**
 * Open Graph / Twitter meta tag rewriter for social-media crawlers.
 *
 * Why this exists:
 *   This project is a Vite SPA. React-Helmet only sets meta tags client-side,
 *   but link-preview crawlers (iMessage, Slack, WhatsApp, Twitter/X, Facebook,
 *   LinkedIn, Discord) do NOT run JavaScript — they only read the static
 *   index.html. Without server-side rewriting, every shared link uses the
 *   generic site OG image.
 *
 * How it's wired:
 *   vercel.json rewrites bot-friendly routes (/, /talent, /talent/*, /oap,
 *   /oap/*, /gca, /gca/*, /gcode-academy, /verify/*) to /api/og. This handler
 *   inspects the User-Agent:
 *     - If the request is from a known social crawler, it returns rewritten
 *       HTML with route-specific og:* / twitter:* meta tags.
 *     - Otherwise it returns the original index.html so real users see the SPA.
 *
 * NOTE: This file replaces the old Next.js `middleware.ts` which never ran
 *       because Vercel only auto-executes middleware on Next.js projects.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "https://jobline.ai";
const SUPABASE_URL = "https://kgrstnbxqdmadtoankqr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtncnN0bmJ4cWRtYWR0b2Fua3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzM0MDgsImV4cCI6MjA4NTg0OTQwOH0.XmY5BDVKz2SBv4_MZk7lgrP5CJDSXeCl-PwDFoCwiik";

const BOT_UA =
  /facebookexternalhit|facebot|twitterbot|slackbot|linkedinbot|whatsapp|telegrambot|discordbot|skypeuripreview|applebot|pinterest|redditbot|embedly|quora link preview|outbrain|vkshare|w3c_validator|developers\.google\.com\/\+\/web\/snippet|baiduspider|bingbot|googlebot|yandexbot|duckduckbot|imessagebot|bot|crawler|spider|preview/i;

type Meta = {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
  /** Long-form, crawler-visible body content (plain text / minimal HTML). */
  body?: string;
};

const DEFAULT_META: Meta = {
  title:
    "JobLine.ai — Digital Expeditor & Smart Shift Handoff for Manufacturing",
  description:
    "Streamline CNC manufacturing operations. Track work orders, manage shift handoffs, and improve production floor communication.",
  image: `${BASE}/og-image.png`,
  url: `${BASE}/`,
  body: `
    <h1>JobLine.ai — Digital Expeditor &amp; Smart Shift Handoff for Manufacturing</h1>
    <p>JobLine.ai is a digital expeditor and shift-handoff platform built for CNC machine shops, precision manufacturers, and AS9100 / ISO 9001 / ITAR-aligned facilities. It replaces paper travelers, whiteboards, and tribal knowledge with structured work-order tracking, station-by-station routing, and auditable shift handoffs.</p>
    <h2>Core Modules</h2>
    <ul>
      <li><strong>Shift Handoff</strong> — structured operator-to-operator notes tied to work orders, stations, and shift boundaries.</li>
      <li><strong>Work Order Queue</strong> — Kanban, list, and calendar views with capacity planning and outside-processing (OP) tracking.</li>
      <li><strong>Routing &amp; Operations</strong> — 8-step routing with quantity accounting (Completed + Scrap + Rework = Original).</li>
      <li><strong>OAP — Operator Acceptance Program</strong> — AS9100 / ISO 9001 / OSHA-aligned operator certification with mentor sign-off.</li>
      <li><strong>GCA — G-Code Academy</strong> — self-paced CNC training across Fanuc, Haas, Mazak, Siemens, Heidenhain; 10 verified question banks.</li>
      <li><strong>Talent Network</strong> — free, verified shop-floor profiles with machines, controls, GD&amp;T skills, and OAP/GCA badges; employers can search and message verified operators.</li>
      <li><strong>Quality / NCR</strong> — non-conformance reporting with quantity-integrity enforcement.</li>
      <li><strong>AI Planning Assistant</strong> — context-aware routing analysis (Capability, Workload, Availability) with supervisor-approved routing changes.</li>
      <li><strong>ERP Connectors</strong> — read-through (default) or write-through integration with JobBOSS and SAP S/4HANA; ITAR orgs forced to read-through.</li>
    </ul>
    <h2>Who It's For</h2>
    <p>Small-to-mid CNC shops, aerospace and defense suppliers, ITAR-controlled facilities, and any precision manufacturer that needs clearer job visibility, traceable handoffs, and a hiring funnel for verified operators.</p>
  `,
};

function metaForPath(pathname: string): Meta | null {
  if (pathname === "/" || pathname === "") return DEFAULT_META;

  if (pathname === "/talent" || pathname === "/talent/") {
    return {
      title:
        "Talent Network — Verified CNC Operators & Machinists | JobLine.ai",
      description:
        "Free, verified shop-floor profiles for CNC operators and machinists. Browse public profiles with machines run, controls, GD&T skills, OAP & GCA badges, and work history.",
      image: `${BASE}/talent-og.jpg`,
      url: `${BASE}/talent`,
      body: `
        <h1>JobLine.ai Talent Network — Verified CNC Operators &amp; Machinists</h1>
        <p>The JobLine.ai Talent Network is a free-forever hiring marketplace for precision-manufacturing professionals. Operators build a verified shop-floor profile listing the machines they've run, the controls they know (Fanuc, Haas, Mazak, Siemens, Heidenhain, Okuma), their GD&amp;T proficiency, OAP (Operator Acceptance Program) certifications, and GCA (G-Code Academy) credentials.</p>
        <h2>For Operators</h2>
        <ul>
          <li>Free public profile at <code>/talent/&lt;username&gt;</code> with three-tier visibility (private / employers-only / public).</li>
          <li>Showcase verified credentials: OAP mentor sign-offs, GCA test scores, issued certificates with public verification URLs.</li>
          <li>Personal contact info (email, phone, address) is never public — all outreach routes through in-app messaging.</li>
          <li>Get discovered by hiring shops searching for specific machines, controls, or skills.</li>
        </ul>
        <h2>For Employers</h2>
        <ul>
          <li>Search verified operators by machine, control, location, and skill (authenticated, paid-tier).</li>
          <li>Message candidates with accept-gated replies — operators control who can contact them.</li>
          <li>Verify every credential against the public certificate registry at <code>/verify/&lt;certId&gt;</code>.</li>
        </ul>
        <h2>Privacy &amp; Trust</h2>
        <p>Profiles default to private. Operators choose what to publish. Contact details are masked even on public profiles. ITAR-sensitive data is never exposed.</p>
      `,
    };
  }
  if (pathname === "/oap" || pathname.startsWith("/oap/")) {
    return {
      title:
        "Operator Acceptance Program (OAP) — AS9100 / ISO 9001 Certification | JobLine.ai",
      description:
        "Structured CNC operator certification with mentor sign-off. Built for AS9100, ISO 9001, and OSHA-aligned shops.",
      image: `${BASE}/oap-og.jpg`,
      url: `${BASE}${pathname}`,
      body: `
        <h1>Operator Acceptance Program (OAP)</h1>
        <p>The Operator Acceptance Program is JobLine.ai's structured CNC operator certification system, designed for shops operating under AS9100, ISO 9001, and OSHA-aligned quality frameworks. It replaces ad-hoc operator sign-offs with a documented, auditable certification pipeline.</p>
        <h2>How It Works</h2>
        <ul>
          <li><strong>Course Library</strong> at <code>/oap/learn</code> — canonical, platform-curated CNC operator courses (machine safety, work-holding, tool offsets, in-process inspection, GD&amp;T fundamentals, etc.).</li>
          <li><strong>Mentor Walkthrough</strong> at <code>/oap/walkthrough</code> — guided in-shop competency demonstration with mentor sign-off (pass / fail / needs-retest).</li>
          <li><strong>Tool Proficiency Tests</strong> — measuring-tool (micrometer, caliper, indicator, gauge block) proficiency with printable Markdown backup and 4 canonical seeded templates.</li>
          <li><strong>Transcript</strong> at <code>/oap/my-transcript</code> — operator's full certification history (noindex, private).</li>
          <li><strong>Employer Console</strong> at <code>/oap/employer</code> — paid-tier dashboard for shops to issue, track, and audit operator certifications across their workforce.</li>
          <li><strong>Public Certificate Verification</strong> at <code>/verify/&lt;certId&gt;</code> — anyone can verify the authenticity of an issued credential.</li>
        </ul>
        <h2>Pricing</h2>
        <p>OAP self-study and walkthrough access is free for operators. Issued certificates are $12 (one-time, via Stripe). Employer console requires a paid org subscription.</p>
        <h2>Compliance</h2>
        <p>OAP is structured to satisfy AS9100 Rev D operator-qualification requirements, ISO 9001:2015 competency clauses (7.2), and OSHA general-duty operator-training expectations. Full audit trail via <code>oap_recert_events</code>. ITAR-controlled orgs get additional US-person declaration gating.</p>
      `,
    };
  }
  if (
    pathname === "/gcode-academy" ||
    pathname === "/gca" ||
    pathname.startsWith("/gca/")
  ) {
    return {
      title: "G-Code Academy — Self-Study CNC Operator Training | JobLine.ai",
      description:
        "Self-paced CNC training across Fanuc, Haas, Siemens, Heidenhain, GD&T, and more. 10 question banks with verified credentials.",
      image: `${BASE}/gcode-academy-og.jpg`,
      url: `${BASE}${pathname}`,
      body: `
        <h1>G-Code Academy (GCA) — Self-Study CNC Operator Training</h1>
        <p>The G-Code Academy is JobLine.ai's self-paced CNC operator training and credentialing platform. It covers G-code, M-code, machine controls, work-holding, and GD&amp;T across the major control dialects used in modern machine shops.</p>
        <h2>Curriculum &amp; Question Banks (10 total)</h2>
        <ul>
          <li>Fanuc G-code &amp; M-code</li>
          <li>Haas control specifics</li>
          <li>Siemens (SINUMERIK) syntax</li>
          <li>Heidenhain conversational &amp; ISO</li>
          <li>VMC (vertical machining center) operations</li>
          <li>Lathe / turning fundamentals</li>
          <li>Swiss-type lathe</li>
          <li>HMC (horizontal machining center)</li>
          <li>GD&amp;T (geometric dimensioning &amp; tolerancing)</li>
          <li>Interview / hiring readiness</li>
        </ul>
        <h2>How It Works</h2>
        <ul>
          <li><strong>Landing &amp; lessons</strong> at <code>/gcode-academy</code> — public, free reference content (curriculum, calculators, syntax sheets).</li>
          <li><strong>In-app test player</strong> at <code>/gca/test/&lt;bankSlug&gt;</code> — proctored-style question banks; passing tests issues a verified credential that surfaces as a badge on the operator's Talent profile.</li>
          <li><strong>VS Code extension</strong> — multi-dialect G-code syntax intelligence with real-time backend sync.</li>
          <li><strong>Employer Console</strong> at <code>/gca/employer</code> — paid-tier dashboard to track team-wide GCA proficiency.</li>
        </ul>
        <h2>Pricing</h2>
        <p>All study material and self-assessment is free. Verified credentials (badge-eligible) are $12 (one-time). Employer-side proficiency dashboards require a paid org subscription.</p>
      `,
    };
  }
  if (pathname.startsWith("/verify/")) {
    return {
      title: "Verified Credential — JobLine.ai",
      description:
        "Verify the authenticity of a JobLine.ai certificate or credential.",
      image: `${BASE}/og-image.png`,
      url: `${BASE}${pathname}`,
    };
  }
  return null;
}

async function fetchTalentMeta(username: string): Promise<Meta | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/get_public_operator_profile`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ _username: username }),
        signal: ctrl.signal,
      },
    );
    clearTimeout(t);
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{
      headline: string | null;
      bio: string | null;
      avatar_url: string | null;
      location_city: string | null;
      location_region: string | null;
      public_username: string | null;
    }>;
    const p = Array.isArray(rows) ? rows[0] : null;
    if (!p) return null;
    const loc = [p.location_city, p.location_region].filter(Boolean).join(", ");
    const headline = p.headline ?? "Verified Talent Profile";
    const desc = (
      p.bio ??
      `${headline}${loc ? ` · ${loc}` : ""} — Verified profile on JobLine.ai`
    ).slice(0, 200);
    return {
      title: `${headline} (@${p.public_username}) — JobLine.ai Talent`,
      description: desc,
      // Branded, dynamically rendered share card. Renderer falls back to the
      // generic JobLine OG image if the profile is private/missing.
      image: `${BASE}/api/og-image?u=${encodeURIComponent(p.public_username ?? username)}`,
      url: `${BASE}/talent/${p.public_username}`,
      type: "profile",
    };
  } catch {
    return null;
  }
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function rewriteMeta(html: string, meta: Meta): string {
  const t = escapeAttr(meta.title);
  const d = escapeAttr(meta.description);
  const i = escapeAttr(meta.image);
  const u = escapeAttr(meta.url);
  const type = escapeAttr(meta.type ?? "website");

  // Build a complete block we can also inject if a tag is missing.
  const injected = `
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${u}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image" content="${i}" />
    <meta property="og:image:secure_url" content="${i}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${u}" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${i}" />
  `;

  // Strip any existing tags we're about to replace, then inject fresh ones
  // right after <head>. This guarantees correct values even if the source
  // template changes.
  const stripped = html
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, "");

  let out = stripped.replace(/<head([^>]*)>/i, `<head$1>${injected}`);

  // Inject crawler-visible body content so AI fetchers (Claude, ChatGPT, Perplexity, etc.)
  // and non-OG search crawlers see real per-route content instead of the empty SPA shell.
  // Wrapped in an aria-hidden container — real users get the SPA, which hydrates over it.
  if (meta.body) {
    const bodyBlock = `<div id="crawler-content" aria-hidden="true" style="position:absolute;left:-99999px;top:auto;width:1px;height:1px;overflow:hidden">${meta.body}</div>`;
    // Place it inside <div id="root"> if present, otherwise right after <body>.
    if (/<div\s+id=["']root["'][^>]*>/i.test(out)) {
      out = out.replace(
        /<div\s+id=["']root["'][^>]*>/i,
        (m) => `${m}${bodyBlock}`,
      );
    } else {
      out = out.replace(/<body([^>]*)>/i, `<body$1>${bodyBlock}`);
    }
  }

  return out;
}

let cachedHtml: string | null = null;
function loadIndexHtml(): string {
  if (cachedHtml) return cachedHtml;
  // On Vercel, the build output is colocated; index.html ships under /public
  // for the SPA. We read it from the deployment filesystem.
  const candidates = [
    join(process.cwd(), "dist", "index.html"),
    join(process.cwd(), "public", "index.html"),
    join(process.cwd(), "index.html"),
  ];
  for (const p of candidates) {
    try {
      cachedHtml = readFileSync(p, "utf8");
      return cachedHtml;
    } catch {
      // try next
    }
  }
  // Last resort: minimal shell so crawlers still get usable meta.
  cachedHtml = `<!doctype html><html><head></head><body></body></html>`;
  return cachedHtml;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ua = String(req.headers["user-agent"] ?? "");
  const rawPath = (req.query?.path as string | undefined) ?? req.url ?? "/";
  // Normalize: strip query string and ensure leading slash.
  const pathname = "/" + rawPath.replace(/^\/+/, "").split("?")[0];

  const html = loadIndexHtml();

  // Real users: serve the SPA shell unmodified.
  if (!BOT_UA.test(ua)) {
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.setHeader("cache-control", "public, max-age=0, must-revalidate");
    res.status(200).send(html);
    return;
  }

  // Resolve meta for this route.
  let meta: Meta | null = metaForPath(pathname);
  if (!meta) {
    const m = pathname.match(/^\/talent\/([^/]+)\/?$/);
    if (m) {
      const username = decodeURIComponent(m[1]);
      meta =
        (await fetchTalentMeta(username)) ?? {
          ...DEFAULT_META,
          title: `@${username} — JobLine.ai Talent`,
          description: "Verified talent profile on JobLine.ai.",
          image: `${BASE}/profile-og.jpg`,
          url: `${BASE}/talent/${username}`,
          type: "profile",
        };
    }
  }
  if (!meta) meta = DEFAULT_META;

  const rewritten = rewriteMeta(html, meta);
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", "public, max-age=300, s-maxage=600");
  res.setHeader("x-jobline-og", "rewritten");
  res.status(200).send(rewritten);
}
