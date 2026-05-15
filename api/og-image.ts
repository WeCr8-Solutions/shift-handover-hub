/**
 * /api/og-image — Dynamic Open Graph card renderer for talent profiles.
 *
 * Returns a 1200×630 PNG branded share card built from the user's public
 * profile data (name, headline, location, avatar, verified cert counts).
 *
 * Privacy: only renders for profiles where get_public_operator_profile
 * returns a row. Private/employers-only profiles return the generic
 * JobLine OG image (no info leak).
 *
 * Caching: 24h at the edge so repeat hits from crawlers are essentially free.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_URL = "https://kgrstnbxqdmadtoankqr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtncnN0bmJ4cWRtYWR0b2Fua3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzM0MDgsImV4cCI6MjA4NTg0OTQwOH0.XmY5BDVKz2SBv4_MZk7lgrP5CJDSXeCl-PwDFoCwiik";

// Lazy-load fonts once per cold start
let fontsCache: { regular: Buffer; bold: Buffer } | null = null;
function loadFonts() {
  if (fontsCache) return fontsCache;
  fontsCache = {
    regular: readFileSync(join(process.cwd(), "api", "_assets", "inter-regular.ttf")),
    bold: readFileSync(join(process.cwd(), "api", "_assets", "inter-bold.ttf")),
  };
  return fontsCache;
}

type Profile = {
  display_name: string | null;
  public_username: string | null;
  headline: string | null;
  location_city: string | null;
  location_region: string | null;
  avatar_url: string | null;
};

type CertSummary = {
  gca_count: number;
  oap_count: number;
  partner_count: number;
  verified_total: number;
};

async function fetchProfile(username: string): Promise<Profile | null> {
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
    const rows = (await res.json()) as Profile[];
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

async function fetchCertSummary(username: string): Promise<CertSummary> {
  const empty: CertSummary = {
    gca_count: 0,
    oap_count: 0,
    partner_count: 0,
    verified_total: 0,
  };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/get_public_operator_cert_summary`,
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
    if (!res.ok) return empty;
    const rows = (await res.json()) as CertSummary[];
    return Array.isArray(rows) && rows[0] ? rows[0] : empty;
  } catch {
    return empty;
  }
}

// Only allow loading avatar bytes from the project's Supabase storage host.
// User-controlled avatar_url could otherwise be used for SSRF probes against
// internal Vercel infrastructure or cloud metadata endpoints.
const ALLOWED_AVATAR_HOSTS = new Set(["kgrstnbxqdmadtoankqr.supabase.co"]);

async function fetchAvatarDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  if (!ALLOWED_AVATAR_HOSTS.has(parsed.host)) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(parsed.toString(), { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "image/png";
    // Reject anything > 2MB to avoid runaway memory
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 2 * 1024 * 1024) return null;
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function buildBadgeText(s: CertSummary): string {
  const parts: string[] = [];
  if (s.gca_count > 0) parts.push(`${s.gca_count}× GCA Verified`);
  if (s.oap_count > 0)
    parts.push(`${s.oap_count}× OAP ${s.oap_count === 1 ? "Certificate" : "Certificates"}`);
  if (s.partner_count > 0)
    parts.push(
      `${s.partner_count} Partner ${s.partner_count === 1 ? "Cert" : "Certs"}`,
    );
  if (parts.length === 0) return "Verified Talent on JobLine.ai";
  return "✓ " + parts.join(" · ");
}

/** Wrap a long headline to fit in 2 lines at the given font size. */
function clampHeadline(text: string | null, max = 110): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}

function buildCard(
  profile: Profile,
  summary: CertSummary,
  avatarDataUrl: string | null,
) {
  const name = profile.display_name ?? `@${profile.public_username}`;
  const username = profile.public_username ?? "talent";
  const location = [profile.location_city, profile.location_region]
    .filter(Boolean)
    .join(", ");
  const headline = clampHeadline(profile.headline);
  const badge = buildBadgeText(summary);

  return {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        fontFamily: "Inter",
        color: "#0f172a",
      },
      children: [
        // Brand strip top
        {
          type: "div",
          props: {
            style: {
              height: "120px",
              background:
                "linear-gradient(135deg, #0a1628 0%, #0f1f3a 60%, #10b981 130%)",
              display: "flex",
              alignItems: "center",
              padding: "0 60px",
              gap: "14px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #3b82f6, #10b981)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                    fontWeight: 700,
                    color: "#0a1628",
                  },
                  children: "J",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: "26px",
                    fontWeight: 700,
                    color: "#ffffff",
                    letterSpacing: "-0.02em",
                  },
                  children: [
                    { type: "span", props: { children: "JobLine" } },
                    {
                      type: "span",
                      props: { style: { color: "#10b981" }, children: ".ai" },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    marginLeft: "auto",
                    fontSize: "16px",
                    color: "#cbd5e1",
                    display: "flex",
                  },
                  children: "Verified Talent Network",
                },
              },
            ],
          },
        },
        // Body
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              padding: "50px 80px 40px 60px",
              gap: "40px",
              flexGrow: 1,
              alignItems: "center",
            },
            children: [
              // Avatar
              avatarDataUrl
                ? {
                    type: "img",
                    props: {
                      src: avatarDataUrl,
                      width: 200,
                      height: 200,
                      style: {
                        width: "200px",
                        height: "200px",
                        borderRadius: "100px",
                        objectFit: "cover",
                        marginTop: "-100px",
                        border: "6px solid #ffffff",
                        boxShadow: "0 10px 40px rgba(15,23,42,0.15)",
                        flexShrink: 0,
                      },
                    },
                  }
                : {
                    type: "div",
                    props: {
                      style: {
                        width: "200px",
                        height: "200px",
                        borderRadius: "100px",
                        background:
                          "linear-gradient(135deg, #1e40af, #10b981)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "84px",
                        fontWeight: 700,
                        color: "#ffffff",
                        marginTop: "-100px",
                        border: "6px solid #ffffff",
                        boxShadow: "0 10px 40px rgba(15,23,42,0.15)",
                        flexShrink: 0,
                      },
                      children: initials(profile.display_name),
                    },
                  },
              // Identity
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    minWidth: 0,
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "52px",
                          fontWeight: 700,
                          letterSpacing: "-0.025em",
                          lineHeight: 1.05,
                          color: "#0f172a",
                        },
                        children: name,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "20px",
                          color: "#64748b",
                          marginTop: "6px",
                        },
                        children: `@${username}${location ? ` · ${location}` : ""}`,
                      },
                    },
                    headline && {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "20px",
                          color: "#334155",
                          lineHeight: 1.4,
                          marginTop: "16px",
                          // Constrain to 2 lines max within the available
                          // body width (1200 - 60 - 80 padding - 200 avatar
                          // - 40 gap = 820). Satori needs an explicit width
                          // to wrap text reliably.
                          width: "820px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        },
                        children: headline,
                      },
                    },
                  ].filter(Boolean),
                },
              },
            ],
          },
        },
        // Bottom badge strip
        {
          type: "div",
          props: {
            style: {
              background: "#f1f5f9",
              padding: "20px 60px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              borderTop: "1px solid #e2e8f0",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "18px",
                    color: "#10b981",
                    fontWeight: 700,
                    background: "#ffffff",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid #d1fae5",
                    display: "flex",
                  },
                  children: badge,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    marginLeft: "auto",
                    fontSize: "18px",
                    color: "#475569",
                    fontWeight: 500,
                    display: "flex",
                  },
                  children: `jobline.ai/talent/${username}`,
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const username = String(req.query?.u ?? "").trim();
  if (!username || !/^[a-z0-9_-]{2,64}$/i.test(username)) {
    res.status(400).json({ error: "invalid username" });
    return;
  }

  const profile = await fetchProfile(username);
  if (!profile) {
    // Fall back to default brand image — keeps private profiles private.
    res.setHeader("location", "https://jobline.ai/og-image.png");
    res.status(302).end();
    return;
  }

  const [summary, avatarDataUrl] = await Promise.all([
    fetchCertSummary(username),
    fetchAvatarDataUrl(profile.avatar_url),
  ]);

  try {
    const fonts = loadFonts();
    const tree = buildCard(profile, summary, avatarDataUrl);
    const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: fonts.regular, weight: 400, style: "normal" },
        { name: "Inter", data: fonts.bold, weight: 700, style: "normal" },
      ],
    });
    const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } })
      .render()
      .asPng();

    res.setHeader("content-type", "image/png");
    // Cache aggressively at the edge; bust by appending ?v= query if needed
    res.setHeader(
      "cache-control",
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    );
    res.status(200).send(png);
  } catch (err) {
    console.error("og-image render failed", err);
    res.setHeader("location", "https://jobline.ai/og-image.png");
    res.status(302).end();
  }
}
