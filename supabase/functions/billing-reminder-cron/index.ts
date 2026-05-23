/**
 * billing-reminder-cron
 *
 * Daily safety-net scanner. Looks for:
 *  - Subscriptions whose current_period_end is 6-8 days away → renewal-upcoming
 *  - Organizations whose trial_ends_at is 2-4 days away → trial-ending
 *
 * Dedupe is handled by send-billing-reminder against billing_reminder_log.
 * Invoked by pg_cron daily; can also be triggered manually for testing.
 *
 * verify_jwt = false (cron + internal admin only)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-key',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const INTERNAL_KEY = Deno.env.get('INTERNAL_REMINDER_KEY') || ''
const APP_URL = Deno.env.get('APP_URL') || 'https://jobline.ai'

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

async function invokeReminder(body: Record<string, unknown>): Promise<{ ok: boolean; err?: string }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-billing-reminder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': INTERNAL_KEY,
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) return { ok: false, err: `${res.status}: ${text}` }
  return { ok: true }
}

async function findOrgOwnerEmail(orgId: string): Promise<string | null> {
  const { data: owner } = await admin
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('role', 'owner')
    .maybeSingle()
  if (!owner?.user_id) return null
  const { data: userResult } = await admin.auth.admin.getUserById(owner.user_id)
  return userResult?.user?.email ?? null
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function fmtAnchor(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

function planNameFromPriceId(_priceId: string): string {
  // Light mapping; kept simple — full mapping lives in stripe-webhook.
  return 'Subscription'
}

async function scanRenewals(now: Date) {
  const startISO = new Date(now.getTime() + 6 * 86400_000).toISOString()
  const endISO = new Date(now.getTime() + 8 * 86400_000).toISOString()

  const { data: subs, error } = await admin
    .from('subscriptions')
    .select('stripe_subscription_id, stripe_price_id, organization_id, current_period_end, status')
    .gte('current_period_end', startISO)
    .lte('current_period_end', endISO)
    .eq('status', 'active')

  if (error) {
    console.error('[cron] sub scan error:', error)
    return { scanned: 0, sent: 0, errors: 1 }
  }

  let sent = 0
  let errors = 0
  for (const s of subs ?? []) {
    if (!s.organization_id || !s.current_period_end) continue
    const email = await findOrgOwnerEmail(s.organization_id)
    if (!email) { errors++; continue }
    const r = await invokeReminder({
      type: 'renewal-upcoming',
      to: email,
      organizationId: s.organization_id,
      stripeSubscriptionId: s.stripe_subscription_id,
      periodAnchor: fmtAnchor(s.current_period_end),
      data: {
        planName: planNameFromPriceId(s.stripe_price_id),
        amount: '',
        currency: 'usd',
        renewalDate: fmtDate(s.current_period_end),
        manageUrl: `${APP_URL}/settings/billing`,
      },
    })
    if (r.ok) sent++; else errors++
  }
  return { scanned: subs?.length ?? 0, sent, errors }
}

async function scanTrials(now: Date) {
  const startISO = new Date(now.getTime() + 2 * 86400_000).toISOString()
  const endISO = new Date(now.getTime() + 4 * 86400_000).toISOString()

  const { data: orgs, error } = await admin
    .from('organizations')
    .select('id, trial_ends_at, subscription_status')
    .gte('trial_ends_at', startISO)
    .lte('trial_ends_at', endISO)
    .eq('subscription_status', 'trial')

  if (error) {
    console.error('[cron] trial scan error:', error)
    return { scanned: 0, sent: 0, errors: 1 }
  }

  let sent = 0
  let errors = 0
  for (const o of orgs ?? []) {
    if (!o.trial_ends_at) continue
    const email = await findOrgOwnerEmail(o.id)
    if (!email) { errors++; continue }
    const days = Math.max(1, Math.round((new Date(o.trial_ends_at).getTime() - now.getTime()) / 86400_000))
    const r = await invokeReminder({
      type: 'trial-ending',
      to: email,
      organizationId: o.id,
      periodAnchor: fmtAnchor(o.trial_ends_at),
      data: {
        daysRemaining: days,
        trialEndsAt: fmtDate(o.trial_ends_at),
        manageUrl: `${APP_URL}/pricing`,
      },
    })
    if (r.ok) sent++; else errors++
  }
  return { scanned: orgs?.length ?? 0, sent, errors }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const internalKey = req.headers.get('x-internal-key')
  if (!INTERNAL_KEY || internalKey !== INTERNAL_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const now = new Date()
  const [renewals, trials] = await Promise.all([scanRenewals(now), scanTrials(now)])
  const summary = { ok: true, ranAt: now.toISOString(), renewals, trials }
  console.log('[billing-reminder-cron] summary:', JSON.stringify(summary))
  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
})
