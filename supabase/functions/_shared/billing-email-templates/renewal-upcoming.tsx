import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'https://esm.sh/@react-email/components@0.0.22?deps=react@18.3.1,react-dom@18.3.1'
import * as React from 'https://esm.sh/react@18.3.1'

interface Props {
  name?: string
  planName: string
  amount: string // pre-formatted e.g. "$149.00"
  currency: string
  renewalDate: string
  manageUrl: string
}

export const RenewalUpcomingEmail = ({ name, planName, amount, currency, renewalDate, manageUrl }: Props) => (
  <Html>
    <Head />
    <Preview>Heads up: your JobLine.ai {planName} plan renews on {renewalDate}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your subscription renews soon</Heading>
        <Text style={text}>Hi {name || 'there'},</Text>
        <Text style={text}>
          Your <strong>{planName}</strong> plan will automatically renew on <strong>{renewalDate}</strong>.
          We'll charge your payment method on file for the amount below.
        </Text>
        <Section style={invoiceBox}>
          <Text style={invoiceLabel}>Amount due</Text>
          <Text style={invoiceAmount}>{amount} {currency.toUpperCase()}</Text>
          <Hr style={invoiceHr} />
          <Text style={invoiceMeta}>Plan: {planName}</Text>
          <Text style={invoiceMeta}>Renewal date: {renewalDate}</Text>
        </Section>
        <Section style={buttonSection}>
          <Button style={button} href={manageUrl}>Review billing details</Button>
        </Section>
        <Text style={footerText}>
          Need to change your plan or cancel? You can do it any time from the billing portal —
          changes made before {renewalDate} will be reflected on this invoice.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>JobLine.ai · Streamlining Manufacturing Operations</Text>
      </Container>
    </Body>
  </Html>
)

export default RenewalUpcomingEmail

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '40px 20px', borderRadius: '8px', maxWidth: '560px' }
const h1 = { color: '#1a1a1a', fontSize: '26px', fontWeight: '700', margin: '0 0 24px', textAlign: 'center' as const }
const text = { color: '#4a4a4a', fontSize: '16px', lineHeight: '24px', margin: '16px 0' }
const invoiceBox = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', margin: '24px 0', textAlign: 'center' as const }
const invoiceLabel = { color: '#64748b', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' as const, margin: '0' }
const invoiceAmount = { color: '#0f172a', fontSize: '32px', fontWeight: '700', margin: '8px 0 16px' }
const invoiceHr = { borderColor: '#e2e8f0', margin: '12px 0' }
const invoiceMeta = { color: '#475569', fontSize: '14px', margin: '4px 0' }
const buttonSection = { textAlign: 'center' as const, margin: '24px 0' }
const button = { backgroundColor: '#2563eb', borderRadius: '6px', color: '#ffffff', display: 'inline-block', fontSize: '16px', fontWeight: '600', padding: '12px 32px', textDecoration: 'none' }
const hr = { borderColor: '#e6e6e6', margin: '24px 0' }
const footerText = { color: '#6b7280', fontSize: '14px', lineHeight: '20px', margin: '16px 0' }
const footer = { color: '#9ca3af', fontSize: '12px', textAlign: 'center' as const, margin: '24px 0 0' }
