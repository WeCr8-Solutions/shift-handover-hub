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

interface TeamInviteEmailProps {
  inviterName: string;
  teamName: string;
  inviteUrl: string;
  role: string;
}

export const TeamInviteEmail = ({ 
  inviterName, 
  teamName, 
  inviteUrl,
  role = 'member'
}: TeamInviteEmailProps) => (
  <Html>
    <Head />
    <Preview>You've been invited to join {teamName} on JobLine.ai</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Team Invitation 👋</Heading>
        
        <Text style={text}>
          Great news! <strong>{inviterName}</strong> has invited you to join 
          the <strong>{teamName}</strong> team on JobLine.ai.
        </Text>

        <Section style={roleSection}>
          <Text style={roleLabel}>Your Role:</Text>
          <Text style={roleValue}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
        </Section>

        <Text style={text}>
          As a team member, you'll be able to:
        </Text>

        <Section style={featureSection}>
          <Text style={featureItem}>📋 Submit and view shift handoffs</Text>
          <Text style={featureItem}>🔧 Monitor station status in real-time</Text>
          <Text style={featureItem}>👥 Collaborate with your team</Text>
          <Text style={featureItem}>💡 Suggest process improvements</Text>
        </Section>

        <Section style={buttonSection}>
          <Button style={button} href={inviteUrl}>
            Accept Invitation
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={footerNote}>
          This invitation was sent from JobLine.ai. If you weren't expecting 
          this invitation, you can safely ignore this email.
        </Text>
        
        <Text style={footer}>
          JobLine.ai - Streamlining Manufacturing Operations
        </Text>
      </Container>
    </Body>
  </Html>
)

export default TeamInviteEmail

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

const roleSection = {
  backgroundColor: '#eef2ff',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px 0',
  textAlign: 'center' as const,
}

const roleLabel = {
  color: '#6366f1',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px',
}

const roleValue = {
  color: '#4338ca',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0',
}

const featureSection = {
  margin: '20px 0',
}

const featureItem = {
  color: '#4a4a4a',
  fontSize: '14px',
  lineHeight: '28px',
  margin: '0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#10b981',
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

const footerNote = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '16px 0',
}

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '24px 0 0',
}
