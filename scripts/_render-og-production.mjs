/**
 * Local QA harness — calls the same Supabase RPCs and rendering pipeline
 * as api/og-image.ts, then writes the PNG so we can visually verify it
 * before deploying.
 */
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";

// Inline the renderer from api/og-image.ts (simplified — same buildCard tree)
const SUPABASE_URL = "https://kgrstnbxqdmadtoankqr.supabase.co";
const KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtncnN0bmJ4cWRtYWR0b2Fua3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzM0MDgsImV4cCI6MjA4NTg0OTQwOH0.XmY5BDVKz2SBv4_MZk7lgrP5CJDSXeCl-PwDFoCwiik";

const username = "zachgoodbody";

async function rpc(name, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify(body),
  });
  return r.ok ? (await r.json())[0] ?? null : null;
}

const profile = await rpc("get_public_operator_profile", { _username: username });
const summary = (await rpc("get_public_operator_cert_summary", { _username: username })) ?? {
  gca_count: 0,
  oap_count: 0,
  partner_count: 0,
  verified_total: 0,
};

console.log("Profile:", { name: profile?.display_name, avatar: profile?.avatar_url });
console.log("Summary:", summary);

let avatarDataUrl = null;
if (profile?.avatar_url) {
  const r = await fetch(profile.avatar_url);
  if (r.ok) {
    const ct = r.headers.get("content-type") ?? "image/png";
    const buf = Buffer.from(await r.arrayBuffer());
    avatarDataUrl = `data:${ct};base64,${buf.toString("base64")}`;
    console.log(`Avatar fetched (${buf.byteLength} bytes, ${ct})`);
  }
}

const interRegular = readFileSync("api/_assets/inter-regular.ttf");
const interBold = readFileSync("api/_assets/inter-bold.ttf");

const name = profile?.display_name ?? `@${username}`;
const location = [profile?.location_city, profile?.location_region].filter(Boolean).join(", ");
const headline = (profile?.headline ?? "").length > 130
  ? profile.headline.slice(0, 129).trimEnd() + "…"
  : profile?.headline ?? "";

function buildBadge(s) {
  const parts = [];
  if (s.gca_count > 0) parts.push(`${s.gca_count}× GCA Verified`);
  if (s.oap_count > 0) parts.push(`${s.oap_count}× OAP ${s.oap_count === 1 ? "Certificate" : "Certificates"}`);
  if (s.partner_count > 0) parts.push(`${s.partner_count} Partner ${s.partner_count === 1 ? "Cert" : "Certs"}`);
  return parts.length ? "✓ " + parts.join(" · ") : "Verified Talent on JobLine.ai";
}

function initials(n) {
  if (!n) return "?";
  return n.trim().split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase();
}

const tree = {
  type: "div",
  props: {
    style: { width: "1200px", height: "630px", display: "flex", flexDirection: "column", background: "#ffffff", fontFamily: "Inter", color: "#0f172a" },
    children: [
      { type: "div", props: { style: { height: "120px", background: "linear-gradient(135deg, #0a1628 0%, #0f1f3a 60%, #10b981 130%)", display: "flex", alignItems: "center", padding: "0 60px", gap: "14px" }, children: [
        { type: "div", props: { style: { width: "44px", height: "44px", borderRadius: "10px", background: "linear-gradient(135deg, #3b82f6, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: 700, color: "#0a1628" }, children: "J" } },
        { type: "div", props: { style: { display: "flex", fontSize: "26px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }, children: [
          { type: "span", props: { children: "JobLine" } },
          { type: "span", props: { style: { color: "#10b981" }, children: ".ai" } },
        ] } },
        { type: "div", props: { style: { marginLeft: "auto", fontSize: "16px", color: "#cbd5e1", display: "flex" }, children: "Verified Talent Network" } },
      ] } },
      { type: "div", props: { style: { display: "flex", padding: "50px 60px 40px 60px", gap: "40px", flexGrow: 1, alignItems: "center" }, children: [
        avatarDataUrl
          ? { type: "img", props: { src: avatarDataUrl, width: 200, height: 200, style: { width: "200px", height: "200px", borderRadius: "100px", objectFit: "cover", marginTop: "-100px", border: "6px solid #ffffff", boxShadow: "0 10px 40px rgba(15,23,42,0.15)", flexShrink: 0 } } }
          : { type: "div", props: { style: { width: "200px", height: "200px", borderRadius: "100px", background: "linear-gradient(135deg, #1e40af, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "84px", fontWeight: 700, color: "#ffffff", marginTop: "-100px", border: "6px solid #ffffff", boxShadow: "0 10px 40px rgba(15,23,42,0.15)", flexShrink: 0 }, children: initials(profile?.display_name) } },
        { type: "div", props: { style: { display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }, children: [
          { type: "div", props: { style: { fontSize: "52px", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.05, color: "#0f172a" }, children: name } },
          { type: "div", props: { style: { fontSize: "20px", color: "#64748b", marginTop: "6px" }, children: `@${username}${location ? ` · ${location}` : ""}` } },
          headline && { type: "div", props: { style: { fontSize: "20px", color: "#334155", lineHeight: 1.4, marginTop: "16px", display: "flex" }, children: headline } },
        ].filter(Boolean) } },
      ] } },
      { type: "div", props: { style: { background: "#f1f5f9", padding: "20px 60px", display: "flex", alignItems: "center", gap: "14px", borderTop: "1px solid #e2e8f0" }, children: [
        { type: "div", props: { style: { fontSize: "18px", color: "#10b981", fontWeight: 700, background: "#ffffff", padding: "8px 16px", borderRadius: "8px", border: "1px solid #d1fae5", display: "flex" }, children: buildBadge(summary) } },
        { type: "div", props: { style: { marginLeft: "auto", fontSize: "18px", color: "#475569", fontWeight: 500, display: "flex" }, children: `jobline.ai/talent/${username}` } },
      ] } },
    ],
  },
};

const svg = await satori(tree, {
  width: 1200,
  height: 630,
  fonts: [
    { name: "Inter", data: interRegular, weight: 400, style: "normal" },
    { name: "Inter", data: interBold, weight: 700, style: "normal" },
  ],
});
const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
writeFileSync("/mnt/documents/og-card-production.png", png);
console.log("✓ /mnt/documents/og-card-production.png");
