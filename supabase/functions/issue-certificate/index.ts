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

// HTML-escape user-controlled values before interpolating into email markup.
function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

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

    // ── Passed-attempt gate ──
    // Even an org admin issuing a cert for a member must be able to demonstrate
    // the recipient passed the underlying tests. Platform admins can bypass
    // (e.g. importing legacy training records or grandfathering).
    if (!isPlatformAdmin) {
      if (body.program === "GCA" && body.bankId) {
        const { data: passedGca, error: gcaErr } = await supabaseAdmin.rpc(
          "has_passed_gca_bank",
          { _user_id: userId, _bank_id: body.bankId },
        );
        if (gcaErr) throw new Error(`Passed-attempt check failed: ${gcaErr.message}`);
        if (!passedGca) {
          throw new Error(
            "This recipient has no passing attempt on the linked GCA question bank. They must pass the test before a certificate can be issued.",
          );
        }
      }
      if (body.program === "OAP" && body.rolePragramId) {
        const { data: passedOap, error: oapErr } = await supabaseAdmin.rpc(
          "has_passed_oap_role_program",
          { _user_id: userId, _role_program_id: body.rolePragramId },
        );
        if (oapErr) throw new Error(`Passed-attempt check failed: ${oapErr.message}`);
        if (!passedOap) {
          throw new Error(
            "This recipient has not passed every required quiz in the linked OAP role program. They must complete the program before a certificate can be issued.",
          );
        }
      }
    }

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

    // ── Mentor sign-off gate ──
    // Every real GCA/OAP cert MUST be signed by an approved certifying mentor:
    //   • Self-pay (no organizationId)  → approved platform mentor for `program`.
    //   • Org-issued (paid employer)   → approved org mentor for `program` in
    //     that org. The `can_certify` SQL function also enforces that the org
    //     is on a paid subscription tier.
    // Platform admins can bypass (legacy import / grandfather flow).
    let signedByUserId: string | null = null;
    let signedByName: string | null = null;
    let signedByTitle: string | null = null;
    let signedBySignatureUrl: string | null = null;

    const mentorUserId = (body as any).mentorUserId as string | undefined;

    if (!isPlatformAdmin) {
      if (!mentorUserId) {
        throw new Error(
          "A certifying mentor is required. Self-pay learners pick a JobLine.ai-approved mentor; employer issuance picks an approved mentor from the organization.",
        );
      }
      const { data: canCertify, error: canErr } = await supabaseAdmin.rpc("can_certify", {
        _user_id: mentorUserId,
        _org_id: body.organizationId ?? null,
        _program: body.program,
      });
      if (canErr) throw new Error(`Mentor authorization check failed: ${canErr.message}`);
      if (!canCertify) {
        throw new Error(
          body.organizationId
            ? "Selected mentor is not an approved certifying mentor for this organization, or the organization is not on a paid plan."
            : "Selected mentor is not a JobLine.ai-approved platform mentor for this program.",
        );
      }
    }

    if (mentorUserId) {
      const { data: mentorRow } = await supabaseAdmin
        .from("certifying_mentors")
        .select("user_name, title, signature_url, scope")
        .eq("user_id", mentorUserId)
        .eq("approval_status", "approved")
        .eq("is_active", true)
        .maybeSingle();
      const { data: mentorProfile } = await supabaseAdmin
        .from("profiles")
        .select("display_name")
        .eq("user_id", mentorUserId)
        .maybeSingle();
      signedByUserId = mentorUserId;
      signedByName =
        (mentorRow as any)?.user_name ??
        (mentorProfile as any)?.display_name ??
        "Certifying Mentor";
      signedByTitle =
        (mentorRow as any)?.title ??
        ((mentorRow as any)?.scope === "platform"
          ? "JobLine.ai Certifying Mentor"
          : `Certifying Mentor, ${body.program}`);
      signedBySignatureUrl = (mentorRow as any)?.signature_url ?? null;
    }


    // Detect Act-As impersonation so the cert is attributable to the real actor.
    let actingViaUserId: string | null = null;
    try {
      const { data: actAs } = await supabaseAdmin
        .from("act_as_sessions")
        .select("actor_id")
        .eq("target_user_id", caller.id)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      actingViaUserId = (actAs as any)?.actor_id ?? null;
    } catch (_e) { /* non-fatal */ }

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
      acting_via_user_id: actingViaUserId,
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
