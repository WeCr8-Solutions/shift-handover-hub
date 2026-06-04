// Concierge accounting export — QuickBooks IIF, QBO CSV, generic CSV
// Platform admin / developer only. Streams a downloadable file.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Format = "qbo_csv" | "qb_iif" | "generic_csv";

interface Body {
  format: Format;
  engagement_ids?: string[];
  date_from?: string; // ISO
  date_to?: string;   // ISO
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function fmtDateMDY(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

interface Row {
  id: string;
  invoice_number: string | null;
  started_at: string;
  payment_received_at: string | null;
  payment_amount_cents: number;
  payment_method: string | null;
  payment_reference: string | null;
  payment_status: string;
  plan_tier: string;
  customer_tax_id: string | null;
  customer_billing_address: Record<string, unknown> | null;
  organizations: { id: string; name: string; slug: string } | null;
}

function buildQboCsv(rows: Row[]): string {
  const header = [
    "InvoiceNo", "Customer", "InvoiceDate", "DueDate", "Item(Product/Service)",
    "ItemDescription", "ItemQuantity", "ItemRate", "ItemAmount",
    "ItemTaxCode", "ItemTaxAmount", "Currency", "ServiceDate", "Memo",
  ];
  const lines = [header.map(csvEscape).join(",")];
  for (const r of rows) {
    const amount = ((r.payment_amount_cents ?? 0) / 100).toFixed(2);
    lines.push([
      r.invoice_number ?? r.id,
      r.organizations?.name ?? "Unknown Org",
      fmtDateMDY(r.started_at),
      fmtDateMDY(r.payment_received_at ?? r.started_at),
      "Concierge Onboarding",
      `Concierge Onboarding — ${r.plan_tier}`,
      "1",
      amount,
      amount,
      "Non",
      "0.00",
      "USD",
      fmtDateMDY(r.payment_received_at ?? r.started_at),
      `Payment: ${r.payment_method ?? "—"} ${r.payment_reference ?? ""}`.trim(),
    ].map(csvEscape).join(","));
  }
  return lines.join("\n");
}

function buildGenericCsv(rows: Row[]): string {
  const header = [
    "invoice_number", "engagement_id", "customer", "plan_tier",
    "invoice_date", "payment_date", "amount_usd", "payment_method",
    "payment_reference", "payment_status", "tax_id",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([
      r.invoice_number ?? "",
      r.id,
      r.organizations?.name ?? "",
      r.plan_tier,
      r.started_at.slice(0, 10),
      r.payment_received_at?.slice(0, 10) ?? "",
      ((r.payment_amount_cents ?? 0) / 100).toFixed(2),
      r.payment_method ?? "",
      r.payment_reference ?? "",
      r.payment_status,
      r.customer_tax_id ?? "",
    ].map(csvEscape).join(","));
  }
  return lines.join("\n");
}

function buildQbIif(rows: Row[]): string {
  // Minimal IIF (QuickBooks Desktop) — INVOICE transactions
  const out: string[] = [];
  out.push([
    "!TRNS", "TRNSID", "TRNSTYPE", "DATE", "ACCNT", "NAME",
    "AMOUNT", "DOCNUM", "MEMO",
  ].join("\t"));
  out.push([
    "!SPL", "SPLID", "TRNSTYPE", "DATE", "ACCNT", "NAME",
    "AMOUNT", "DOCNUM", "MEMO",
  ].join("\t"));
  out.push("!ENDTRNS");
  for (const r of rows) {
    const amount = ((r.payment_amount_cents ?? 0) / 100).toFixed(2);
    const date = fmtDateMDY(r.payment_received_at ?? r.started_at);
    const docnum = r.invoice_number ?? r.id;
    const name = r.organizations?.name ?? "Unknown";
    const memo = `Concierge Onboarding (${r.plan_tier})`;
    out.push([
      "TRNS", "", "INVOICE", date, "Accounts Receivable", name,
      amount, docnum, memo,
    ].join("\t"));
    out.push([
      "SPL", "", "INVOICE", date, "Concierge Services Income", name,
      `-${amount}`, docnum, memo,
    ].join("\t"));
    out.push("ENDTRNS");
  }
  return out.join("\r\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: userData } = await userClient.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: uid, _role: "admin" });
    const { data: isDev } = await admin.rpc("has_role", { _user_id: uid, _role: "developer" });
    if (!isAdmin && !isDev) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const body: Body = await req.json();
    if (!["qbo_csv", "qb_iif", "generic_csv"].includes(body.format)) {
      return new Response(JSON.stringify({ error: "Invalid format" }), { status: 400, headers: corsHeaders });
    }

    let query = admin
      .from("onboarding_engagements")
      .select(`
        id, invoice_number, started_at, payment_received_at, payment_amount_cents,
        payment_method, payment_reference, payment_status, plan_tier,
        customer_tax_id, customer_billing_address,
        organizations:organization_id ( id, name, slug )
      `)
      .eq("payment_status", "paid")
      .order("payment_received_at", { ascending: true });

    if (body.engagement_ids && body.engagement_ids.length > 0) {
      query = query.in("id", body.engagement_ids);
    } else {
      if (body.date_from) query = query.gte("payment_received_at", body.date_from);
      if (body.date_to)   query = query.lte("payment_received_at", body.date_to);
    }

    const { data: rows, error } = await query;
    if (error) throw error;
    const list = (rows ?? []) as unknown as Row[];

    let content: string;
    let mime: string;
    let ext: string;
    if (body.format === "qbo_csv")      { content = buildQboCsv(list);   mime = "text/csv";                  ext = "csv"; }
    else if (body.format === "qb_iif")  { content = buildQbIif(list);    mime = "application/octet-stream";  ext = "iif"; }
    else                                { content = buildGenericCsv(list); mime = "text/csv";                ext = "csv"; }

    // Stamp exported timestamp + audit
    if (list.length > 0) {
      await admin.rpc("mark_concierge_exported_to_accounting", {
        p_engagement_ids: list.map((r) => r.id),
        p_format: body.format,
      });
    }

    const filename = `concierge-export-${new Date().toISOString().slice(0, 10)}.${ext}`;
    return new Response(content, {
      headers: {
        ...corsHeaders,
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Row-Count": String(list.length),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[concierge-accounting-export]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
