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
};

const DEFAULT_META: Meta = {
  title:
    "JobLine.ai — Digital Expeditor & Smart Shift Handoff for Manufacturing",
  description:
    "Streamline CNC manufacturing operations. Track work orders, manage shift handoffs, and improve production floor communication.",
  image: `${BASE}/og-image.png`,
  url: `${BASE}/`,
};

function metaForPath(pathname: string): Meta | null {
  if (pathname === "/" || pathname === "") return DEFAULT_META;

  if (pathname === "/talent" || pathname === "/talent/") {
    return {
      title:
        "Talent Network — Verified Professionals & Credentials | JobLine.ai",
      description:
        "Discover verified professionals across every trade and discipline. Browse public profiles with skills, certifications, accomplishments, and work history.",
      image: `${BASE}/talent-og.jpg`,
      url: `${BASE}/talent`,
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

  return stripped.replace(/<head([^>]*)>/i, `<head$1>${injected}`);
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
