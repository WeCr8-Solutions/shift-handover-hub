import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";

const interRegular = readFileSync("/tmp/inter-regular.woff");
const interBold = readFileSync("/tmp/inter-bold.woff");

const profile = {
  display_name: "Zach Goodbody",
  public_username: "zachgoodbody",
  headline:
    "Senior Applications Machine Programmer @ General Atomics · Founder & CEO, WeCr8 Solutions · Creator of JobLine.ai",
  location_city: "San Diego",
  location_region: "CA",
  // Use a placeholder avatar URL
  avatar_url: null,
  cert_summary: "13× GCA Verified · OAP Master Machinist",
};

const initials = profile.display_name
  .split(/\s+/)
  .map((s) => s[0])
  .join("")
  .slice(0, 2)
  .toUpperCase();

const truncatedHeadline =
  profile.headline.length > 110
    ? profile.headline.slice(0, 107).trimEnd() + "…"
    : profile.headline;

const location = [profile.location_city, profile.location_region]
  .filter(Boolean)
  .join(", ");

// =========================================================================
// VARIANT A — Dark, brand-aligned (matches existing JobLine OG cards)
// =========================================================================
const darkCard = {
  type: "div",
  props: {
    style: {
      width: "1200px",
      height: "630px",
      display: "flex",
      flexDirection: "column",
      background:
        "linear-gradient(135deg, #0a1628 0%, #0f1f3a 45%, #0a1628 100%)",
      padding: "60px 70px",
      fontFamily: "Inter",
      color: "#ffffff",
      position: "relative",
    },
    children: [
      // Top row: brand
      {
        type: "div",
        props: {
          style: { display: "flex", alignItems: "center", gap: "14px" },
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
                  fontSize: "28px",
                  fontWeight: 700,
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
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  borderRadius: "999px",
                  padding: "8px 18px",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#10b981",
                },
                children: "✓ Verified Talent",
              },
            },
          ],
        },
      },
      // Main row: avatar + identity
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "44px",
            marginTop: "60px",
            flexGrow: 1,
          },
          children: [
            {
              type: "div",
              props: {
                style: {
                  width: "220px",
                  height: "220px",
                  borderRadius: "110px",
                  background: "linear-gradient(135deg, #1e40af, #10b981)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "92px",
                  fontWeight: 700,
                  color: "#ffffff",
                  border: "4px solid rgba(255,255,255,0.15)",
                  flexShrink: 0,
                },
                children: initials,
              },
            },
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  flexGrow: 1,
                },
                children: [
                  {
                    type: "div",
                    props: {
                      style: {
                        fontSize: "56px",
                        fontWeight: 700,
                        letterSpacing: "-0.025em",
                        lineHeight: 1.05,
                      },
                      children: profile.display_name,
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        fontSize: "22px",
                        color: "#94a3b8",
                        marginTop: "-2px",
                      },
                      children: `@${profile.public_username}`,
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        fontSize: "22px",
                        color: "#cbd5e1",
                        lineHeight: 1.35,
                        marginTop: "12px",
                        display: "flex",
                      },
                      children: truncatedHeadline,
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      // Bottom: location + cert summary + URL
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "18px",
            paddingTop: "28px",
            borderTop: "1px solid rgba(148, 163, 184, 0.2)",
          },
          children: [
            location && {
              type: "div",
              props: {
                style: {
                  fontSize: "20px",
                  color: "#cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                },
                children: `📍 ${location}`,
              },
            },
            {
              type: "div",
              props: {
                style: {
                  fontSize: "18px",
                  color: "#10b981",
                  fontWeight: 600,
                  background: "rgba(16, 185, 129, 0.1)",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  display: "flex",
                },
                children: profile.cert_summary,
              },
            },
            {
              type: "div",
              props: {
                style: {
                  marginLeft: "auto",
                  fontSize: "20px",
                  color: "#64748b",
                  display: "flex",
                },
                children: `jobline.ai/talent/${profile.public_username}`,
              },
            },
          ].filter(Boolean),
        },
      },
    ],
  },
};

// =========================================================================
// VARIANT B — Light, LinkedIn-style
// =========================================================================
const lightCard = {
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
      position: "relative",
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
            padding: "50px 60px 40px 60px",
            gap: "40px",
            flexGrow: 1,
            alignItems: "center",
          },
          children: [
            {
              type: "div",
              props: {
                style: {
                  width: "200px",
                  height: "200px",
                  borderRadius: "100px",
                  background: "linear-gradient(135deg, #1e40af, #10b981)",
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
                children: initials,
              },
            },
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  flexGrow: 1,
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
                      children: profile.display_name,
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        fontSize: "20px",
                        color: "#64748b",
                      },
                      children: `@${profile.public_username}${
                        location ? ` · ${location}` : ""
                      }`,
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        fontSize: "20px",
                        color: "#334155",
                        lineHeight: 1.4,
                        marginTop: "14px",
                        display: "flex",
                      },
                      children: truncatedHeadline,
                    },
                  },
                ],
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
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#ffffff",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #d1fae5",
                },
                children: `✓ ${profile.cert_summary}`,
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
                children: `jobline.ai/talent/${profile.public_username}`,
              },
            },
          ],
        },
      },
    ],
  },
};

async function render(node, outPath) {
  const svg = await satori(node, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Inter", data: interRegular, weight: 400, style: "normal" },
      { name: "Inter", data: interBold, weight: 700, style: "normal" },
    ],
  });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } })
    .render()
    .asPng();
  writeFileSync(outPath, png);
  console.log(`✓ ${outPath}`);
}

await render(darkCard, "/mnt/documents/og-card-dark.png");
await render(lightCard, "/mnt/documents/og-card-light.png");
