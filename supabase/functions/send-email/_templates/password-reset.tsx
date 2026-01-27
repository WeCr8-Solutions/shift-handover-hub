import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
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
  <Html>
    <Head />
    <Preview>Reset your JobLine.ai password</Preview>
    <Body style={main}>
      <Container style={container}>
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
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  maxWidth: '560px',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const text = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  padding: '12px 32px',
  textDecoration: 'none',
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
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '12px 0',
}

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '24px 0 0',
}
