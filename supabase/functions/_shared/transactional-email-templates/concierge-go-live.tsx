/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Button, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { main, container, brandBar, h1, text, muted, card, buttonSection, button, hr, footer } from './_shared-styles.ts'

interface Props {
  name?: string
  orgName?: string
  tier?: string
  wentLiveAt?: string
  dashboardUrl?: string
}

const Email = ({
  name = 'there',
  orgName = 'your shop',
  tier = 'standard',
  wentLiveAt,
  dashboardUrl = 'https://app.jobline.ai',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{orgName} is live on Jobline.ai</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandBar}>Jobline.ai · Concierge</Text>
        <Heading style={h1}>You're live, {orgName}.</Heading>

        <Text style={text}>
          Hi {name}, your concierge engagement is complete and{' '}
          <strong>{orgName}</strong> has been released to production on the{' '}
          <strong>{tier}</strong> tier{wentLiveAt ? ` as of ${new Date(wentLiveAt).toLocaleString()}` : ''}.
        </Text>

        <Section style={card}>
          <Text style={{ ...muted, marginBottom: '6px' }}>What changes today</Text>
          <Text style={text}>
            • Your shop floor is open for real production traffic.<br />
            • Operators can sign in, start shifts, and run handoffs.<br />
            • Admin & supervisor dashboards are unlocked.<br />
            • Concierge support stays with you for 30 days post-launch.
          </Text>
        </Section>

        <Section style={buttonSection}>
          <Button style={button} href={dashboardUrl}>Open your dashboard</Button>
        </Section>

        <Text style={muted}>
          Need anything? Reply to this email and your concierge team will respond
          the same business day. Or visit{' '}
          <Link href={dashboardUrl} style={{ color: '#0f172a' }}>{dashboardUrl}</Link>.
        </Text>

        <Hr style={hr} />
        <Text style={footer}>
          You received this because you are an admin of {orgName} on Jobline.ai.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `${d?.orgName ?? 'Your shop'} is live on Jobline.ai`,
  displayName: 'Concierge — You are live',
  previewData: {
    name: 'Brandon',
    orgName: 'Aymar Engineering',
    tier: 'standard',
    wentLiveAt: new Date().toISOString(),
    dashboardUrl: 'https://app.jobline.ai',
  },
} satisfies TemplateEntry
