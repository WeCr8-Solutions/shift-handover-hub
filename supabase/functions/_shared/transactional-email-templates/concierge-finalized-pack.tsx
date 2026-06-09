/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Button, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { main, container, brandBar, h1, text, muted, card, buttonSection, button, hr, footer } from './_shared-styles.ts'

interface DocLink { title: string; url: string; expiresAt?: string }

interface Props {
  orgName?: string
  signerName?: string
  tier?: string
  sealedAt?: string
  packHash?: string
  documents?: DocLink[]
  dashboardUrl?: string
}

const Email = ({
  orgName = 'your shop',
  signerName = 'there',
  tier = 'standard',
  sealedAt,
  packHash,
  documents = [],
  dashboardUrl = 'https://app.jobline.ai',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Jobline Concierge package — sealed copy</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandBar}>Jobline.ai · Concierge</Text>
        <Heading style={h1}>Your sealed concierge pack</Heading>

        <Text style={text}>
          Hi {signerName}, the concierge package for <strong>{orgName}</strong> on the{' '}
          <strong>{tier}</strong> tier has been finalized
          {sealedAt ? ` on ${new Date(sealedAt).toLocaleString()}` : ''}. The signed master copy
          and supporting documents are linked below.
        </Text>

        {documents.length > 0 && (
          <Section style={card}>
            <Text style={{ ...muted, marginBottom: '6px' }}>Sealed documents</Text>
            {documents.map((d) => (
              <Text key={d.url} style={text}>
                • <Link href={d.url} style={{ color: '#0f172a' }}>{d.title}</Link>
                {d.expiresAt ? (
                  <span style={{ color: '#94a3b8' }}> (link expires {new Date(d.expiresAt).toLocaleString()})</span>
                ) : null}
              </Text>
            ))}
          </Section>
        )}

        {packHash && (
          <Text style={muted}>
            Tamper-proof seal: sha256 <span style={{ fontFamily: 'monospace' }}>{packHash}</span>
          </Text>
        )}

        <Section style={buttonSection}>
          <Button style={button} href={dashboardUrl}>Open your dashboard</Button>
        </Section>

        <Text style={muted}>
          Need a change? Reply to this email and your concierge team will re-open the pack with a
          recorded reason. Each new edit is captured as a new version; the previous master remains
          immutable for audit.
        </Text>

        <Hr style={hr} />
        <Text style={footer}>
          You received this because you are listed on the {orgName} concierge engagement on Jobline.ai.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `${d?.orgName ?? 'Your shop'} — Jobline concierge pack (sealed)`,
  displayName: 'Concierge — Finalized pack',
  previewData: {
    orgName: 'Aymar Engineering',
    signerName: 'Brandon',
    tier: 'standard',
    sealedAt: new Date().toISOString(),
    packHash: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    documents: [
      { title: 'Master Services Agreement (v2)', url: 'https://example.com/msa.pdf' },
      { title: 'ITAR Declaration', url: 'https://example.com/itar.pdf' },
    ],
    dashboardUrl: 'https://app.jobline.ai',
  },
} satisfies TemplateEntry
