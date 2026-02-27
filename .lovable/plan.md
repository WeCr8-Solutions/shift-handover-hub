

## Email System Assessment & Plan

### Current State

1. **Auth emails (welcome, password reset)**: The app has a custom `send-email` edge function using Resend directly, but there's **no dedicated `/reset-password` page** -- the password reset `redirectTo` goes to `/auth?reset=true` which doesn't call `supabase.auth.updateUser({ password })`. Users get redirected but can't actually set a new password.

2. **Custom domain**: `www.jobline.ai` is configured as a custom domain, but **no email domain is set up** -- all auth emails currently go through default Lovable/Supabase emails.

3. **SaaS transactional emails** (team invites, handoff notifications, promo codes): Already implemented via the `send-email` edge function with Resend, rate limiting, and authorization checks. These are working.

4. **Marketing emails**: Lovable's email system only supports auth emails. Marketing/newsletter emails require a third-party service integration (e.g., Resend, Mailchimp) outside of the managed auth email flow.

### Plan

#### 1. Set up custom email domain
- Configure `jobline.ai` (or a subdomain like `notify.jobline.ai`) as the email sender domain so auth emails come from your brand instead of a generic address
- This requires completing the email setup dialog and DNS verification

#### 2. Scaffold branded auth email templates
- Use Lovable's managed auth email system to create professional templates for: signup confirmation, password recovery, magic link, invite, email change, reauthentication
- Brand them with JobLine's teal primary color (`hsl(185, 70%, 45%)`), Inter/JetBrains Mono fonts, and logo
- Deploy the `auth-email-hook` edge function

#### 3. Fix password reset flow (critical bug)
- Create a `/reset-password` route and page that:
  - Detects `type=recovery` in the URL hash
  - Shows a "set new password" form
  - Calls `supabase.auth.updateUser({ password })` to complete the reset
- Update the `redirectTo` in `Auth.tsx` from `/auth?reset=true` to `/reset-password`
- Without this, password reset emails are non-functional -- users click the link but can never set a new password

#### 4. Marketing emails (limitation)
- Lovable's managed email system is strictly for authentication emails
- For marketing, newsletters, or promotional campaigns, you would need to integrate a dedicated email marketing service (e.g., Resend campaigns, Mailchimp, ConvertKit) directly in your application code
- The existing `send-email` edge function with Resend already handles some transactional use cases (promo codes, team invites, handoff notifications) and can be extended for additional non-auth transactional needs

### First Step
Before I can scaffold the branded auth templates, you need to configure the email sender domain. Let's start there:

<lov-actions>
<lov-open-email-setup>Set up email domain</lov-open-email-setup>
</lov-actions>

Once the domain is set, I'll scaffold the templates, fix the password reset flow, and deploy everything.

