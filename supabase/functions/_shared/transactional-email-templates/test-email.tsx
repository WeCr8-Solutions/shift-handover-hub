/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { main, container, brandBar, h1, text, hr, footer } from './_shared-styles.ts'

interface Props { note?: string; sentAt?: string }

const Email = ({ note = 'This is a Jobline.ai email pipeline smoke test.', sentAt = new Date().toISOString() }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Jobline.ai email pipeline smoke test</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandBar}>Jobline.ai</Text>
        <Heading style={h1}>✅ Email pipeline working</Heading>
        <Text style={text}>{note}</Text>
        <Text style={text}>Sent at: {sentAt}</Text>
        <Hr style={hr} />
        <Text style={footer}>Sent from notify.jobline.ai via Lovable Emails.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Jobline.ai email test',
  displayName: 'Pipeline smoke test',
  previewData: { note: 'Hello!', sentAt: new Date().toISOString() },
} satisfies TemplateEntry
