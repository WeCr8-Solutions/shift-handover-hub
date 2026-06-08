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
  role?: string
  inviterName?: string
}

const Email = ({
  recipientName,
  organizationName = 'your shop',
  inviteCode = '',
  inviteUrl = 'https://jobline.ai/auth',
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
          You can also enter the invite code manually on the sign-in page.
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
    inviteUrl: 'https://jobline.ai/auth?invite=AYMAR-OWNER-BA01',
    role: 'Org Admin',
    inviterName: 'Zach @ Jobline.ai concierge',
  },
} satisfies TemplateEntry
