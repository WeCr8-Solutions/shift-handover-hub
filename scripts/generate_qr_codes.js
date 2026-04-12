#!/usr/bin/env node
/**
 * generate_qr_codes.js
 *
 * Generates 22 QR code PNGs for the San Diego County flyer drop campaign.
 * Output: scripts/qr_output/<filename>.png (1000x1000, error correction H, #0d1b2a foreground)
 *
 * Usage:
 *   node scripts/generate_qr_codes.js
 *
 * Prerequisites (install once, not saved to package.json — dev/ops only):
 *   npm install qrcode@1 canvas
 *
 * Each QR code encodes the Bitly short URL if available, otherwise the full UTM URL.
 * Optionally set UPLOAD=true to upload PNGs to the Supabase flyer-qr-codes bucket:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... UPLOAD=true node scripts/generate_qr_codes.js
 */

import QRCode from "qrcode";
import { createCanvas } from "canvas";
import { createWriteStream, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "qr_output");
mkdirSync(OUT_DIR, { recursive: true });

// ─── Zone data (mirrors flyerZoneData.ts) ─────────────────────────────────────
const UTM_BASE = "https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=";

const ZONES = [
  [1,  "z01_santee_wheatlands",    "jl-z01"],
  [2,  "z02_santee_prospect",      "jl-z02"],
  [3,  "z03_santee_cuyamaca",      "jl-z03"],
  [4,  "z04_elcajon_magnolia",     "jl-z04"],
  [5,  "z05_elcajon_raleigh",      "jl-z05"],
  [6,  "z06_elcajon_bradley",      "jl-z06"],
  [7,  "z07_elcajon_gillespie",    "jl-z07"],
  [8,  "z08_elcajon_bond",         "jl-z08"],
  [9,  "z09_lakeside",             "jl-z09"],
  [10, "z10_lamesa",               "jl-z10"],
  [11, "z11_springvalley",         "jl-z11"],
  [12, "z12_poway",                "jl-z12"],
  [13, "z13_miramar",              "jl-z13"],
  [14, "z14_firearms_regional",    "jl-z14"],
  [15, "z15_santee_missiongorge",  "jl-z15"],
  [16, "z16_lemongrove",           "jl-z16"],
  [17, "z17_nationalcity",         "jl-z17"],
  [18, "z18_chulavista",           "jl-z18"],
  [19, "z19_kearnymesa",           "jl-z19"],
  [20, "z20_midcity",              "jl-z20"],
  [21, "z21_pointloma",            "jl-z21"],
  [22, "z22_sorrentovalley",       "jl-z22"],
];

const SIZE = 1000;
const FG   = "#0d1b2a";

async function generatePng(url, filename) {
  const outPath = join(OUT_DIR, filename);

  // Render via canvas so we get a true raster PNG
  const canvas = createCanvas(SIZE, SIZE);
  await QRCode.toCanvas(canvas, url, {
    errorCorrectionLevel: "H",
    width: SIZE,
    margin: 4,
    color: { dark: FG, light: "#ffffff" },
  });

  return new Promise((resolve, reject) => {
    const out = createWriteStream(outPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on("finish", () => resolve(outPath));
    out.on("error", reject);
  });
}

async function uploadToSupabase(filePath, filename) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
  );
  const { readFileSync } = await import("fs");
  const buf = readFileSync(filePath);
  const { error } = await supabase.storage
    .from("flyer-qr-codes")
    .upload(`san_diego_drop/${filename}`, buf, {
      contentType: "image/png",
      upsert: true,
    });
  if (error) throw new Error(`Upload failed for ${filename}: ${error.message}`);
}

async function main() {
  const doUpload = process.env.UPLOAD === "true";
  console.log(`Generating ${ZONES.length} QR codes → ${OUT_DIR}`);
  if (doUpload) console.log("Upload mode enabled — will push to Supabase flyer-qr-codes bucket.");

  for (const [num, slug, bitlyHalf] of ZONES) {
    // Prefer Bitly URL; falls back to full UTM URL
    const url = `https://bit.ly/${bitlyHalf}`;
    const filename = `qr_${slug}.png`;
    try {
      const outPath = await generatePng(url, filename);
      process.stdout.write(`  [Z${String(num).padStart(2,"0")}] ${filename}`);
      if (doUpload) {
        await uploadToSupabase(outPath, filename);
        process.stdout.write(" → uploaded");
      }
      console.log(" ✓");
    } catch (err) {
      console.error(`  [Z${String(num).padStart(2,"0")}] FAILED: ${err.message}`);
    }
  }

  console.log("\nDone. Files are in scripts/qr_output/");
  if (!doUpload) {
    console.log("To upload: SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<service_role_key> UPLOAD=true node scripts/generate_qr_codes.js");
  }
}

main().catch(console.error);
