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
} from 'https://esm.sh/@react-email/components@0.0.22'
import * as React from 'https://esm.sh/react@18.3.1'

interface WelcomeEmailProps {
  userName: string;
  appUrl: string;
}

export const WelcomeEmail = ({ userName, appUrl }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to JobLine.ai - Your Manufacturing Floor Command Center</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to JobLine.ai! 🏭</Heading>
        
        <Text style={text}>
          Hi {userName || 'there'},
        </Text>
        
        <Text style={text}>
          Thanks for signing up! You're now part of a smarter way to manage shift handoffs 
          and manufacturing floor operations.
        </Text>

        <Section style={featureSection}>
          <Text style={featureTitle}>What you can do with JobLine.ai:</Text>
          <Text style={featureItem}>✅ Submit detailed shift handoff reports</Text>
          <Text style={featureItem}>✅ Track machine status in real-time</Text>
          <Text style={featureItem}>✅ Collaborate with your team seamlessly</Text>
          <Text style={featureItem}>✅ Suggest process improvements</Text>
        </Section>

        <Section style={buttonSection}>
          <Button style={button} href={`${appUrl}/setup`}>
            Get Started with Setup
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={footerText}>
          Need help? Check out our setup wizard or reach out to your team admin.
        </Text>
        
        <Text style={footer}>
          JobLine.ai - Streamlining Manufacturing Operations
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

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

const featureSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const featureTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px',
}

const featureItem = {
  color: '#4a4a4a',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '4px 0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  padding: '12px 32px',
  textDecoration: 'none',
}

const hr = {
  borderColor: '#e6e6e6',
  margin: '24px 0',
}

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
}

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '24px 0 0',
}
