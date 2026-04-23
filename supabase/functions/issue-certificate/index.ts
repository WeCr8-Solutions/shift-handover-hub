// supabase/functions/issue-certificate/index.ts
//
// Shared issuance endpoint for OAP and GCA certificates.
// - Generates a unique cert_id + qr_token
// - Renders a branded HTML certificate (PDF rendering deferred to client/print
//   for now — the verification URL + QR are baked in)
// - Inserts into oap_certificates or gca_certificates
// - Optionally emails the recipient via the existing send-email function
//
// Auth: requires a signed-in user. For paid issuance, the create-checkout
// stripe-webhook flow should call this with a service-role token after payment
// settles. For free issuance (e.g. an org admin granting a cert), the caller
// must be a platform admin or org admin/supervisor of the recipient's org.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type OapVertical =
  | "machining" | "cabinetry" | "automotive" | "welding"
  | "construction" | "electrical" | "plumbing" | "hvac" | "general";

const VERTICAL_CODES: Record<OapVertical, string> = {
  machining: "MAC", cabinetry: "CAB", automotive: "AUTO", welding: "WELD",
  construction: "CON", electrical: "ELEC", plumbing: "PLM", hvac: "HVAC", general: "GEN",
};

function generateCertId(program: "OAP" | "GCA", vertical: OapVertical = "machining"): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let body = "";
  for (const b of bytes) body += ALPHABET[b % ALPHABET.length];
  const year = new Date().getFullYear();
  // GCA stays single-segment; OAP machining stays single-segment for back-compat.
  if (program === "GCA" || vertical === "machining") return `${program}-${body}-${year}`;
  return `${program}-${VERTICAL_CODES[vertical]}-${body}-${year}`;
}

interface IssueRequest {
  program: "OAP" | "GCA";
  vertical?: OapVertical;
  recipientName: string;
  recipientEmail: string;
  programName: string;
  organizationId?: string | null;
  rolePragramId?: string | null;
  bankId?: string | null;
  validUntil?: string | null;
  amountCents?: number;
  stripeSessionId?: string | null;
  items?: Array<{
    item_type:
      | "machine" | "inspection_tool" | "machining_operation"
      | "safety_credential" | "course"
      | "vertical_role" | "trade_tool" | "license";
    item_slug?: string | null;
    display_label: string;
  }>;
  sendEmail?: boolean;
  userId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr) throw new Error(`Auth error: ${userErr.message}`);
    const caller = userData.user;
    if (!caller) throw new Error("Not authenticated");

    const body = (await req.json()) as IssueRequest;
    if (!body.program || !["OAP", "GCA"].includes(body.program)) {
      throw new Error("program must be 'OAP' or 'GCA'");
    }
    if (!body.recipientName || !body.recipientEmail || !body.programName) {
      throw new Error("recipientName, recipientEmail, and programName are required");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authorization: platform admin OR org admin/supervisor of the recipient's org
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    const isPlatformAdmin = (roles ?? []).some((r) => r.role === "admin");

    if (!isPlatformAdmin) {
      if (!body.organizationId) {
        throw new Error("Only platform admins can issue certs without an organizationId");
      }
      const { data: membership } = await supabaseAdmin
        .from("organization_members")
        .select("role")
        .eq("organization_id", body.organizationId)
        .eq("user_id", caller.id)
        .maybeSingle();
      if (!membership || !["owner", "admin", "supervisor"].includes(membership.role)) {
        throw new Error("Insufficient permissions to issue certificate for this organization");
      }
    }

    const vertical: OapVertical = body.vertical ?? "machining";
    const certId = generateCertId(body.program, vertical);
    const userId = body.userId ?? caller.id;
    const validFrom = new Date().toISOString().slice(0, 10);

    // Default validUntil: for OAP issued by an org, use org's oap_default_recert_months
    // (default 12). GCA stays lifetime (null) unless caller passes one.
    let resolvedValidUntil: string | null = body.validUntil ?? null;
    if (!resolvedValidUntil && body.program === "OAP" && body.organizationId) {
      const { data: orgRecert } = await supabaseAdmin
        .from("organizations")
        .select("oap_default_recert_months")
        .eq("id", body.organizationId)
        .maybeSingle();
      const months = (orgRecert as any)?.oap_default_recert_months ?? 12;
      if (months && months > 0) {
        const d = new Date();
        d.setMonth(d.getMonth() + months);
        resolvedValidUntil = d.toISOString().slice(0, 10);
      }
    }

    // Snapshot recipient public username (from operator_profiles) so the QR keeps
    // working even if the username later changes.
    const { data: recipientProfile } = await supabaseAdmin
      .from("operator_profiles")
      .select("public_username")
      .eq("user_id", userId)
      .maybeSingle();
    const recipientUsername = (recipientProfile as any)?.public_username ?? null;

    // Resolve signer. For OAP issued by an org, the org's designated mentor signs.
    // jobline.ai certifier path is intentionally NOT implemented yet (no testing stations).
    let signedByUserId: string | null = null;
    let signedByName: string | null = null;
    let signedByTitle: string | null = null;
    const signedBySignatureUrl: string | null = null; // Upload UI deferred — column reserved.

    if (body.program === "OAP" && body.organizationId) {
      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("designated_oap_mentor_user_id, name")
        .eq("id", body.organizationId)
        .maybeSingle();
      const mentorId = (org as any)?.designated_oap_mentor_user_id;
      if (!mentorId) {
        throw new Error(
          "This organization has no designated OAP mentor set. An admin must assign one in Organization Settings before issuing OAP certificates."
        );
      }
      const { data: mentor } = await supabaseAdmin
        .from("profiles")
        .select("display_name")
        .eq("user_id", mentorId)
        .maybeSingle();
      signedByUserId = mentorId;
      signedByName = (mentor as any)?.display_name ?? "Designated OAP Mentor";
      signedByTitle = `Designated OAP Mentor, ${(org as any)?.name ?? "Organization"}`;
    }

    const table = body.program === "OAP" ? "oap_certificates" : "gca_certificates";
    const insertPayload: Record<string, unknown> = {
      cert_id: certId,
      user_id: userId,
      recipient_name: body.recipientName,
      recipient_email: body.recipientEmail,
      recipient_username: recipientUsername,
      program_name: body.programName,
      valid_from: validFrom,
      valid_until: resolvedValidUntil,
      amount_cents: body.amountCents ?? 1200,
      stripe_session_id: body.stripeSessionId ?? null,
      signed_by_user_id: signedByUserId,
      signed_by_name: signedByName,
      signed_by_title: signedByTitle,
      signed_by_signature_url: signedBySignatureUrl,
    };
    if (body.program === "OAP") {
      insertPayload.organization_id = body.organizationId ?? null;
      insertPayload.role_program_id = body.rolePragramId ?? null;
      insertPayload.vertical = vertical;
    } else {
      insertPayload.bank_id = body.bankId ?? null;
      // Track issuing org so org admins can audit GCA certs they paid to issue.
      if (body.organizationId) insertPayload.issuing_organization_id = body.organizationId;
    }

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from(table)
      .insert(insertPayload)
      .select("id, cert_id, qr_token, valid_from, valid_until, recipient_name, recipient_email, program_name")
      .single();
    if (insErr) throw insErr;

    // Insert items for OAP certs
    if (body.program === "OAP" && body.items?.length) {
      const itemRows = body.items.map((it, i) => ({
        certificate_id: inserted.id,
        item_type: it.item_type,
        item_slug: it.item_slug ?? null,
        display_label: it.display_label,
        sort_order: i,
      }));
      await supabaseAdmin.from("oap_certificate_items").insert(itemRows);
    }

    // Optional email
    if (body.sendEmail !== false) {
      try {
        const origin = req.headers.get("origin") ?? "https://jobline.ai";
        const verifyUrl = `${origin}/verify/${certId}`;
        const talentUrl = recipientUsername ? `https://jobline.ai/talent/${recipientUsername}` : null;
        await supabaseAdmin.functions.invoke("send-email", {
          body: {
            to: body.recipientEmail,
            subject: `Your ${body.program} certificate — ${body.programName}`,
            html: `
              <div style="font-family:-apple-system,Inter,sans-serif;max-width:560px;margin:auto;padding:24px;color:#0F172A">
                <h2 style="margin:0 0 8px">Congratulations, ${body.recipientName}!</h2>
                <p>Your <strong>${body.program === "OAP" ? "Operator Acceptance Program" : "G-Code Academy"}</strong> certificate for <strong>${body.programName}</strong> has been issued.</p>
                <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin:16px 0">
                  <div style="font-size:11px;color:#64748B;letter-spacing:.08em;text-transform:uppercase">Certificate ID</div>
                  <div style="font-family:ui-monospace,monospace;font-size:18px;font-weight:600">${certId}</div>
                </div>
                <p>Verify or share at:<br/><a href="${verifyUrl}">${verifyUrl}</a></p>
                ${talentUrl ? `<p>Your public operator profile:<br/><a href="${talentUrl}">${talentUrl}</a></p>` : ""}
                <p style="font-size:12px;color:#64748B">JobLine.ai — Operator Acceptance Program & G-Code Academy</p>
              </div>
            `,
          },
        });
      } catch (e) {
        console.warn("[issue-certificate] email send skipped:", e);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        certId,
        program: body.program,
        record: inserted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[issue-certificate] error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
