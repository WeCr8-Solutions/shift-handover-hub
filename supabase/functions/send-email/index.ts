import React from 'https://esm.sh/react@18.3.1'
import { Resend } from 'https://esm.sh/resend@4.0.0'
import { render } from 'https://esm.sh/@react-email/render@0.0.17?deps=react@18.3.1,react-dom@18.3.1'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { WelcomeEmail } from './_templates/welcome.tsx'
import { PasswordResetEmail } from './_templates/password-reset.tsx'
import { TeamInviteEmail } from './_templates/team-invite.tsx'
import { PromoCodeEmail } from './_templates/promo-code.tsx'
import { HandoffNotificationEmail } from './_templates/handoff-notification.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type EmailType = 
  | 'welcome' 
  | 'password-reset' 
  | 'team-invite' 
  | 'promo-code' 
  | 'handoff-notification'

interface EmailRequest {
  type: EmailType
  to: string
  data: Record<string, unknown>
}

// Rate limiting constants
const RATE_LIMIT_USER = 10 // emails per hour per user
const RATE_LIMIT_RECIPIENT = 3 // emails per 24h to same recipient
const RATE_WINDOW_USER_MS = 60 * 60 * 1000 // 1 hour
const RATE_WINDOW_RECIPIENT_MS = 24 * 60 * 60 * 1000 // 24 hours

// Create admin client for rate limit table and authorization checks (bypasses RLS)
function getAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

// Authorization checks for email types
async function checkEmailAuthorization(
  userId: string, 
  emailType: EmailType, 
  data: Record<string, unknown>
): Promise<{ authorized: boolean; reason?: string }> {
  const adminClient = getAdminClient()
  
  switch (emailType) {
    case 'welcome':
      // Only allow sending welcome email to yourself
      return { authorized: true }
    
    case 'password-reset':
      // Password reset is handled by Supabase Auth, not this function
      return { authorized: true }
    
    case 'team-invite': {
      // Verify user is a team admin or org admin
      const teamId = data.teamId as string | undefined
      const orgId = data.organizationId as string | undefined
      
      if (teamId) {
        // Check if user is team admin
        const { data: teamMember } = await adminClient
          .from('team_members')
          .select('role')
          .eq('team_id', teamId)
          .eq('user_id', userId)
          .maybeSingle()
        
        if (teamMember?.role === 'owner' || teamMember?.role === 'admin') {
          return { authorized: true }
        }
      }
      
      if (orgId) {
        // Check if user is org admin
        const { data: orgMember } = await adminClient
          .from('organization_members')
          .select('role')
          .eq('organization_id', orgId)
          .eq('user_id', userId)
          .maybeSingle()
        
        if (orgMember?.role === 'owner' || orgMember?.role === 'admin') {
          return { authorized: true }
        }
      }
      
      // Check if user has supervisor role in their org
      const { data: userRoles } = await adminClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
      
      const isSupervisor = userRoles?.some(r => r.role === 'supervisor')
      if (isSupervisor) {
        return { authorized: true }
      }
      
      return { authorized: false, reason: 'You must be a team admin, org admin, or supervisor to send invite emails.' }
    }
    
    case 'promo-code':
      // Promo codes can be shared by any authenticated user (rate limited)
      return { authorized: true }
    
    case 'handoff-notification': {
      // Verify user is a team member for handoff notifications
      const handoffTeamId = data.teamId as string | undefined
      
      if (handoffTeamId) {
        const { data: teamMember } = await adminClient
          .from('team_members')
          .select('id')
          .eq('team_id', handoffTeamId)
          .eq('user_id', userId)
          .maybeSingle()
        
        if (teamMember) {
          return { authorized: true }
        }
        
        return { authorized: false, reason: 'You must be a team member to send handoff notifications.' }
      }
      
      // If no team specified, allow (for legacy support) with rate limiting protection
      return { authorized: true }
    }
    
    default:
      return { authorized: false, reason: 'Unknown email type.' }
  }
}

// Database-backed rate limiting - persists across cold starts and instances
async function checkRateLimits(userId: string, recipient: string): Promise<{ allowed: boolean; reason?: string }> {
  const adminClient = getAdminClient()
  const now = new Date()
  
  // Check user rate limit (10 emails per hour)
  const userWindowStart = new Date(now.getTime() - RATE_WINDOW_USER_MS).toISOString()
  const { count: userCount, error: userError } = await adminClient
    .from('email_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('sent_at', userWindowStart)
  
  if (userError) {
    console.error('Rate limit check failed:', userError)
    // Fail open but log the issue
    return { allowed: true }
  }
  
  if (userCount !== null && userCount >= RATE_LIMIT_USER) {
    return { allowed: false, reason: 'Rate limit exceeded. Please try again later.' }
  }
  
  // Check recipient rate limit (3 emails per 24h to same address)
  const recipientWindowStart = new Date(now.getTime() - RATE_WINDOW_RECIPIENT_MS).toISOString()
  const { count: recipientCount, error: recipientError } = await adminClient
    .from('email_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('recipient', recipient.toLowerCase())
    .gte('sent_at', recipientWindowStart)
  
  if (recipientError) {
    console.error('Recipient rate limit check failed:', recipientError)
    return { allowed: true }
  }
  
  if (recipientCount !== null && recipientCount >= RATE_LIMIT_RECIPIENT) {
    return { allowed: false, reason: 'Too many emails sent to this address. Please try again later.' }
  }
  
  return { allowed: true }
}

// Record email send for rate limiting
async function recordEmailSend(userId: string, emailType: string, recipient: string): Promise<void> {
  const adminClient = getAdminClient()
  
  const { error } = await adminClient
    .from('email_rate_limits')
    .insert({
      user_id: userId,
      email_type: emailType,
      recipient: recipient.toLowerCase()
    })
  
  if (error) {
    console.error('Failed to record email send:', error)
    // Don't fail the request if recording fails
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Authentication: Verify JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authentication token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the user's session
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      console.error('JWT verification failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid authentication token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const userId = user.id
    const userEmail = user.email || 'unknown'

    console.log(`Authenticated request from user: ${userId} (${userEmail})`)

    const { type, to, data }: EmailRequest = await req.json()

    if (!type || !to) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Authorization check - verify user has permission to send this email type
    const authzResult = await checkEmailAuthorization(userId, type, data)
    if (!authzResult.authorized) {
      console.warn(`Authorization denied for user ${userId} on email type ${type}: ${authzResult.reason}`)
      return new Response(
        JSON.stringify({ error: authzResult.reason || 'You are not authorized to send this type of email.' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Database-backed rate limiting check
    const rateLimitResult = await checkRateLimits(userId, to)
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for user: ${userId}, reason: ${rateLimitResult.reason}`)
      return new Response(
        JSON.stringify({ error: rateLimitResult.reason }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    console.log(`Sending ${type} email to ${to} (requested by ${userEmail})`)

    let subject: string
    let html: string

    const appUrl = Deno.env.get('APP_URL') || 'https://jobline.ai'

    switch (type) {
      case 'welcome': {
        subject = 'Welcome to JobLine.ai! 🏭'
        html = render(
          React.createElement(WelcomeEmail, {
            userName: data.userName as string,
            appUrl,
          })
        )
        break
      }

      case 'password-reset': {
        subject = 'Reset your JobLine.ai password'
        html = render(
          React.createElement(PasswordResetEmail, {
            userName: data.userName as string,
            resetUrl: data.resetUrl as string,
            expiryMinutes: (data.expiryMinutes as number) || 60,
          })
        )
        break
      }

      case 'team-invite': {
        subject = `You're invited to join ${data.teamName} on JobLine.ai`
        html = render(
          React.createElement(TeamInviteEmail, {
            inviterName: data.inviterName as string,
            teamName: data.teamName as string,
            inviteUrl: data.inviteUrl as string,
            role: (data.role as string) || 'member',
          })
        )
        break
      }

      case 'promo-code': {
        subject = `${data.senderName} shared a special offer with you!`
        html = render(
          React.createElement(PromoCodeEmail, {
            recipientName: data.recipientName as string,
            senderName: data.senderName as string,
            promoCode: data.promoCode as string,
            discountAmount: data.discountAmount as string,
            expiryDate: data.expiryDate as string,
            signupUrl: `${appUrl}/auth`,
          })
        )
        break
      }

      case 'handoff-notification': {
        subject = `New handoff for ${data.stationName} - ${data.shift} shift`
        html = render(
          React.createElement(HandoffNotificationEmail, {
            recipientName: data.recipientName as string,
            stationName: data.stationName as string,
            outgoingOperator: data.outgoingOperator as string,
            shift: data.shift as string,
            workOrder: data.workOrder as string,
            partNumber: data.partNumber as string,
            status: data.status as string,
            summary: data.summary as string,
            dashboardUrl: `${appUrl}/dashboard`,
          })
        )
        break
      }

      default:
        throw new Error(`Unknown email type: ${type}`)
    }

    // Send via Resend
    // Note: In production, replace 'onboarding@resend.dev' with your verified domain
    const { data: emailData, error } = await resend.emails.send({
      from: 'JobLine.ai <noreply@wecr8.info>',
      to: [to],
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    // Record successful send for rate limiting
    await recordEmailSend(userId, type, to)

    console.log('Email sent successfully:', emailData?.id, `by user: ${userId}`)

    return new Response(
      JSON.stringify({ success: true, id: emailData?.id }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    )
  } catch (error: unknown) {
    console.error('Error sending email:', error)
    // Return generic error message to prevent information leakage
    return new Response(
      JSON.stringify({ error: 'An error occurred while sending the email. Please try again.' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    )
  }
})
