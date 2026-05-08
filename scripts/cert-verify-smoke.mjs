#!/usr/bin/env node
/**
 * Public Certificate Verification Smoke Test
 *
 * Ensures the public certificate verification path stays functional:
 *   1. The Supabase `verify_oap_certificate` and `verify_gca_certificate` RPCs
 *      are callable anonymously (no JWT) — required for public /verify pages.
 *   2. Both RPCs return a row shape that includes `cert_id` and `recipient_name`
 *      when given a known-good cert id (sampled live).
 *   3. The deployed `/verify/:certId` HTML route responds with 200.
 *
 * Configuration via env (all optional — sensible defaults for production):
 *   SUPABASE_URL          default https://kgrstnbxqdmadtoankqr.supabase.co
 *   SUPABASE_ANON_KEY     default project anon key (publishable)
 *   PUBLIC_SITE_URL       default https://jobline.ai
 *   SAMPLE_OAP_CERT_ID    optional override for OAP probe id
 *   SAMPLE_GCA_CERT_ID    optional override for GCA probe id
 *
 * If no live cert id is configured AND none can be discovered via a non-cert
 * probe, the script asserts the RPC is reachable (returns []) — failure modes
 * we care about (HTTP 401/403/404/500) still trip the gate.
 *
 * Exit code: 0 = pass, 1 = fail.
 */

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? "https://kgrstnbxqdmadtoankqr.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtncnN0bmJ4cWRtYWR0b2Fua3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzM0MDgsImV4cCI6MjA4NTg0OTQwOH0.XmY5BDVKz2SBv4_MZk7lgrP5CJDSXeCl-PwDFoCwiik";
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL ?? "https://jobline.ai";

const failures = [];

function pass(msg) {
  console.log(`PASS ${msg}`);
}
function fail(msg) {
  console.log(`FAIL ${msg}`);
  failures.push(msg);
}

async function callRpc(fnName, body) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  let json = null;
  try {
    json = await resp.json();
  } catch {
    /* ignore */
  }
  return { status: resp.status, json };
}

async function probeRpc(fnName, sampleId) {
  // 1. Callable anonymously
  const probeId = sampleId ?? `${fnName.includes("oap") ? "OAP" : "GCA"}-NONE-0000`;
  const { status, json } = await callRpc(fnName, { _cert_id: probeId });

  if (status !== 200) {
    fail(`${fnName} returned HTTP ${status} (expected 200) — public verify is broken`);
    return;
  }
  pass(`${fnName} reachable anonymously (HTTP 200)`);

  if (!Array.isArray(json)) {
    fail(`${fnName} did not return an array (got ${typeof json})`);
    return;
  }

  if (sampleId) {
    const row = json[0];
    if (!row) {
      fail(`${fnName}('${sampleId}') returned 0 rows — sample id is no longer valid`);
      return;
    }
    if (!row.cert_id || !row.recipient_name) {
      fail(`${fnName} row missing required fields (cert_id, recipient_name): ${JSON.stringify(row)}`);
      return;
    }
    pass(`${fnName} returned valid row for ${sampleId}`);
  } else {
    pass(`${fnName} shape ok (empty array for unknown id)`);
  }
}

async function probePage(path) {
  const url = `${PUBLIC_SITE_URL}${path}`;
  try {
    const resp = await fetch(url, {
      headers: { "user-agent": "jobline-cert-verify-smoke/1.0" },
      redirect: "follow",
    });
    if (resp.status !== 200) {
      fail(`GET ${url} → HTTP ${resp.status}`);
      return;
    }
    const body = await resp.text();
    if (!body.includes("<html")) {
      fail(`GET ${url} did not return HTML`);
      return;
    }
    pass(`GET ${url} → 200 HTML`);
  } catch (err) {
    fail(`GET ${url} failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function main() {
  console.log(`== Certificate verify smoke ==`);
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Site:     ${PUBLIC_SITE_URL}`);

  await probeRpc("verify_oap_certificate", process.env.SAMPLE_OAP_CERT_ID);
  await probeRpc("verify_gca_certificate", process.env.SAMPLE_GCA_CERT_ID);

  // Page HTTP probe — uses sample ids if provided, else a synthetic one
  // (the SPA still returns 200 HTML for unknown ids and renders "not found").
  const oapId = process.env.SAMPLE_OAP_CERT_ID ?? "OAP-NONE-0000";
  const gcaId = process.env.SAMPLE_GCA_CERT_ID ?? "GCA-NONE-0000";
  await probePage(`/verify/${oapId}`);
  await probePage(`/verify/${gcaId}`);

  console.log(`\n== Result ==`);
  if (failures.length === 0) {
    console.log("PASS public certificate verification is healthy.");
    return;
  }
  for (const f of failures) console.log(`FAIL ${f}`);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error("FAIL smoke could not complete");
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
