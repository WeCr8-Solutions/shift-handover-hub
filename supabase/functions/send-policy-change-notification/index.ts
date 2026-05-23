// Send Terms / Privacy / Cookies / Billing policy-change notification to all users.
// Admin-only (platform admin or developer). Uses Resend, dedupes via
// policy_change_email_log unique (announcement_id, user_id).
import React from 'https://esm.sh/react@18.3.1'
import { Resend } from 'https://esm.sh/resend@4.0.0'
import { render } from 'https://esm.sh/@react-email/render@0.0.17?deps=react@18.3.1,react-dom@18.3.1'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { PolicyChangeEmail } from './_template.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APP_URL = Deno.env.get('APP_URL') || 'https://jobline.ai'

const POLICY_LABEL: Record<string, string> = {
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
  cookies: 'Cookie Policy',
  billing: 'Billing & Payment Terms',
  combined: 'Service Agreements',
}

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

interface Body {
  announcementId: string
  testOnly?: boolean // if true, only send to caller
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401)

    const admin = adminClient()

    // Verify caller is platform admin / developer
    const { data: roles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
    const allowed = (roles ?? []).some((r) => r.role === 'admin' || r.role === 'developer')
    if (!allowed) return json({ error: 'Forbidden' }, 403)

    const body = await req.json() as Body
    if (!body?.announcementId) return json({ error: 'announcementId required' }, 400)

    const { data: ann, error: annErr } = await admin
      .from('policy_change_announcements')
      .select('*')
      .eq('id', body.announcementId)
      .maybeSingle()
    if (annErr || !ann) return json({ error: 'Announcement not found' }, 404)

    // Compose recipients
    let recipients: Array<{ user_id: string; email: string; name?: string | null }> = []

    if (body.testOnly) {
      recipients = [{ user_id: user.id, email: user.email!, name: user.user_metadata?.full_name ?? null }]
    } else {
      // Mark announcement as sending
      await admin.from('policy_change_announcements')
        .update({ status: 'sending' })
        .eq('id', ann.id)

      // Pull all confirmed users with an email
      const { data: usersList, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
      if (listErr) {
        await admin.from('policy_change_announcements').update({ status: 'draft' }).eq('id', ann.id)
        return json({ error: 'Failed to list users' }, 500)
      }
      // Handle pagination beyond 1000 users
      const allUsers = [...(usersList?.users ?? [])]
      let page = 2
      while (usersList && allUsers.length === (page - 1) * 1000) {
        const { data: more } = await admin.auth.admin.listUsers({ perPage: 1000, page })
        if (!more?.users?.length) break
        allUsers.push(...more.users)
        if (more.users.length < 1000) break
        page++
      }
      recipients = allUsers
        .filter((u) => u.email && u.email_confirmed_at)
        .map((u) => ({
          user_id: u.id,
          email: u.email!,
          name: (u.user_metadata?.full_name as string | undefined) ?? null,
        }))
    }

    const policyLabel = POLICY_LABEL[ann.policy_type] ?? 'Policy'
    const subject = `Important update to our ${policyLabel} — effective ${ann.effective_date}`
    const highlights = Array.isArray(ann.change_highlights)
      ? (ann.change_highlights as string[])
      : []

    let sent = 0
    let failed = 0
    let skipped = 0

    for (const r of recipients) {
      // Skip duplicates via unique constraint (only for non-test)
      if (!body.testOnly) {
        const { error: insertErr } = await admin
          .from('policy_change_email_log')
          .insert({
            announcement_id: ann.id,
            user_id: r.user_id,
            recipient_email: r.email,
            status: 'pending',
          })
        if (insertErr) {
          // Duplicate → already sent to this user for this announcement
          skipped++
          continue
        }
      }

      const html = render(
        React.createElement(PolicyChangeEmail, {
          recipientName: r.name ?? 'there',
          policyLabel,
          versionLabel: ann.version_label,
          effectiveDate: ann.effective_date,
          title: ann.title,
          summary: ann.summary,
          highlights,
          fullPolicyUrl: ann.full_policy_url ?? `${APP_URL}/terms`,
          manageAccountUrl: `${APP_URL}/account`,
        }),
      )

      try {
        const { error } = await resend.emails.send({
          from: 'JobLine.ai <noreply@jobline.ai>',
          to: [r.email],
          subject,
          html,
        })
        if (error) throw error
        sent++
        if (!body.testOnly) {
          await admin
            .from('policy_change_email_log')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('announcement_id', ann.id)
            .eq('user_id', r.user_id)
        }
      } catch (e) {
        failed++
        const msg = (e instanceof Error ? e.message : String(e)).slice(0, 500)
        if (!body.testOnly) {
          await admin
            .from('policy_change_email_log')
            .update({ status: 'failed', error: msg })
            .eq('announcement_id', ann.id)
            .eq('user_id', r.user_id)
        }
        console.error('policy-change send error', r.email, msg)
      }
    }

    if (!body.testOnly) {
      await admin.from('policy_change_announcements')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          recipient_count: recipients.length,
          sent_count: sent,
          failed_count: failed,
        })
        .eq('id', ann.id)
    }

    return json({ success: true, recipients: recipients.length, sent, failed, skipped })
  } catch (e) {
    console.error('send-policy-change-notification error', e)
    return json({ error: 'Failed to send policy change notification' }, 500)
  }
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}
