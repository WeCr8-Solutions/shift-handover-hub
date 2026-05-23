import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'https://esm.sh/@react-email/components@0.0.22?deps=react@18.3.1,react-dom@18.3.1'
import * as React from 'https://esm.sh/react@18.3.1'

interface Props {
  name?: string
  amount: string
  currency: string
  attemptCount: number
  nextAttemptAt?: string
  updatePaymentUrl: string
}

export const PaymentFailedEmail = ({
  name, amount, currency, attemptCount, nextAttemptAt, updatePaymentUrl,
}: Props) => (
  <Html>
    <Head />
    <Preview>Action needed: your JobLine.ai payment could not be processed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>⚠️ We couldn't process your payment</Heading>
        <Text style={text}>Hi {name || 'there'},</Text>
        <Text style={text}>
          The last attempt to charge {amount} {currency.toUpperCase()} for your JobLine.ai
          subscription was declined (attempt #{attemptCount}).
        </Text>
        {nextAttemptAt ? (
          <Text style={text}>
            Stripe will retry on <strong>{nextAttemptAt}</strong>. To avoid any interruption to your
            shop floor, please update your payment method as soon as possible.
          </Text>
        ) : (
          <Text style={text}>
            To keep your subscription active, please update your payment method right away.
          </Text>
        )}
        <Section style={alertBox}>
          <Text style={alertTitle}>What happens if we can't collect payment?</Text>
          <Text style={alertItem}>• Your account moves to a 7-day grace period</Text>
          <Text style={alertItem}>• After the grace period, the account is downgraded to free</Text>
          <Text style={alertItem}>• Your data stays safe — reactivate any time</Text>
        </Section>
        <Section style={buttonSection}>
          <Button style={button} href={updatePaymentUrl}>Update payment method</Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>JobLine.ai · Streamlining Manufacturing Operations</Text>
      </Container>
    </Body>
  </Html>
)

export default PaymentFailedEmail

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '40px 20px', borderRadius: '8px', maxWidth: '560px' }
const h1 = { color: '#991b1b', fontSize: '24px', fontWeight: '700', margin: '0 0 24px', textAlign: 'center' as const }
const text = { color: '#4a4a4a', fontSize: '16px', lineHeight: '24px', margin: '16px 0' }
const alertBox = { backgroundColor: '#fef2f2', borderLeft: '4px solid #dc2626', borderRadius: '6px', padding: '16px 20px', margin: '24px 0' }
const alertTitle = { color: '#991b1b', fontSize: '15px', fontWeight: '600', margin: '0 0 8px' }
const alertItem = { color: '#7f1d1d', fontSize: '14px', lineHeight: '22px', margin: '2px 0' }
const buttonSection = { textAlign: 'center' as const, margin: '32px 0' }
const button = { backgroundColor: '#dc2626', borderRadius: '6px', color: '#ffffff', display: 'inline-block', fontSize: '16px', fontWeight: '600', padding: '12px 32px', textDecoration: 'none' }
const hr = { borderColor: '#e6e6e6', margin: '24px 0' }
const footer = { color: '#9ca3af', fontSize: '12px', textAlign: 'center' as const, margin: '24px 0 0' }
