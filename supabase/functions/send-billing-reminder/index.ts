/**
 * send-billing-reminder
 *
 * Internal edge function invoked by stripe-webhook, billing-reminder-cron,
 * or admin "send test" actions. Renders one of three React Email templates
 * and sends via Resend, then logs the result to billing_reminder_log
 * (which also serves as the dedupe index).
 *
 * Auth model: protected by INTERNAL_REMINDER_KEY shared secret. Admin UI
 * test sends route through a separate JWT-checked path inside the function.
 *
 * verify_jwt = false (we authenticate ourselves)
 */
import React from 'https://esm.sh/react@18.3.1'
import { Resend } from 'https://esm.sh/resend@4.0.0'
import { render } from 'https://esm.sh/@react-email/render@0.0.17?deps=react@18.3.1,react-dom@18.3.1'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { TrialEndingEmail } from '../_shared/billing-email-templates/trial-ending.tsx'
import { RenewalUpcomingEmail } from '../_shared/billing-email-templates/renewal-upcoming.tsx'
import { PaymentFailedEmail } from '../_shared/billing-email-templates/payment-failed.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-key',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const APP_URL = Deno.env.get('APP_URL') || 'https://jobline.ai'

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
)

type ReminderType = 'trial-ending' | 'renewal-upcoming' | 'payment-failed' | 'test'

interface ReminderRequest {
  type: ReminderType
  to: string
  organizationId?: string | null
  stripeSubscriptionId?: string | null
  stripeEventId?: string | null
  periodAnchor?: string | null // YYYY-MM-DD
  data: Record<string, unknown>
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

function renderTemplate(req: ReminderRequest): { subject: string; html: string } {
  const d = req.data ?? {}
  switch (req.type) {
    case 'trial-ending':
    case 'test': {
      const subject = req.type === 'test'
        ? '[TEST] Your JobLine.ai trial ends soon'
        : `Your JobLine.ai trial ends in ${d.daysRemaining ?? 3} days`
      const html = render(React.createElement(TrialEndingEmail, {
        name: d.name as string | undefined,
        daysRemaining: (d.daysRemaining as number) ?? 3,
        trialEndsAt: (d.trialEndsAt as string) ?? '',
        manageUrl: (d.manageUrl as string) ?? `${APP_URL}/pricing`,
      }))
      return { subject, html }
    }
    case 'renewal-upcoming': {
      const subject = `Your JobLine.ai ${d.planName ?? 'subscription'} renews on ${d.renewalDate ?? 'soon'}`
      const html = render(React.createElement(RenewalUpcomingEmail, {
        name: d.name as string | undefined,
        planName: (d.planName as string) ?? 'Subscription',
        amount: (d.amount as string) ?? '',
        currency: (d.currency as string) ?? 'usd',
        renewalDate: (d.renewalDate as string) ?? '',
        manageUrl: (d.manageUrl as string) ?? `${APP_URL}/settings/billing`,
      }))
      return { subject, html }
    }
    case 'payment-failed': {
      const subject = 'Action needed: your JobLine.ai payment failed'
      const html = render(React.createElement(PaymentFailedEmail, {
        name: d.name as string | undefined,
        amount: (d.amount as string) ?? '',
        currency: (d.currency as string) ?? 'usd',
        attemptCount: (d.attemptCount as number) ?? 1,
        nextAttemptAt: d.nextAttemptAt as string | undefined,
        updatePaymentUrl: (d.updatePaymentUrl as string) ?? `${APP_URL}/settings/billing`,
      }))
      return { subject, html }
    }
    default:
      throw new Error(`Unknown reminder type: ${req.type}`)
  }
}

async function authenticate(req: Request): Promise<{ source: 'internal' | 'user'; userId?: string } | null> {
  const internalKey = req.headers.get('x-internal-key')
  const expected = Deno.env.get('INTERNAL_REMINDER_KEY')
  if (expected && internalKey && internalKey === expected) {
    return { source: 'internal' }
  }
  // Fallback to user JWT (test-send from admin UI)
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.replace('Bearer ', '')
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) return null
  return { source: 'user', userId: data.user.id }
}

async function userIsBillingAdmin(userId: string, orgId?: string | null): Promise<boolean> {
  if (!orgId) {
    const { data } = await admin
      .from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['owner', 'admin'])
      .limit(1)
    return !!(data && data.length > 0)
  }
  const { data } = await admin
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .in('role', ['owner', 'admin'])
    .maybeSingle()
  return !!data
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const auth = await authenticate(req)
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401)

    const body = (await req.json()) as ReminderRequest
    if (!body?.type || !body?.to) {
      return jsonResponse({ error: 'Missing required fields: type, to' }, 400)
    }

    // For user-initiated calls, restrict to test sends and require admin role.
    if (auth.source === 'user') {
      if (body.type !== 'test') {
        return jsonResponse({ error: 'Only test sends allowed for user-initiated requests' }, 403)
      }
      const ok = await userIsBillingAdmin(auth.userId!, body.organizationId)
      if (!ok) return jsonResponse({ error: 'Forbidden: billing admin role required' }, 403)
    }

    // Dedupe check: if periodAnchor provided, ensure no prior 'sent' row exists.
    if (body.periodAnchor && body.type !== 'test') {
      const dedupeKey = body.stripeSubscriptionId ?? body.organizationId
      if (dedupeKey) {
        const { data: existing } = await admin
          .from('billing_reminder_log')
          .select('id')
          .eq('reminder_type', body.type)
          .eq('period_anchor', body.periodAnchor)
          .eq('status', 'sent')
          .or(
            body.stripeSubscriptionId
              ? `stripe_subscription_id.eq.${body.stripeSubscriptionId}`
              : `organization_id.eq.${body.organizationId}`,
          )
          .limit(1)
          .maybeSingle()
        if (existing) {
          return jsonResponse({ success: true, deduped: true, id: existing.id })
        }
      }
    }

    const { subject, html } = renderTemplate(body)

    const { data: emailData, error: sendErr } = await resend.emails.send({
      from: 'JobLine.ai Billing <billing@jobline.ai>',
      to: [body.to],
      subject,
      html,
    })

    if (sendErr) {
      await admin.from('billing_reminder_log').insert({
        organization_id: body.organizationId ?? null,
        user_email: body.to,
        reminder_type: body.type,
        stripe_event_id: body.stripeEventId ?? null,
        stripe_subscription_id: body.stripeSubscriptionId ?? null,
        period_anchor: body.periodAnchor ?? null,
        status: 'failed',
        error: String((sendErr as { message?: string })?.message ?? sendErr),
        metadata: body.data,
      })
      return jsonResponse({ error: 'Failed to send email' }, 502)
    }

    await admin.from('billing_reminder_log').insert({
      organization_id: body.organizationId ?? null,
      user_email: body.to,
      reminder_type: body.type,
      stripe_event_id: body.stripeEventId ?? null,
      stripe_subscription_id: body.stripeSubscriptionId ?? null,
      period_anchor: body.periodAnchor ?? null,
      status: 'sent',
      metadata: { ...body.data, resend_id: emailData?.id },
    })

    return jsonResponse({ success: true, id: emailData?.id })
  } catch (err) {
    console.error('[send-billing-reminder] error:', err)
    return jsonResponse({ error: 'Internal error' }, 500)
  }
})
