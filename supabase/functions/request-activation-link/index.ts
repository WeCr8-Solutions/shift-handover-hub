import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

/**
 * request-activation-link
 *
 * Public endpoint (no JWT). Rate-limited to 3 req/hour/email via email_rate_limits.
 * Generates a single-use 24h account activation token and emails a /activate?token=... link.
 * Always returns 200 (privacy) so callers cannot enumerate users.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false }, 405)

  try {
    const { email } = await req.json().catch(() => ({}))
    if (!email || typeof email !== 'string' || !/^.+@.+\..+$/.test(email)) {
      return json({ ok: true })
    }
    const normalized = email.trim().toLowerCase()

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Rate limit (best-effort)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await admin
      .from('email_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('email', normalized)
      .eq('action', 'activation_link')
      .gte('created_at', oneHourAgo)
    if ((count ?? 0) >= 3) {
      return json({ ok: true, throttled: true })
    }

    // Find a still-usable invite for this email to attach (no PII leak in response)
    const { data: invite } = await admin
      .from('organization_invites')
      .select('id, organization_id, max_uses, uses_count, is_active, expires_at')
      .ilike('invited_email', normalized)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Generate token (32 bytes base64url) and hash it
    const tokenBytes = new Uint8Array(32)
    crypto.getRandomValues(tokenBytes)
    const token = base64url(tokenBytes)
    const tokenHash = await sha256Hex(token)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await admin.from('account_activation_tokens').insert({
      email: normalized,
      token_hash: tokenHash,
      organization_id: (invite as any)?.organization_id ?? null,
      invite_id: (invite as any)?.id ?? null,
      expires_at: expiresAt,
    })

    await admin.from('email_rate_limits').insert({ email: normalized, action: 'activation_link' })

    const appUrl = Deno.env.get('PUBLIC_APP_URL') || 'https://app.jobline.ai'
    const activateUrl = `${appUrl}/activate?token=${encodeURIComponent(token)}`

    await admin.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'claim-account',
        recipientEmail: normalized,
        idempotencyKey: `activation-${tokenHash.slice(0, 16)}`,
        templateData: {
          activateUrl,
          claimUrl: activateUrl,
          expiresAt,
        },
      },
    })

    return json({ ok: true })
  } catch (e) {
    console.error('request-activation-link error', e)
    return json({ ok: true })
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function base64url(bytes: Uint8Array) {
  let s = btoa(String.fromCharCode(...bytes))
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
