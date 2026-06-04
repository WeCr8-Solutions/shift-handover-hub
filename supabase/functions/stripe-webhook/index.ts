import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

// HTML-escape user-supplied strings before injecting into email markup.
function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Product ID to tier mapping
const PRODUCT_TIERS: Record<string, string> = {
  "prod_TrQ3QqbNqlmDiS": "single",
  "prod_TrQ3SzBnvfW4yA": "team",
  "prod_TrQ3Y4BKSsc591": "enterprise",
  "prod_ULmEqvUEDTTrpp": "gca_pro",
};

// Standalone GCA product (per-user, not org-scoped)
const GCA_PRODUCT_ID = "prod_ULmEqvUEDTTrpp";

// ERP add-on product ID to tier mapping
const ERP_PRODUCT_TIERS: Record<string, string> = {
  "prod_U3eObrQgIK5XOW": "starter",
  "prod_U3eOU03pp8fNG0": "pro",
  "prod_U3eOQKkbY8NHrj": "unlimited",
};

// Enterprise per-seat addon price (line item on enterprise subscriptions beyond base 10 seats)
const ENTERPRISE_SEAT_ADDON_PRICE_ID = "price_1Ta3zCCyekafHX78jX7Jp7Sm";
const ENTERPRISE_INCLUDED_SEATS = 10;

/** Pick the base plan item (skips per-seat addon) from a multi-item subscription. */
function findPlanItem(sub: Stripe.Subscription): Stripe.SubscriptionItem | undefined {
  return sub.items.data.find((i) => {
    const pid = i.price.product as string;
    return pid in PRODUCT_TIERS || pid in ERP_PRODUCT_TIERS;
  }) ?? sub.items.data[0];
}

/** Total enterprise seats = 10 included + addon line-item quantity. */
function computeEnterpriseSeats(sub: Stripe.Subscription): number {
  const addon = sub.items.data.find((i) => i.price.id === ENTERPRISE_SEAT_ADDON_PRICE_ID);
  return ENTERPRISE_INCLUDED_SEATS + (addon?.quantity ?? 0);
}

// Entitlements per plan
const PLAN_ENTITLEMENTS: Record<string, { features: Record<string, boolean>; limits: Record<string, number> }> = {
  free: {
    features: { handoff_hub: true, work_orders: true, analytics: false, api_access: false, bulk_upload: false },
    limits: { users: 1, work_orders_per_month: 50, stations: 5 },
  },
  single: {
    features: { handoff_hub: true, work_orders: true, analytics: true, api_access: false, bulk_upload: true },
    limits: { users: 1, work_orders_per_month: 500, stations: 20 },
  },
  team: {
    features: { handoff_hub: true, work_orders: true, analytics: true, api_access: false, bulk_upload: true },
    limits: { users: 10, work_orders_per_month: 2000, stations: 50 },
  },
  enterprise: {
    features: { handoff_hub: true, work_orders: true, analytics: true, api_access: true, bulk_upload: true },
    limits: { users: ENTERPRISE_INCLUDED_SEATS, work_orders_per_month: 10000, stations: 200 },
  },
  gca_pro: {
    // Standalone GCA — does NOT grant org-level platform access.
    // Stored only on gca_subscriptions, not on entitlements.
    features: { gca_pro: true },
    limits: {},
  },
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

async function checkIdempotency(eventId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("stripe_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();
  return !!data;
}

function sanitizePayload(eventType: string, payload: unknown): Record<string, unknown> {
  const obj = payload as Record<string, unknown>;
  // Only keep non-sensitive fields for idempotency and debugging
  const safe: Record<string, unknown> = {
    id: obj.id,
    object: obj.object,
    status: obj.status,
    created: obj.created,
  };

  // Add type-specific safe fields
  if (eventType.startsWith("customer.subscription")) {
    safe.cancel_at_period_end = obj.cancel_at_period_end;
    safe.current_period_end = obj.current_period_end;
  } else if (eventType.startsWith("checkout.session")) {
    safe.payment_status = obj.payment_status;
    safe.mode = obj.mode;
  } else if (eventType.startsWith("invoice.")) {
    safe.status = obj.status;
    safe.amount_due = obj.amount_due;
  }

  return safe;
}

async function recordEvent(eventId: string, eventType: string, payload: unknown) {
  await supabaseAdmin.from("stripe_events").insert({
    id: eventId,
    event_type: eventType,
    payload: sanitizePayload(eventType, payload),
  });
}

async function updateOrgEntitlements(orgId: string, plan: string, erpTier?: string, seatQuantity?: number) {
  const entitlements = PLAN_ENTITLEMENTS[plan] || PLAN_ENTITLEMENTS.free;
  
  const features: Record<string, unknown> = { ...entitlements.features };
  const limits: Record<string, number> = { ...entitlements.limits };

  // For enterprise plans, sync seat quantity from Stripe subscription
  if (plan === "enterprise" && seatQuantity && seatQuantity > 0) {
    limits.users = seatQuantity;
    logStep("Syncing enterprise seat count", { orgId, seatQuantity });
  }

  // Preserve existing ERP tier if not explicitly provided
  if (erpTier) {
    features.erp_connector = true;
    features.erp_tier = erpTier;
  } else {
    // Read existing entitlements to preserve ERP addon state
    const { data: current } = await supabaseAdmin
      .from("entitlements")
      .select("features")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (current?.features) {
      const existing = current.features as Record<string, unknown>;
      if (existing.erp_tier) {
        features.erp_connector = true;
        features.erp_tier = existing.erp_tier;
      }
    }
  }

  const { error } = await supabaseAdmin
    .from("entitlements")
    .upsert({
      organization_id: orgId,
      plan,
      features,
      limits,
    }, { onConflict: "organization_id" });

  if (error) {
    logStep("Error updating entitlements", error);
  }
}

async function updateErpTierOnly(orgId: string, erpTier: string | null) {
  // Fetch current entitlements, then patch only erp fields
  const { data: current } = await supabaseAdmin
    .from("entitlements")
    .select("features")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!current) return;

  const features = (current.features as Record<string, unknown>) || {};
  if (erpTier) {
    features.erp_connector = true;
    features.erp_tier = erpTier;
  } else {
    features.erp_connector = false;
    delete features.erp_tier;
  }

  await supabaseAdmin
    .from("entitlements")
    .update({ features })
    .eq("organization_id", orgId);

  logStep("Updated ERP tier in entitlements", { orgId, erpTier });
}

function isErpProduct(productId: string): boolean {
  return productId in ERP_PRODUCT_TIERS;
}

function isGcaProduct(productId: string): boolean {
  return productId === GCA_PRODUCT_ID;
}

async function upsertGcaSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;

  // Resolve user_id either from metadata or by looking up an existing GCA row
  let resolvedUserId = userId;
  if (!resolvedUserId && customerId) {
    const { data: existing } = await supabaseAdmin
      .from("gca_subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    resolvedUserId = existing?.user_id;
  }

  if (!resolvedUserId) {
    logStep("GCA: cannot resolve user_id, skipping", { subscriptionId: subscription.id });
    return;
  }

  await supabaseAdmin.from("gca_subscriptions").upsert({
    user_id: resolvedUserId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    tier: "gca_pro",
    status: subscription.status,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  }, { onConflict: "user_id" });

  logStep("GCA subscription upserted", { userId: resolvedUserId, status: subscription.status });
}

const CERT_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateCertId(program: "OAP" | "GCA"): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let body = "";
  for (const b of bytes) body += CERT_ALPHABET[b % CERT_ALPHABET.length];
  return `${program}-${body}-${new Date().getFullYear()}`;
}

async function sendCertGateRejectionEmail(
  recipientEmail: string,
  recipientName: string,
  program: "OAP" | "GCA",
  reason: "not_passed" | "no_account",
) {
  try {
    const programLabel = program === "OAP" ? "Operator Acceptance Program" : "G-Code Academy";
    const studyUrl = program === "OAP" ? "https://jobline.ai/oap" : "https://jobline.ai/gcode-academy";
    const reasonText =
      reason === "no_account"
        ? `We couldn't find a JobLine account matching <strong>${esc(recipientEmail)}</strong>. Sign in with the same email you used while practicing the ${esc(programLabel)}, then re-purchase your certificate.`
        : `Our records show no passing attempt yet on the ${esc(programLabel)} test you selected. Take the test (free practice and study are always available), pass it, then re-purchase your certificate.`;
    await supabaseAdmin.functions.invoke("send-email", {
      body: {
        to: recipientEmail,
        subject: `Your ${program} certificate could not be issued — refund available`,
        html: `
          <div style="font-family:-apple-system,Inter,sans-serif;max-width:560px;margin:auto;padding:24px;color:#0F172A">
            <h2 style="margin:0 0 8px">Hi ${esc(recipientName)},</h2>
            <p>Thanks for your purchase. Before we mint a verifiable ${esc(programLabel)} certificate, we need to confirm you've actually passed the underlying test — that's what makes a JobLine cert trustworthy to employers.</p>
            <p>${reasonText}</p>
            <p><a href="${studyUrl}" style="display:inline-block;background:#0F172A;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Open ${esc(programLabel)}</a></p>
            <p style="font-size:12px;color:#64748B;margin-top:24px">If you'd prefer a refund instead, reply to this email or contact <a href="mailto:support@jobline.ai">support@jobline.ai</a>. We refund every cert that wasn't issued, no questions asked.</p>
          </div>
        `,
      },
    });
  } catch (e) {
    console.warn("[stripe-webhook] gate rejection email failed:", e);
  }
}

async function handleCertCheckout(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  const program = (meta.program === "OAP" || meta.program === "GCA") ? meta.program : null;
  const recipientName = meta.recipient_name?.trim();
  const recipientEmail = meta.recipient_email?.trim().toLowerCase();
  const programName = meta.program_name?.trim();

  if (!program || !recipientName || !recipientEmail || !programName) {
    logStep("CERT: missing required metadata, skipping", { sessionId: session.id, meta });
    return;
  }
  if (session.payment_status !== "paid") {
    logStep("CERT: payment not settled, skipping", { sessionId: session.id, payment_status: session.payment_status });
    return;
  }

  // Idempotency: don't issue twice for the same Stripe session
  const table = program === "OAP" ? "oap_certificates" : "gca_certificates";
  const { data: existing } = await supabaseAdmin
    .from(table)
    .select("id, cert_id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (existing) {
    logStep("CERT: already issued for this session", { certId: existing.cert_id });
    return;
  }

  // ── Upgrade path ──
  // The user already holds a digital-only cert and is paying $12 to unlock
  // PDF download + Print. Update the existing row in place (sets
  // stripe_session_id + amount_cents) instead of inserting a new one.
  const upgradeCertId = (meta.upgrade_cert_id ?? "").trim();
  if (upgradeCertId) {
    const { data: upgradeRow } = await supabaseAdmin
      .from(table)
      .select("id, cert_id, stripe_session_id")
      .eq("cert_id", upgradeCertId)
      .maybeSingle();
    if (!upgradeRow) {
      logStep("CERT: upgrade target not found", { upgradeCertId });
      return;
    }
    if (upgradeRow.stripe_session_id) {
      logStep("CERT: upgrade target already paid", { certId: upgradeRow.cert_id });
      return;
    }
    const { error: upErr } = await supabaseAdmin
      .from(table)
      .update({
        stripe_session_id: session.id,
        amount_cents: session.amount_total ?? 1200,
      })
      .eq("id", upgradeRow.id);
    if (upErr) {
      logStep("CERT: upgrade update failed", { error: upErr.message });
      throw upErr;
    }
    logStep("CERT: upgraded to printable", { certId: upgradeRow.cert_id });
    return;
  }

  // Try to resolve a Supabase user from the email (so the cert links to their account if they sign up later)
  let userId: string | null = null;
  // Prefer the explicit recipient_user_id stuffed into metadata at checkout time
  // (the BuyCertificateDialog requires the buyer to be signed in).
  const explicitUserId = (meta.recipient_user_id ?? "").trim();
  if (explicitUserId) {
    userId = explicitUserId;
  } else {
    try {
      const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
      const match = usersList?.users?.find((u) => u.email?.toLowerCase() === recipientEmail);
      userId = match?.id ?? null;
    } catch (e) {
      logStep("CERT: user lookup failed (non-fatal)", { error: String(e) });
    }
  }

  // ── Passed-attempt gate ──
  // Certificates issued through paid jobline.ai checkout require a real
  // passing record on the linked program/bank. If the buyer hasn't passed,
  // skip the cert insert and email them so they can take the test or request
  // a refund. The Stripe charge already settled — refund handling stays manual.
  const bankIdMeta = (meta.bank_id ?? "").trim();
  const roleProgramIdMeta = (meta.role_program_id ?? "").trim();
  if (program === "GCA" && bankIdMeta) {
    if (!userId) {
      logStep("CERT: GCA gate failed — no user mapped to recipient email", { recipientEmail });
      await sendCertGateRejectionEmail(recipientEmail, recipientName, program, "no_account");
      return;
    }
    const { data: passed, error: gErr } = await supabaseAdmin.rpc("has_passed_gca_bank", {
      _user_id: userId,
      _bank_id: bankIdMeta,
    });
    if (gErr) {
      logStep("CERT: GCA gate RPC failed (non-fatal, allowing cert)", { error: gErr.message });
    } else if (!passed) {
      logStep("CERT: GCA gate failed — no passing attempt on bank", { userId, bankIdMeta });
      await sendCertGateRejectionEmail(recipientEmail, recipientName, program, "not_passed");
      return;
    }
  }
  if (program === "OAP" && roleProgramIdMeta) {
    if (!userId) {
      logStep("CERT: OAP gate failed — no user mapped to recipient email", { recipientEmail });
      await sendCertGateRejectionEmail(recipientEmail, recipientName, program, "no_account");
      return;
    }
    const { data: passed, error: oErr } = await supabaseAdmin.rpc(
      "has_passed_oap_role_program",
      { _user_id: userId, _role_program_id: roleProgramIdMeta },
    );
    if (oErr) {
      logStep("CERT: OAP gate RPC failed (non-fatal, allowing cert)", { error: oErr.message });
    } else if (!passed) {
      logStep("CERT: OAP gate failed — incomplete role program", { userId, roleProgramIdMeta });
      await sendCertGateRejectionEmail(recipientEmail, recipientName, program, "not_passed");
      return;
    }
  }

  const certId = generateCertId(program);
  const validFrom = new Date().toISOString().slice(0, 10);
  const amountCents = session.amount_total ?? 1200;

  const insertPayload: Record<string, unknown> = {
    cert_id: certId,
    user_id: userId,
    recipient_name: recipientName,
    recipient_email: recipientEmail,
    program_name: programName,
    valid_from: validFrom,
    valid_until: null,
    amount_cents: amountCents,
    stripe_session_id: session.id,
  };
  if (program === "GCA" && bankIdMeta) {
    insertPayload.bank_id = bankIdMeta;
  }
  if (program === "OAP" && roleProgramIdMeta) {
    insertPayload.role_program_id = roleProgramIdMeta;
  }

  const { data: inserted, error } = await supabaseAdmin
    .from(table)
    .insert(insertPayload)
    .select("id, cert_id")
    .single();
  if (error) {
    logStep("CERT: insert failed", { error: error.message });
    throw error;
  }

  logStep("CERT: issued", { program, certId: inserted.cert_id, recipientEmail });

  // Email the recipient
  try {
    const verifyUrl = `https://jobline.ai/verify/${certId}`;
    const programLabel = program === "OAP" ? "Operator Acceptance Program" : "G-Code Academy";
    await supabaseAdmin.functions.invoke("send-email", {
      body: {
        to: recipientEmail,
        subject: `Your ${program} certificate — ${programName}`,
        html: `
          <div style="font-family:-apple-system,Inter,sans-serif;max-width:560px;margin:auto;padding:24px;color:#0F172A">
            <h2 style="margin:0 0 8px">Congratulations, ${esc(recipientName)}!</h2>
            <p>Your <strong>${esc(programLabel)}</strong> certificate for <strong>${esc(programName)}</strong> has been issued.</p>
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin:16px 0">
              <div style="font-size:11px;color:#64748B;letter-spacing:.08em;text-transform:uppercase">Certificate ID</div>
              <div style="font-family:ui-monospace,monospace;font-size:18px;font-weight:600">${esc(certId)}</div>
            </div>
            <p>Verify or share at:<br/><a href="${esc(verifyUrl)}">${esc(verifyUrl)}</a></p>
            <p style="font-size:12px;color:#64748B">JobLine.ai — ${esc(programLabel)}</p>
          </div>
        `,
      },
    });
  } catch (e) {
    logStep("CERT: email send failed (non-fatal)", { error: String(e) });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  logStep("Processing checkout.session.completed", { sessionId: session.id });

  const orgId = session.metadata?.org_id;
  const productType = session.metadata?.product_type;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // ── $12 OAP/GCA certificate (one-time, guest-allowed) ──
  if (productType === "cert") {
    await handleCertCheckout(session);
    return;
  }

  // ── Concierge Onboarding (one-time) ──
  if (productType === "concierge_onboarding") {
    if (!orgId) { logStep("CONCIERGE: missing org_id"); return; }
    const paymentIntentId = (session.payment_intent as string) ?? session.id;
    const purchasedBy = session.metadata?.purchased_by ?? null;

    // Persist the Stripe customer on the organization so future billing
    // (subscriptions, ERP add-ons, invoices) is tied to the same customer
    // record that paid for concierge onboarding.
    if (customerId) {
      const { error: orgUpdErr } = await supabaseAdmin
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", orgId)
        .is("stripe_customer_id", null);
      if (orgUpdErr) logStep("CONCIERGE: org stripe_customer_id update failed", { error: orgUpdErr.message });
    }

    const { data: engagementId, error: rpcErr } = await supabaseAdmin.rpc(
      "create_concierge_engagement_from_payment",
      {
        p_org_id: orgId,
        p_payment_intent_id: paymentIntentId,
        p_plan_tier: "standard",
        p_purchased_by: purchasedBy,
      },
    );
    if (rpcErr) {
      logStep("CONCIERGE: RPC failed", { error: rpcErr.message, orgId, purchasedBy });
    } else {
      logStep("CONCIERGE: engagement created", { engagementId, orgId, purchasedBy });
    }
    return;
  }

  if (!subscriptionId) {
    logStep("Missing subscription in session");
    return;
  }

  // ── GCA standalone (per-user, no org) ──
  if (productType === "gca" || (!orgId && session.metadata?.user_id)) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const productId = findPlanItem(subscription)?.price.product as string;
    if (isGcaProduct(productId)) {
      await upsertGcaSubscription(subscription);
      logStep("GCA standalone checkout processed");
      return;
    }
  }

  if (!orgId) {
    logStep("Missing org_id in session metadata, skipping org-scoped flow");
    return;
  }

  // Update organization with stripe_customer_id
  await supabaseAdmin
    .from("organizations")
    .update({ stripe_customer_id: customerId })
    .eq("id", orgId);

  // Fetch full subscription details (may contain base plan + seat addon line items)
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const planItem = findPlanItem(subscription);
  const productId = planItem?.price.product as string;

  // GCA product purchased via org checkout? Treat as standalone GCA.
  if (isGcaProduct(productId)) {
    await upsertGcaSubscription(subscription);
    logStep("GCA product detected on org checkout — recorded as standalone");
    return;
  }

  // Check if this is an ERP add-on checkout
  if (isErpProduct(productId)) {
    const erpTier = ERP_PRODUCT_TIERS[productId];
    await updateErpTierOnly(orgId, erpTier);
    logStep("ERP add-on checkout completed", { orgId, erpTier });
    return;
  }

  const plan = PRODUCT_TIERS[productId] || "single";
  const seatQuantity = plan === "enterprise" ? computeEnterpriseSeats(subscription) : (planItem?.quantity || 1);

  // Upsert subscription record
  await supabaseAdmin.from("subscriptions").upsert({
    organization_id: orgId,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    stripe_price_id: planItem?.price.id,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    quantity: seatQuantity,
    metadata: { product_id: productId, plan },
  }, { onConflict: "stripe_subscription_id" });

  // Update organization status (trialing = active access with card on file)
  const orgStatus = (subscription.status === "active" || subscription.status === "trialing") ? "active" : subscription.status;

  await supabaseAdmin
    .from("organizations")
    .update({
      subscription_tier: plan,
      subscription_status: orgStatus,
    })
    .eq("id", orgId);

  // Update entitlements (with computed seat quantity for enterprise)
  await updateOrgEntitlements(orgId, plan, undefined, plan === "enterprise" ? seatQuantity : undefined);

  logStep("Checkout session processed successfully", { orgId, plan, seatQuantity });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logStep("Processing customer.subscription.updated", { subscriptionId: subscription.id });

  const planItem = findPlanItem(subscription);
  const productId = planItem?.price.product as string;

  // Handle GCA standalone subscription
  if (isGcaProduct(productId)) {
    await upsertGcaSubscription(subscription);
    return;
  }

  // Handle ERP add-on subscription separately
  if (isErpProduct(productId)) {
    await handleErpAddonSubscription(subscription, productId);
    return;
  }

  const { data: subRecord } = await supabaseAdmin
    .from("subscriptions")
    .select("organization_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (!subRecord) {
    logStep("No subscription record found for", subscription.id);
    return;
  }

  const plan = PRODUCT_TIERS[productId] || "single";
  const seatQuantity = plan === "enterprise" ? computeEnterpriseSeats(subscription) : (planItem?.quantity || 1);

  // Update subscription record
  await supabaseAdmin
    .from("subscriptions")
    .update({
      stripe_price_id: planItem?.price.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      quantity: seatQuantity,
      metadata: { product_id: productId, plan },
    })
    .eq("stripe_subscription_id", subscription.id);

  // Update organization status
  // trialing = card on file, auto-charges after trial → treat as active
  const orgStatus = (subscription.status === "active" || subscription.status === "trialing") ? "active" : 
                    subscription.status === "past_due" ? "past_due" : 
                    subscription.status === "canceled" ? "canceled" : subscription.status;

  await supabaseAdmin
    .from("organizations")
    .update({
      subscription_tier: plan,
      subscription_status: orgStatus,
    })
    .eq("id", subRecord.organization_id);

  // Update entitlements (with computed seat quantity for enterprise)
  await updateOrgEntitlements(subRecord.organization_id, plan, undefined, plan === "enterprise" ? seatQuantity : undefined);

  logStep("Subscription updated successfully", { orgId: subRecord.organization_id, plan, status: subscription.status, seatQuantity });
}

async function handleErpAddonSubscription(subscription: Stripe.Subscription, productId: string) {
  const erpTier = ERP_PRODUCT_TIERS[productId];
  const orgId = subscription.metadata?.org_id;

  if (!orgId) {
    // Try to find org via customer ID
    const customerId = subscription.customer as string;
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (!org) {
      logStep("Cannot find org for ERP add-on subscription", { subscriptionId: subscription.id });
      return;
    }

    if (subscription.status === "active") {
      await updateErpTierOnly(org.id, erpTier);
    } else if (subscription.status === "canceled") {
      await updateErpTierOnly(org.id, null);
    }

    logStep("ERP add-on processed", { orgId: org.id, erpTier, status: subscription.status });
    return;
  }

  if (subscription.status === "active") {
    await updateErpTierOnly(orgId, erpTier);
  } else if (subscription.status === "canceled") {
    await updateErpTierOnly(orgId, null);
  }

  logStep("ERP add-on processed", { orgId, erpTier, status: subscription.status });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logStep("Processing customer.subscription.deleted", { subscriptionId: subscription.id });

  const productId = findPlanItem(subscription)?.price.product as string;

  // Handle GCA standalone cancellation
  if (isGcaProduct(productId)) {
    await supabaseAdmin
      .from("gca_subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: false,
      })
      .eq("stripe_subscription_id", subscription.id);
    logStep("GCA subscription canceled", { subscriptionId: subscription.id });
    return;
  }

  // Handle ERP add-on cancellation
  if (isErpProduct(productId)) {
    await handleErpAddonSubscription(subscription, productId);
    return;
  }

  const { data: subRecord } = await supabaseAdmin
    .from("subscriptions")
    .select("organization_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (!subRecord) {
    logStep("No subscription record found for", subscription.id);
    return;
  }

  // Update subscription record
  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  // Update organization to free tier
  await supabaseAdmin
    .from("organizations")
    .update({
      subscription_tier: "free",
      subscription_status: "canceled",
    })
    .eq("id", subRecord.organization_id);

  // Reset entitlements to free
  await updateOrgEntitlements(subRecord.organization_id, "free");

  logStep("Subscription deleted, org reverted to free", { orgId: subRecord.organization_id });
}

// ─── Billing reminder dispatch helpers ────────────────────────────────────────
const APP_URL = Deno.env.get("APP_URL") || "https://jobline.ai";
const INTERNAL_REMINDER_KEY = Deno.env.get("INTERNAL_REMINDER_KEY") || "";
const SUPABASE_PROJECT_URL = Deno.env.get("SUPABASE_URL") ?? "";

function fmtDateLong(iso: string | number): string {
  const d = typeof iso === "number" ? new Date(iso * 1000) : new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
function fmtAnchor(iso: string | number): string {
  const d = typeof iso === "number" ? new Date(iso * 1000) : new Date(iso);
  return d.toISOString().slice(0, 10);
}
function fmtAmount(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

async function getOrgOwnerEmail(orgId: string): Promise<string | null> {
  const { data: owner } = await supabaseAdmin
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .eq("role", "owner")
    .maybeSingle();
  if (!owner?.user_id) return null;
  const { data: u } = await supabaseAdmin.auth.admin.getUserById(owner.user_id);
  return u?.user?.email ?? null;
}

async function dispatchReminder(body: Record<string, unknown>): Promise<void> {
  if (!INTERNAL_REMINDER_KEY) {
    logStep("INTERNAL_REMINDER_KEY missing — skipping reminder dispatch");
    return;
  }
  try {
    const res = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/send-billing-reminder`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-key": INTERNAL_REMINDER_KEY },
      body: JSON.stringify(body),
    });
    if (!res.ok) logStep("send-billing-reminder non-OK", { status: res.status, body: await res.text() });
  } catch (e) {
    logStep("send-billing-reminder dispatch error", { err: String(e) });
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, eventId: string) {
  logStep("Processing invoice.payment_failed", { invoiceId: invoice.id });

  const customerId = invoice.customer as string;

  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (org) {
    await supabaseAdmin
      .from("organizations")
      .update({ subscription_status: "past_due" })
      .eq("id", org.id);
    logStep("Set org to past_due", { orgId: org.id });

    const email = await getOrgOwnerEmail(org.id);
    if (email) {
      await dispatchReminder({
        type: "payment-failed",
        to: email,
        organizationId: org.id,
        stripeSubscriptionId: invoice.subscription as string | null,
        stripeEventId: eventId,
        data: {
          amount: fmtAmount(invoice.amount_due ?? 0, invoice.currency ?? "usd"),
          currency: invoice.currency ?? "usd",
          attemptCount: invoice.attempt_count ?? 1,
          nextAttemptAt: invoice.next_payment_attempt ? fmtDateLong(invoice.next_payment_attempt) : undefined,
          updatePaymentUrl: `${APP_URL}/settings/billing`,
        },
      });
    }
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  logStep("Processing invoice.payment_succeeded", { invoiceId: invoice.id });
  const customerId = invoice.customer as string;
  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("id, subscription_status")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (org && org.subscription_status === "past_due") {
    await supabaseAdmin
      .from("organizations")
      .update({ subscription_status: "active" })
      .eq("id", org.id);
    logStep("Restored org to active from past_due", { orgId: org.id });
  }
}

async function handleInvoiceUpcoming(invoice: Stripe.Invoice, eventId: string) {
  logStep("Processing invoice.upcoming", { invoiceId: invoice.id });
  if (!invoice.subscription) return;
  const { data: subRow } = await supabaseAdmin
    .from("subscriptions")
    .select("organization_id, stripe_price_id")
    .eq("stripe_subscription_id", invoice.subscription as string)
    .maybeSingle();
  if (!subRow?.organization_id) return;
  const email = await getOrgOwnerEmail(subRow.organization_id);
  if (!email) return;
  const renewalIso = invoice.next_payment_attempt ?? invoice.period_end ?? Math.floor(Date.now() / 1000);
  await dispatchReminder({
    type: "renewal-upcoming",
    to: email,
    organizationId: subRow.organization_id,
    stripeSubscriptionId: invoice.subscription as string,
    stripeEventId: eventId,
    periodAnchor: fmtAnchor(renewalIso),
    data: {
      planName: PRODUCT_TIERS[(invoice.lines.data[0]?.price?.product as string) ?? ""] ?? "Subscription",
      amount: fmtAmount(invoice.amount_due ?? 0, invoice.currency ?? "usd"),
      currency: invoice.currency ?? "usd",
      renewalDate: fmtDateLong(renewalIso),
      manageUrl: `${APP_URL}/settings/billing`,
    },
  });
}

async function handleTrialWillEnd(sub: Stripe.Subscription, eventId: string) {
  logStep("Processing customer.subscription.trial_will_end", { subId: sub.id });
  const { data: subRow } = await supabaseAdmin
    .from("subscriptions")
    .select("organization_id")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();
  const orgId = subRow?.organization_id;
  if (!orgId || !sub.trial_end) return;
  const email = await getOrgOwnerEmail(orgId);
  if (!email) return;
  const days = Math.max(1, Math.round((sub.trial_end * 1000 - Date.now()) / 86400_000));
  await dispatchReminder({
    type: "trial-ending",
    to: email,
    organizationId: orgId,
    stripeSubscriptionId: sub.id,
    stripeEventId: eventId,
    periodAnchor: fmtAnchor(sub.trial_end),
    data: {
      daysRemaining: days,
      trialEndsAt: fmtDateLong(sub.trial_end),
      manageUrl: `${APP_URL}/pricing`,
    },
  });
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(JSON.stringify({ error: "No signature" }), { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    
    logStep("Received event", { type: event.type, id: event.id });

    // Check idempotency
    if (await checkIdempotency(event.id)) {
      logStep("Event already processed, skipping", { id: event.id });
      return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
    }

    // Record event for idempotency
    await recordEvent(event.id, event.type, event.data.object);

    // Handle events
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event.data.object as Stripe.Subscription, event.id);
        break;
      case "invoice.upcoming":
        await handleInvoiceUpcoming(event.data.object as Stripe.Invoice, event.id);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, event.id);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Webhook error", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), { status: 400 });
  }
});
