/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your JobLine.ai password</Preview>
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
        <Heading style={h1}>Reset Your Password 🔐</Heading>
        <Text style={text}>
          We received a request to reset your password for {siteName}. Click
          the button below to choose a new password.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Reset Password
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={securityNote}>
          <strong>Didn't request this?</strong> You can safely ignore this email —
          your password will remain unchanged. Never share this link with anyone.
        </Text>
        <Text style={brand}>JobLine.ai — Streamlining Manufacturing Operations</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
const buttonSection = { textAlign: 'center' as const, margin: '32px 0' }
const button = {
  backgroundColor: 'hsl(185, 70%, 45%)',
  color: 'hsl(220, 20%, 10%)',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '8px',
  padding: '12px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const hr = { borderColor: '#e6e6e6', margin: '24px 0' }
const securityNote = {
  fontSize: '13px',
  color: '#6b7280',
  lineHeight: '1.5',
  margin: '12px 0',
}
const brand = {
  fontSize: '12px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  margin: '24px 0 0',
}
