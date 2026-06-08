/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { main, container, brandBar, h1, text, muted, card, codeBox, buttonSection, button, hr, footer } from './_shared-styles.ts'

interface Props {
  recipientName?: string; senderName?: string; promoCode?: string
  discountAmount?: string; expiryDate?: string; signupUrl?: string
}

const Email = ({
  recipientName = 'there', senderName = 'A friend', promoCode = '',
  discountAmount = '', expiryDate = '', signupUrl = 'https://jobline.ai/auth',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{senderName} shared a Jobline.ai offer with you</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandBar}>Jobline.ai</Text>
        <Heading style={h1}>A gift from {senderName} 🎁</Heading>
        <Text style={text}>Hi {recipientName}, {senderName} shared a Jobline.ai promo with you.</Text>
        <Section style={card}>
          <Text style={{ ...muted, marginBottom: '6px' }}>Promo code · {discountAmount} off</Text>
          <Text style={codeBox}>{promoCode}</Text>
          {expiryDate && <Text style={{ ...muted, margin: 0 }}>Valid through {expiryDate}.</Text>}
        </Section>
        <Section style={buttonSection}>
          <Button style={button} href={signupUrl}>Get started</Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Jobline.ai promotional email.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `${d?.senderName ?? 'A friend'} shared a special offer with you`,
  displayName: 'Promo code',
  previewData: { recipientName: 'Sam', senderName: 'Brandon', promoCode: 'WELCOME20', discountAmount: '20%', expiryDate: 'Dec 31, 2026', signupUrl: 'https://jobline.ai/auth' },
} satisfies TemplateEntry
