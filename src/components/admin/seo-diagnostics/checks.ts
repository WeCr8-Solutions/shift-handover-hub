/**
 * SEO Diagnostics — modular check registry.
 *
 * Each check is self-contained: it fetches an artifact and returns a
 * structured result. Add a new check by exporting another async function
 * with the same signature and registering it in `ALL_CHECKS`.
 */

export type CheckSeverity = "pass" | "warn" | "fail";

export interface CheckIssue {
  severity: CheckSeverity;
  message: string;
  detail?: string;
}

export interface CheckResult {
  id: string;
  label: string;
  description: string;
  status: CheckSeverity;
  durationMs: number;
  url?: string;
  /** High-level summary lines, always rendered */
  summary: string[];
  /** Granular issues — failures, warnings, info */
  issues: CheckIssue[];
  /** Optional raw text/snippet shown in a collapsible */
  raw?: string;
}

const BASE = typeof window !== "undefined" ? window.location.origin : "https://jobline.ai";

async function fetchText(path: string): Promise<{ ok: boolean; status: number; text: string; contentType: string }> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  const text = await res.text();
  return {
    ok: res.ok,
    status: res.status,
    text,
    contentType: res.headers.get("content-type") || "",
  };
}

function worst(a: CheckSeverity, b: CheckSeverity): CheckSeverity {
  const rank = { pass: 0, warn: 1, fail: 2 };
  return rank[a] >= rank[b] ? a : b;
}

function rollup(issues: CheckIssue[]): CheckSeverity {
  return issues.reduce<CheckSeverity>((acc, i) => worst(acc, i.severity), "pass");
}

// ---------------------------------------------------------------------------
// robots.txt
// ---------------------------------------------------------------------------
export async function checkRobots(): Promise<CheckResult> {
  const t0 = performance.now();
  const issues: CheckIssue[] = [];
  const summary: string[] = [];
  let raw = "";

  try {
    const r = await fetchText("/robots.txt");
    raw = r.text;
    if (!r.ok) {
      issues.push({ severity: "fail", message: `robots.txt returned HTTP ${r.status}` });
    } else {
      const lines = r.text.split(/\r?\n/);
      const userAgents = lines.filter((l) => /^user-agent:/i.test(l));
      const sitemaps = lines.filter((l) => /^sitemap:/i.test(l));
      const globalDisallow = lines.some((l) => /^disallow:\s*\/\s*$/i.test(l));

      summary.push(`${userAgents.length} User-agent block(s)`);
      summary.push(`${sitemaps.length} Sitemap directive(s)`);

      if (userAgents.length === 0) {
        issues.push({ severity: "fail", message: "No User-agent directives found" });
      }
      if (sitemaps.length === 0) {
        issues.push({ severity: "warn", message: "No Sitemap: directive — crawlers must guess location" });
      }
      if (globalDisallow) {
        issues.push({ severity: "fail", message: "Global `Disallow: /` blocks the entire site from crawling" });
      }
      // AdSense-critical user agents
      const requiredBots = ["Mediapartners-Google", "AdsBot-Google", "Googlebot"];
      for (const bot of requiredBots) {
        if (!new RegExp(`user-agent:\\s*${bot}\\b`, "i").test(r.text)) {
          issues.push({
            severity: "warn",
            message: `Missing explicit \`User-agent: ${bot}\` block`,
            detail: "Recommended for AdSense and Google Search coverage.",
          });
        }
      }
    }
  } catch (err) {
    issues.push({ severity: "fail", message: "Failed to fetch /robots.txt", detail: String(err) });
  }

  return {
    id: "robots",
    label: "robots.txt",
    description: "Crawler directives and sitemap discovery",
    url: "/robots.txt",
    status: rollup(issues) || "pass",
    durationMs: Math.round(performance.now() - t0),
    summary,
    issues,
    raw,
  };
}

// ---------------------------------------------------------------------------
// sitemap.xml — validates index + main sitemap
// ---------------------------------------------------------------------------
async function parseXml(text: string): Promise<Document | null> {
  if (typeof DOMParser === "undefined") return null;
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) return null;
  return doc;
}

async function inspectSitemap(path: string) {
  const r = await fetchText(path);
  const issues: CheckIssue[] = [];
  const info: { urls: number; lastmodMissing: number; nonHttps: number; duplicate: number } = {
    urls: 0,
    lastmodMissing: 0,
    nonHttps: 0,
    duplicate: 0,
  };

  if (!r.ok) {
    issues.push({ severity: "fail", message: `${path} returned HTTP ${r.status}` });
    return { issues, info, raw: r.text };
  }
  const doc = await parseXml(r.text);
  if (!doc) {
    issues.push({ severity: "fail", message: `${path} is not valid XML` });
    return { issues, info, raw: r.text };
  }

  const urls = Array.from(doc.getElementsByTagName("url"));
  info.urls = urls.length;
  const seen = new Set<string>();
  for (const u of urls) {
    const loc = u.getElementsByTagName("loc")[0]?.textContent?.trim() || "";
    const lastmod = u.getElementsByTagName("lastmod")[0]?.textContent?.trim();
    if (!loc) {
      issues.push({ severity: "fail", message: "Found <url> entry without <loc>" });
      continue;
    }
    if (!/^https:\/\//i.test(loc)) info.nonHttps++;
    if (seen.has(loc)) info.duplicate++;
    seen.add(loc);
    if (!lastmod) info.lastmodMissing++;
  }
  if (info.nonHttps > 0) {
    issues.push({ severity: "warn", message: `${info.nonHttps} URL(s) are not HTTPS` });
  }
  if (info.duplicate > 0) {
    issues.push({ severity: "warn", message: `${info.duplicate} duplicate <loc> entries` });
  }
  if (info.urls === 0) {
    issues.push({ severity: "fail", message: "Sitemap contains zero <url> entries" });
  }
  return { issues, info, raw: r.text.slice(0, 2000) };
}

export async function checkSitemap(): Promise<CheckResult> {
  const t0 = performance.now();
  const summary: string[] = [];
  const issues: CheckIssue[] = [];
  let raw = "";

  try {
    // Index
    const idx = await fetchText("/sitemap-index.xml");
    if (idx.ok) {
      const doc = await parseXml(idx.text);
      if (!doc) {
        issues.push({ severity: "warn", message: "sitemap-index.xml is not valid XML" });
      } else {
        const sitemaps = doc.getElementsByTagName("sitemap").length;
        summary.push(`sitemap-index.xml: ${sitemaps} child sitemap(s)`);
      }
    } else {
      issues.push({ severity: "warn", message: `sitemap-index.xml returned HTTP ${idx.status}` });
    }

    const main = await inspectSitemap("/sitemap.xml");
    summary.push(`sitemap.xml: ${main.info.urls} URL(s)`);
    issues.push(...main.issues);
    raw = main.raw;
  } catch (err) {
    issues.push({ severity: "fail", message: "Failed to fetch sitemap", detail: String(err) });
  }

  return {
    id: "sitemap",
    label: "Sitemap",
    description: "sitemap-index.xml + sitemap.xml structure and URL hygiene",
    url: "/sitemap.xml",
    status: rollup(issues) || "pass",
    durationMs: Math.round(performance.now() - t0),
    summary,
    issues,
    raw,
  };
}

// ---------------------------------------------------------------------------
// llms.txt — E-E-A-T signal file for LLM crawlers
// ---------------------------------------------------------------------------
export async function checkLlms(): Promise<CheckResult> {
  const t0 = performance.now();
  const issues: CheckIssue[] = [];
  const summary: string[] = [];
  let raw = "";

  try {
    const r = await fetchText("/llms.txt");
    raw = r.text;
    if (!r.ok) {
      issues.push({ severity: "fail", message: `llms.txt returned HTTP ${r.status}` });
    } else {
      const len = r.text.length;
      summary.push(`${len.toLocaleString()} bytes`);
      if (len < 500) issues.push({ severity: "warn", message: "llms.txt is very short (<500 bytes)" });
      if (!/#\s*JobLine/i.test(r.text) && !/jobline/i.test(r.text)) {
        issues.push({ severity: "warn", message: "Does not mention the brand name" });
      }
      if (!/author|wecr8|goodbody/i.test(r.text)) {
        issues.push({ severity: "warn", message: "Missing authorship / E-E-A-T section" });
      }
      const links = (r.text.match(/https?:\/\/\S+/g) || []).length;
      summary.push(`${links} external link(s)`);
      if (links < 3) {
        issues.push({ severity: "warn", message: "Few external links — add canonical references" });
      }
    }
  } catch (err) {
    issues.push({ severity: "fail", message: "Failed to fetch /llms.txt", detail: String(err) });
  }

  return {
    id: "llms",
    label: "llms.txt",
    description: "LLM discovery file with authorship and recent content",
    url: "/llms.txt",
    status: rollup(issues) || "pass",
    durationMs: Math.round(performance.now() - t0),
    summary,
    issues,
    raw: raw.slice(0, 2000),
  };
}

// ---------------------------------------------------------------------------
// Canonical & meta on current document
// ---------------------------------------------------------------------------
export async function checkCanonical(): Promise<CheckResult> {
  const t0 = performance.now();
  const issues: CheckIssue[] = [];
  const summary: string[] = [];

  const canonicals = Array.from(document.querySelectorAll('link[rel="canonical"]'));
  const title = document.title?.trim() || "";
  const desc = document.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() || "";
  const robots = document.querySelector('meta[name="robots"]')?.getAttribute("content")?.trim() || "";
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim() || "";
  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content")?.trim() || "";

  summary.push(`Title: ${title.length} chars`);
  summary.push(`Description: ${desc.length} chars`);
  summary.push(`Canonical tags: ${canonicals.length}`);

  if (canonicals.length === 0) {
    issues.push({ severity: "fail", message: "No <link rel=\"canonical\"> on current page" });
  } else if (canonicals.length > 1) {
    issues.push({
      severity: "fail",
      message: `${canonicals.length} canonical tags — must be exactly one`,
      detail: canonicals.map((c) => c.getAttribute("href") || "").join("\n"),
    });
  } else {
    const href = canonicals[0].getAttribute("href") || "";
    if (!/^https?:\/\//i.test(href)) {
      issues.push({ severity: "warn", message: "Canonical href is not absolute", detail: href });
    }
  }

  if (!title) issues.push({ severity: "fail", message: "Missing <title>" });
  else if (title.length < 20) issues.push({ severity: "warn", message: "Title is short (<20 chars)" });
  else if (title.length > 65) issues.push({ severity: "warn", message: "Title is long (>65 chars)" });

  if (!desc) issues.push({ severity: "fail", message: "Missing meta description" });
  else if (desc.length < 60) issues.push({ severity: "warn", message: "Description is short (<60 chars)" });
  else if (desc.length > 165) issues.push({ severity: "warn", message: "Description is long (>165 chars)" });

  if (/noindex/i.test(robots)) {
    issues.push({
      severity: "fail",
      message: "Current page is marked `noindex` — won't appear in search",
      detail: robots,
    });
  }

  if (!ogTitle) issues.push({ severity: "warn", message: "Missing og:title" });
  if (!ogImage) issues.push({ severity: "warn", message: "Missing og:image" });

  const h1s = document.querySelectorAll("h1").length;
  summary.push(`H1 tags: ${h1s}`);
  if (h1s === 0) issues.push({ severity: "fail", message: "No <h1> on current page" });
  else if (h1s > 1) issues.push({ severity: "warn", message: `${h1s} <h1> tags — prefer exactly one` });

  return {
    id: "canonical",
    label: "Canonical & Meta",
    description: "Per-page head tags on the currently rendered route",
    url: window.location.pathname,
    status: rollup(issues) || "pass",
    durationMs: Math.round(performance.now() - t0),
    summary,
    issues,
  };
}

// ---------------------------------------------------------------------------
// JSON-LD validity
// ---------------------------------------------------------------------------
const REQUIRED_BY_TYPE: Record<string, string[]> = {
  Article: ["headline", "author", "datePublished"],
  BlogPosting: ["headline", "author", "datePublished"],
  Organization: ["name"],
  WebSite: ["name", "url"],
  BreadcrumbList: ["itemListElement"],
  FAQPage: ["mainEntity"],
  Product: ["name"],
};

export async function checkJsonLd(): Promise<CheckResult> {
  const t0 = performance.now();
  const issues: CheckIssue[] = [];
  const summary: string[] = [];
  const blocks = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

  summary.push(`${blocks.length} JSON-LD block(s)`);

  if (blocks.length === 0) {
    issues.push({ severity: "warn", message: "No JSON-LD on current page" });
  }

  const types: string[] = [];
  blocks.forEach((b, i) => {
    const text = b.textContent || "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      issues.push({
        severity: "fail",
        message: `Block #${i + 1}: invalid JSON`,
        detail: String(e),
      });
      return;
    }

    const entries = Array.isArray(parsed) ? parsed : [parsed];
    for (const entry of entries as Record<string, unknown>[]) {
      if (!entry || typeof entry !== "object") {
        issues.push({ severity: "fail", message: `Block #${i + 1}: not an object` });
        continue;
      }
      if (entry["@context"] !== "https://schema.org" && !String(entry["@context"] || "").includes("schema.org")) {
        issues.push({ severity: "warn", message: `Block #${i + 1}: missing @context https://schema.org` });
      }
      const t = entry["@type"];
      if (!t || typeof t !== "string") {
        issues.push({ severity: "fail", message: `Block #${i + 1}: missing @type` });
        continue;
      }
      types.push(t);
      const required = REQUIRED_BY_TYPE[t];
      if (required) {
        for (const field of required) {
          if (entry[field] == null || entry[field] === "") {
            issues.push({
              severity: "warn",
              message: `${t}: missing recommended field \`${field}\``,
            });
          }
        }
      }
    }
  });

  if (types.length > 0) summary.push(`Types: ${types.join(", ")}`);

  return {
    id: "jsonld",
    label: "JSON-LD",
    description: "Schema.org structured data on current page",
    url: window.location.pathname,
    status: rollup(issues) || "pass",
    durationMs: Math.round(performance.now() - t0),
    summary,
    issues,
  };
}

// ---------------------------------------------------------------------------
// Supporting files: ads.txt, security.txt, humans.txt
// ---------------------------------------------------------------------------
export async function checkSupportFiles(): Promise<CheckResult> {
  const t0 = performance.now();
  const issues: CheckIssue[] = [];
  const summary: string[] = [];

  const targets = [
    { path: "/ads.txt", required: true, validate: (t: string) => /pub-\d+/.test(t) || "Missing Google AdSense publisher ID" },
    { path: "/security.txt", required: false },
    { path: "/.well-known/security.txt", required: false },
    { path: "/humans.txt", required: false },
  ];

  for (const t of targets) {
    try {
      const r = await fetchText(t.path);
      if (!r.ok) {
        issues.push({
          severity: t.required ? "fail" : "warn",
          message: `${t.path}: HTTP ${r.status}`,
        });
        continue;
      }
      summary.push(`${t.path}: OK (${r.text.length} bytes)`);
      if (t.validate) {
        const v = t.validate(r.text);
        if (v !== true) issues.push({ severity: "fail", message: `${t.path}: ${v}` });
      }
    } catch (err) {
      issues.push({
        severity: t.required ? "fail" : "warn",
        message: `${t.path}: fetch failed`,
        detail: String(err),
      });
    }
  }

  return {
    id: "support-files",
    label: "ads.txt / security.txt / humans.txt",
    description: "Adsense ownership + trust signal files",
    status: rollup(issues) || "pass",
    durationMs: Math.round(performance.now() - t0),
    summary,
    issues,
  };
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------
export const ALL_CHECKS = [
  checkRobots,
  checkSitemap,
  checkLlms,
  checkCanonical,
  checkJsonLd,
  checkSupportFiles,
] as const;
