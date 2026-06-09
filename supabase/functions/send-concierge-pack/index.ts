import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

/**
 * send-concierge-pack
 *
 * Emails the sealed concierge pack (master snapshot + latest document records)
 * to the engagement billing contact. Refuses if not finalized. Auth-gated to
 * platform admins / developers / assigned rep.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsRes, error: claimsErr } = await supabase.auth.getClaims(token)
    if (claimsErr || !claimsRes?.claims?.sub) {
      return json({ error: 'Unauthorized' }, 401)
    }
    const uid = claimsRes.claims.sub as string

    const body = await req.json().catch(() => ({}))
    const engagementId: string | undefined = body?.engagementId
    const toOverride: string | undefined = body?.toOverride
    if (!engagementId) return json({ error: 'engagementId required' }, 400)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Authorization: platform_admin/developer OR assigned rep on engagement
    const { data: rolesRows } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', uid)
    const roles = new Set((rolesRows ?? []).map((r: any) => r.role))
    const isStaff = roles.has('platform_admin') || roles.has('developer')

    const { data: engagement, error: engErr } = await admin
      .from('onboarding_engagements')
      .select('id, customer_billing_email, customer_name, plan_tier, assigned_rep_id, organizations:organization_id(id,name), notes')
      .eq('id', engagementId)
      .maybeSingle()
    if (engErr || !engagement) return json({ error: 'Engagement not found' }, 404)

    if (!isStaff && (engagement as any).assigned_rep_id !== uid) {
      return json({ error: 'Forbidden' }, 403)
    }

    // Load finalization
    const { data: finalRow } = await admin
      .from('concierge_pack_finalizations')
      .select('*')
      .eq('engagement_id', engagementId)
      .maybeSingle()
    if (!finalRow || (finalRow as any).status !== 'finalized') {
      return json({ error: 'Pack must be finalized before sending.' }, 400)
    }

    // Load latest document records (one per document_key)
    const { data: records } = await admin
      .from('concierge_document_records')
      .select('document_key, version, format, storage_bucket, storage_path, is_master, created_at')
      .eq('engagement_id', engagementId)
      .order('version', { ascending: false })

    const latest = new Map<string, any>()
    for (const r of records ?? []) {
      if (!latest.has((r as any).document_key)) latest.set((r as any).document_key, r)
    }

    const documents: { title: string; url: string; expiresAt: string }[] = []
    for (const r of latest.values()) {
      const { data: signed } = await admin.storage.from(r.storage_bucket).createSignedUrl(r.storage_path, 60 * 60 * 24 * 7)
      if (signed?.signedUrl) {
        documents.push({
          title: `${r.document_key} (v${r.version}${r.is_master ? ' · master' : ''})`,
          url: signed.signedUrl,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }
    }

    const recipient = toOverride || (engagement as any).customer_billing_email
    if (!recipient) return json({ error: 'No billing email on engagement' }, 400)

    const orgName = (engagement as any).organizations?.name ?? (engagement as any).customer_name ?? 'your shop'
    const snapshot = (finalRow as any).snapshot ?? {}

    const sendRes = await admin.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'concierge-finalized-pack',
        recipientEmail: recipient,
        idempotencyKey: `concierge-pack-${engagementId}-${(finalRow as any).pack_hash?.slice(0, 12)}`,
        templateData: {
          orgName,
          signerName: snapshot.salesRepName || snapshot.jobLineRepName || 'there',
          tier: (engagement as any).plan_tier ?? 'standard',
          sealedAt: (finalRow as any).finalized_at,
          packHash: (finalRow as any).pack_hash,
          documents,
          dashboardUrl: 'https://app.jobline.ai',
        },
      },
    })

    if (sendRes.error) {
      return json({ error: sendRes.error.message ?? 'Send failed' }, 502)
    }

    // Audit
    const auditLine = `[${new Date().toISOString()}] Sealed pack emailed to ${recipient} by ${uid}`
    const prevNotes = (engagement as any).notes ?? ''
    await admin
      .from('onboarding_engagements')
      .update({ notes: prevNotes ? `${prevNotes}\n${auditLine}` : auditLine })
      .eq('id', engagementId)

    return json({ ok: true, recipient, documents: documents.length })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
