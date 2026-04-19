import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Edge middleware that rewrites Open Graph / Twitter meta tags for social-media
 * crawlers (iMessage, Slack, Twitter/X, Facebook, LinkedIn, WhatsApp, Discord, etc.).
 *
 * Why: this is a Vite SPA. Helmet only sets meta tags client-side, but link-preview
 * crawlers don't run JavaScript — they only see the static index.html shipped from
 * the edge. Without this middleware every shared link uses the generic site OG image.
 *
 * For real users (non-bot user-agents), we pass the request straight through so
 * nothing about the SPA experience changes.
 */

export const config = {
  // Only match HTML routes we care about. Static assets (anything with a dot) are
  // skipped. Dynamic talent profiles are matched via the wildcard.
  matcher: [
    "/",
    "/talent",
    "/talent/:username*",
    "/oap",
    "/oap/:path*",
    "/gcode-academy",
    "/gca",
    "/gca/:path*",
    "/verify/:certId*",
  ],
};

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
  title: "JobLine.ai — Digital Expeditor & Smart Shift Handoff for Manufacturing",
  description:
    "Streamline CNC manufacturing operations. Track work orders, manage shift handoffs, and improve production floor communication.",
  image: `${BASE}/og-image.png`,
  url: `${BASE}/`,
};

function metaForPath(pathname: string): Meta | null {
  if (pathname === "/talent" || pathname === "/talent/") {
    return {
      title: "Talent Network — Verified CNC Operators & Machinists | JobLine.ai",
      description:
        "Discover verified CNC operators, machinists, and shop-floor talent. Browse public profiles with skills, certifications, and work history.",
      image: `${BASE}/talent-og.jpg`,
      url: `${BASE}/talent`,
    };
  }
  if (pathname === "/oap" || pathname.startsWith("/oap/")) {
    return {
      title: "Operator Acceptance Program (OAP) — AS9100 / ISO 9001 Certification | JobLine.ai",
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
  return null;
}

/** Fetch a single public talent profile via the anon-callable RPC. */
async function fetchTalentMeta(username: string): Promise<Meta | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_operator_profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ _username: username }),
      // Edge runtime: short timeout via AbortController
      signal: AbortSignal.timeout(2500),
    });
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
    const headline = p.headline ?? "Verified Machinist Profile";
    const desc =
      (p.bio ?? `${headline}${loc ? ` · ${loc}` : ""} — Verified profile on JobLine.ai`).slice(
        0,
        200,
      );
    return {
      title: `${headline} (@${p.public_username}) — JobLine.ai Talent`,
      description: desc,
      image: p.avatar_url ?? `${BASE}/profile-og.jpg`,
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

/** Replace existing og/twitter/title meta tags in the served HTML. */
function rewriteMeta(html: string, meta: Meta): string {
  const t = escapeAttr(meta.title);
  const d = escapeAttr(meta.description);
  const i = escapeAttr(meta.image);
  const u = escapeAttr(meta.url);
  const type = escapeAttr(meta.type ?? "website");

  return html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${t}</title>`)
    .replace(
      /<meta\s+name="description"[^>]*>/i,
      `<meta name="description" content="${d}" />`,
    )
    .replace(/<meta\s+property="og:type"[^>]*>/i, `<meta property="og:type" content="${type}" />`)
    .replace(/<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="${u}" />`)
    .replace(/<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${t}" />`)
    .replace(
      /<meta\s+property="og:description"[^>]*>/i,
      `<meta property="og:description" content="${d}" />`,
    )
    .replace(/<meta\s+property="og:image"[^>]*>/i, `<meta property="og:image" content="${i}" />`)
    .replace(/<meta\s+name="twitter:url"[^>]*>/i, `<meta name="twitter:url" content="${u}" />`)
    .replace(/<meta\s+name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${t}" />`)
    .replace(
      /<meta\s+name="twitter:description"[^>]*>/i,
      `<meta name="twitter:description" content="${d}" />`,
    )
    .replace(/<meta\s+name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${i}" />`);
}

export default async function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  // Real users: pass through unchanged.
  if (!BOT_UA.test(ua)) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Resolve target meta.
  let meta: Meta | null = metaForPath(pathname);
  if (!meta) {
    const m = pathname.match(/^\/talent\/([^/]+)\/?$/);
    if (m) {
      const username = decodeURIComponent(m[1]);
      meta = (await fetchTalentMeta(username)) ?? {
        ...DEFAULT_META,
        title: `@${username} — JobLine.ai Talent`,
        description: "Verified CNC operator profile on JobLine.ai.",
        image: `${BASE}/profile-og.jpg`,
        url: `${BASE}/talent/${username}`,
        type: "profile",
      };
    }
  }
  if (!meta) return NextResponse.next();

  // Fetch the static index.html that Vercel would normally serve, then rewrite.
  try {
    const origin = req.nextUrl.origin;
    const htmlRes = await fetch(`${origin}/index.html`, {
      headers: { "user-agent": "jobline-og-middleware" },
      signal: AbortSignal.timeout(3000),
    });
    if (!htmlRes.ok) return NextResponse.next();
    const html = await htmlRes.text();
    const rewritten = rewriteMeta(html, meta);
    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300, s-maxage=600",
        "x-jobline-og": "rewritten",
      },
    });
  } catch {
    return NextResponse.next();
  }
}
