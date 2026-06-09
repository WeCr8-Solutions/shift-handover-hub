/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Button, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { main, container, brandBar, h1, text, muted, card, codeBox, buttonSection, button, hr, footer } from './_shared-styles.ts'

interface Props {
  recipientName?: string
  organizationName?: string
  inviteCode?: string
  inviteUrl?: string
  activationUrl?: string
  backupClaimUrl?: string
  role?: string
  inviterName?: string
}

const Email = ({
  recipientName,
  organizationName = 'your shop',
  inviteCode = '',
  inviteUrl = 'https://app.jobline.ai/auth',
  activationUrl = '',
  backupClaimUrl = 'https://app.jobline.ai/claim/account-owner',
  role = 'team member',
  inviterName = 'Your Jobline.ai concierge team',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Claim your Jobline.ai account for {organizationName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandBar}>Jobline.ai</Text>

        <Heading style={h1}>Claim your account</Heading>

        <Text style={text}>
          {recipientName ? `Hi ${recipientName},` : 'Hi,'}{' '}
          {inviterName} set up <strong>{organizationName}</strong> on Jobline.ai
          and reserved a seat for you as <strong>{role}</strong>.
        </Text>

        <Text style={text}>
          Click the button below to create your password and join the shop.
        </Text>

        <Section style={card}>
          <Text style={{ ...muted, marginBottom: '6px' }}>Your invite code</Text>
          <Text style={codeBox}>{inviteCode}</Text>
          <Text style={{ ...muted, margin: 0 }}>
            Single-use. Expires in 15 days.
          </Text>
        </Section>

        <Section style={buttonSection}>
          <Button style={button} href={inviteUrl}>Claim my account</Button>
        </Section>

        <Text style={muted}>
          Button not working? Open{' '}
          <Link href={inviteUrl} style={{ color: '#0f172a' }}>{inviteUrl}</Link>{' '}
          and paste the code above.
        </Text>

        {activationUrl ? (
          <>
            <Hr style={hr} />
            <Heading as="h3" style={{ ...h1, fontSize: '16px', marginTop: '20px' }}>
              Backup option (if the link/QR doesn't work)
            </Heading>
            <Text style={text}>
              Paste this full URL into your browser — it's good for 24 hours and only works once:
            </Text>
            <Section style={card}>
              <Text style={{ ...codeBox, fontSize: '11px', wordBreak: 'break-all' }}>{activationUrl}</Text>
            </Section>
            <Text style={muted}>
              Or visit{' '}
              <Link href={backupClaimUrl} style={{ color: '#0f172a' }}>{backupClaimUrl}</Link>{' '}
              and paste the URL above along with this email address. You'll be asked to set
              your password before you can sign anything or invite anyone else.
            </Text>
          </>
        ) : null}

        <Hr style={hr} />
        <Text style={footer}>
          You received this because {inviterName} added you to {organizationName} on Jobline.ai.
          If this wasn't expected, you can safely ignore this email — the invite expires automatically.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Claim your Jobline.ai account for ${d?.organizationName ?? 'your shop'}`,
  displayName: 'Claim your account',
  previewData: {
    recipientName: 'Brandon',
    organizationName: 'Aymar Engineering',
    inviteCode: 'AYMAR-OWNER-BA01',
    inviteUrl: 'https://app.jobline.ai/auth?invite=AYMAR-OWNER-BA01',
    activationUrl: 'https://app.jobline.ai/activate?token=demo-token',
    backupClaimUrl: 'https://app.jobline.ai/claim/account-owner',
    role: 'Org Admin',
    inviterName: 'Zach @ Jobline.ai concierge',
  },
} satisfies TemplateEntry
