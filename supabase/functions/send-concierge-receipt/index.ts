// Concierge receipt email — sent after payment is recorded.
// Uses Resend directly. Authenticated: caller must be a platform admin OR the
// engagement's assigned admin/sales rep. Idempotency is enforced by checking
// `email_delivery_events` for a prior `concierge_receipt:<engagementId>` send.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { Resend } from 'https://esm.sh/resend@4.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface Body {
  engagementId: string
  to?: string // override; defaults to the org owner email
}

function admin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

function userClient(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
}

function buildHtml(opts: {
  invoiceNumber: string
  orgName: string
  amount: string
  method: string
  receivedAt: string
  invoiceUrl: string
}) {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#0f172a;max-width:560px;margin:24px auto;padding:16px">
    <h1 style="font-size:22px;margin:0 0 8px">Payment received — thank you</h1>
    <p style="color:#475569">Your concierge onboarding payment has been recorded. The JobLine.ai team will begin configuring your shop and reach out within one business day.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
      <tr><td style="padding:6px 0;color:#64748b">Invoice</td><td style="padding:6px 0;text-align:right;font-weight:600">${opts.invoiceNumber}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Customer</td><td style="padding:6px 0;text-align:right">${opts.orgName}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Amount</td><td style="padding:6px 0;text-align:right;font-weight:600">$${opts.amount} USD</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Method</td><td style="padding:6px 0;text-align:right">${opts.method}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Received</td><td style="padding:6px 0;text-align:right">${opts.receivedAt}</td></tr>
    </table>
    <p><a href="${opts.invoiceUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">View / print invoice</a></p>
    <p style="font-size:12px;color:#94a3b8;margin-top:24px">Questions? Reply to this email or write billing@jobline.ai.</p>
  </body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { engagementId, to } = (await req.json()) as Body
    if (!engagementId || typeof engagementId !== 'string') {
      return new Response(JSON.stringify({ error: 'engagementId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const ua = userClient(authHeader)
    const { data: { user } } = await ua.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthenticated' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const a = admin()
    // Authorization: platform admin OR assigned admin OR sales rep on engagement
    const { data: isAdmin } = await a.rpc('has_role', { _user_id: user.id, _role: 'admin' })
    const { data: eng } = await a
      .from('onboarding_engagements')
      .select('id, organization_id, plan_tier, payment_status, payment_method, payment_amount_cents, payment_received_at, invoice_number, assigned_admin_id, sales_rep_id, organizations:organization_id(name)')
      .eq('id', engagementId)
      .maybeSingle()
    if (!eng) {
      return new Response(JSON.stringify({ error: 'Engagement not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const authorized =
      Boolean(isAdmin) ||
      eng.assigned_admin_id === user.id ||
      eng.sales_rep_id === user.id
    if (!authorized) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!['paid', 'waived'].includes(String(eng.payment_status))) {
      return new Response(JSON.stringify({ error: 'Engagement not paid' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Resolve recipient: explicit `to` wins, else the first org owner/admin's profile email.
    let recipient = to?.trim() ?? ''
    if (!recipient) {
      const { data: ownerMember } = await a
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', eng.organization_id)
        .in('role', ['owner', 'admin'])
        .order('role', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (ownerMember?.user_id) {
        const { data: prof } = await a
          .from('profiles')
          .select('email')
          .eq('user_id', ownerMember.user_id)
          .maybeSingle()
        recipient = prof?.email ?? ''
      }
    }
    if (!recipient) {
      return new Response(JSON.stringify({ error: 'No recipient email' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Idempotency: skip if already sent for this engagement
    const idemKey = `concierge_receipt:${engagementId}`
    const { data: prior } = await a
      .from('email_delivery_events')
      .select('id')
      .eq('message_id', idemKey)
      .eq('status', 'sent')
      .maybeSingle()
    if (prior) {
      return new Response(JSON.stringify({ ok: true, skipped: 'already_sent' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const html = buildHtml({
      invoiceNumber: eng.invoice_number ?? engagementId.slice(0, 8),
      orgName: (eng.organizations as any)?.name ?? 'Your shop',
      amount: ((eng.payment_amount_cents ?? 0) / 100).toFixed(2),
      method: String(eng.payment_method ?? '—'),
      receivedAt: eng.payment_received_at ? new Date(eng.payment_received_at).toLocaleDateString() : '—',
      invoiceUrl: `https://jobline.ai/billing/concierge/invoice/${engagementId}`,
    })

    const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
    const result = await resend.emails.send({
      from: 'JobLine.ai Billing <noreply@jobline.ai>',
      to: [recipient],
      subject: `Payment received — ${eng.invoice_number ?? 'Concierge Onboarding'}`,
      html,
    })

    await a.from('email_delivery_events').insert({
      message_id: idemKey,
      recipient_email: recipient,
      category: 'concierge_receipt',
      provider: 'resend',
      provider_event_id: (result as any)?.data?.id ?? null,
      status: 'sent',
    } as any)

    return new Response(JSON.stringify({ ok: true, id: (result as any)?.data?.id ?? null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
