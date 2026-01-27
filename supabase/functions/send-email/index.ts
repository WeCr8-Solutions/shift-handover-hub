import React from 'https://esm.sh/react@18.3.1'
import { Resend } from 'https://esm.sh/resend@4.0.0'
import { renderAsync } from 'https://esm.sh/@react-email/render@0.0.17'
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

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // emails per window
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_WINDOW_MS })
    return true
  }
  
  if (userLimit.count >= RATE_LIMIT) {
    return false
  }
  
  userLimit.count++
  return true
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

    // Rate limiting check
    if (!checkRateLimit(userId)) {
      console.warn(`Rate limit exceeded for user: ${userId}`)
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const { type, to, data }: EmailRequest = await req.json()

    if (!type || !to) {
      throw new Error('Missing required fields: type and to')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      throw new Error('Invalid recipient email address')
    }

    console.log(`Sending ${type} email to ${to} (requested by ${userEmail})`)

    let subject: string
    let html: string

    const appUrl = Deno.env.get('APP_URL') || 'https://jobline.ai'

    switch (type) {
      case 'welcome': {
        subject = 'Welcome to JobLine.ai! 🏭'
        html = await renderAsync(
          React.createElement(WelcomeEmail, {
            userName: data.userName as string,
            appUrl,
          })
        )
        break
      }

      case 'password-reset': {
        subject = 'Reset your JobLine.ai password'
        html = await renderAsync(
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
        html = await renderAsync(
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
        html = await renderAsync(
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
        html = await renderAsync(
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
      from: 'JobLine.ai <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log('Email sent successfully:', emailData, `by user: ${userId}`)

    return new Response(
      JSON.stringify({ success: true, id: emailData?.id }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    )
  } catch (error: unknown) {
    console.error('Error sending email:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    )
  }
})
