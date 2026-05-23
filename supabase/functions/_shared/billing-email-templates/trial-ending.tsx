import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'https://esm.sh/@react-email/components@0.0.22?deps=react@18.3.1,react-dom@18.3.1'
import * as React from 'https://esm.sh/react@18.3.1'

interface Props {
  name?: string
  daysRemaining: number
  trialEndsAt: string // formatted date
  manageUrl: string
}

export const TrialEndingEmail = ({ name, daysRemaining, trialEndsAt, manageUrl }: Props) => (
  <Html>
    <Head />
    <Preview>Your JobLine.ai free trial ends in {daysRemaining} day{daysRemaining === 1 ? '' : 's'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your trial ends in {daysRemaining} day{daysRemaining === 1 ? '' : 's'}</Heading>
        <Text style={text}>Hi {name || 'there'},</Text>
        <Text style={text}>
          Your JobLine.ai free trial ends on <strong>{trialEndsAt}</strong>. Pick a plan now to keep
          your shop floor running without interruption.
        </Text>
        <Section style={highlightBox}>
          <Text style={highlightTitle}>What happens when the trial ends?</Text>
          <Text style={featureItem}>• Operator and supervisor logins pause</Text>
          <Text style={featureItem}>• Work order queue, handoffs, and analytics become read-only</Text>
          <Text style={featureItem}>• Your data stays safe — choose a plan any time to resume</Text>
        </Section>
        <Section style={buttonSection}>
          <Button style={button} href={manageUrl}>Choose a plan</Button>
        </Section>
        <Hr style={hr} />
        <Text style={footerText}>
          Questions? Reply to this email — we're a small team and read every message.
        </Text>
        <Text style={footer}>JobLine.ai · Streamlining Manufacturing Operations</Text>
      </Container>
    </Body>
  </Html>
)

export default TrialEndingEmail

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '40px 20px', borderRadius: '8px', maxWidth: '560px' }
const h1 = { color: '#1a1a1a', fontSize: '26px', fontWeight: '700', margin: '0 0 24px', textAlign: 'center' as const }
const text = { color: '#4a4a4a', fontSize: '16px', lineHeight: '24px', margin: '16px 0' }
const highlightBox = { backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: '6px', padding: '16px 20px', margin: '24px 0' }
const highlightTitle = { color: '#92400e', fontSize: '15px', fontWeight: '600', margin: '0 0 8px' }
const featureItem = { color: '#78350f', fontSize: '14px', lineHeight: '22px', margin: '2px 0' }
const buttonSection = { textAlign: 'center' as const, margin: '32px 0' }
const button = { backgroundColor: '#2563eb', borderRadius: '6px', color: '#ffffff', display: 'inline-block', fontSize: '16px', fontWeight: '600', padding: '12px 32px', textDecoration: 'none' }
const hr = { borderColor: '#e6e6e6', margin: '24px 0' }
const footerText = { color: '#6b7280', fontSize: '14px', lineHeight: '20px', margin: '16px 0' }
const footer = { color: '#9ca3af', fontSize: '12px', textAlign: 'center' as const, margin: '24px 0 0' }
