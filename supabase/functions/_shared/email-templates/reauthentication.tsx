/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your JobLine.ai verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img
            src="https://kgrstnbxqdmadtoankqr.supabase.co/storage/v1/object/public/email-assets/jobline-logo.png"
            width="140"
            height="auto"
            alt="JobLine.ai"
            style={logo}
          />
        </Section>
        <Heading style={h1}>Verification Code</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can
          safely ignore this email.
        </Text>
        <Text style={brand}>JobLine.ai — Streamlining Manufacturing Operations</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
}
const container = { padding: '40px 25px', maxWidth: '560px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { margin: '0 auto' }
const h1 = {
  fontSize: '24px',
  fontWeight: '700' as const,
  color: 'hsl(220, 20%, 10%)',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}
const text = {
  fontSize: '15px',
  color: 'hsl(215, 15%, 55%)',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const codeStyle = {
  fontFamily: "'JetBrains Mono', Courier, monospace",
  fontSize: '28px',
  fontWeight: '700' as const,
  color: 'hsl(185, 70%, 45%)',
  margin: '0 0 30px',
  textAlign: 'center' as const,
  letterSpacing: '4px',
}
const footer = { fontSize: '13px', color: '#9ca3af', margin: '30px 0 0', lineHeight: '1.5' }
const brand = {
  fontSize: '12px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  margin: '24px 0 0',
}
