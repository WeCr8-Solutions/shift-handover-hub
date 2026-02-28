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
} from 'https://esm.sh/@react-email/components@0.0.22?deps=react@18.3.1,react-dom@18.3.1'
import * as React from 'https://esm.sh/react@18.3.1'

interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  expiryMinutes: number;
}

export const PasswordResetEmail = ({ 
  userName, 
  resetUrl, 
  expiryMinutes = 60 
}: PasswordResetEmailProps) => (
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
        <Heading style={h1}>Password Reset Request 🔐</Heading>
        
        <Text style={text}>
          Hi {userName || 'there'},
        </Text>
        
        <Text style={text}>
          We received a request to reset your password for your JobLine.ai account. 
          Click the button below to create a new password.
        </Text>

        <Section style={buttonSection}>
          <Button style={button} href={resetUrl}>
            Reset Password
          </Button>
        </Section>

        <Text style={warningText}>
          ⏰ This link will expire in {expiryMinutes} minutes for security reasons.
        </Text>

        <Hr style={hr} />

        <Text style={securityNote}>
          <strong>Didn't request this?</strong>
          <br />
          If you didn't request a password reset, you can safely ignore this email. 
          Your password will remain unchanged.
        </Text>

        <Text style={securityNote}>
          For security, never share this link with anyone.
        </Text>
        
        <Text style={footer}>
          JobLine.ai - Streamlining Manufacturing Operations
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
}

const container = {
  padding: '40px 25px',
  maxWidth: '560px',
  margin: '0 auto',
}

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

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

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

const warningText = {
  color: '#f59e0b',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '16px 0',
}

const hr = {
  borderColor: '#e6e6e6',
  margin: '24px 0',
}

const securityNote = {
  fontSize: '13px',
  color: '#6b7280',
  lineHeight: '1.5',
  margin: '12px 0',
}

const footer = {
  fontSize: '12px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  margin: '24px 0 0',
}
