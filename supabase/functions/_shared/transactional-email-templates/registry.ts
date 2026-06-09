/// <reference types="npm:@types/react@18.3.1" />
import type * as React from 'npm:react@18.3.1'

import { template as claimAccount } from './claim-account.tsx'
import { template as testEmail } from './test-email.tsx'
import { template as welcome } from './welcome.tsx'
import { template as passwordReset } from './password-reset.tsx'
import { template as teamInvite } from './team-invite.tsx'
import { template as promoCode } from './promo-code.tsx'
import { template as handoffNotification } from './handoff-notification.tsx'
import { template as conciergeGoLive } from './concierge-go-live.tsx'
import { template as conciergeFinalizedPack } from './concierge-finalized-pack.tsx'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'claim-account': claimAccount,
  'test-email': testEmail,
  welcome,
  'password-reset': passwordReset,
  'team-invite': teamInvite,
  'promo-code': promoCode,
  'handoff-notification': handoffNotification,
  'concierge-go-live': conciergeGoLive,
  'concierge-finalized-pack': conciergeFinalizedPack,
}
