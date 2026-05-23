import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'https://esm.sh/@react-email/components@0.0.22?deps=react@18.3.1,react-dom@18.3.1'
import * as React from 'https://esm.sh/react@18.3.1'

interface Props {
  recipientName: string
  policyLabel: string
  versionLabel: string
  effectiveDate: string
  title: string
  summary: string
  highlights: string[]
  fullPolicyUrl: string
  manageAccountUrl: string
}

export const PolicyChangeEmail = ({
  recipientName, policyLabel, versionLabel, effectiveDate,
  title, summary, highlights, fullPolicyUrl, manageAccountUrl,
}: Props) => (
  <Html>
    <Head />
    <Preview>{`Update to our ${policyLabel} — effective ${effectiveDate}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>{policyLabel.toUpperCase()} · {versionLabel}</Text>
        <Heading style={h1}>{title}</Heading>
        <Text style={text}>Hi {recipientName},</Text>
        <Text style={text}>
          We&apos;re writing to let you know that our <strong>{policyLabel}</strong> has been
          updated. These changes take effect on <strong>{effectiveDate}</strong>.
        </Text>
        <Text style={text}>{summary}</Text>

        {highlights.length > 0 && (
          <Section style={featureSection}>
            <Text style={featureTitle}>What&apos;s changing:</Text>
            {highlights.map((h, i) => (
              <Text key={i} style={featureItem}>• {h}</Text>
            ))}
          </Section>
        )}

        <Section style={buttonSection}>
          <Button style={button} href={fullPolicyUrl}>Read the full {policyLabel}</Button>
        </Section>

        <Text style={text}>
          By continuing to use JobLine.ai after {effectiveDate}, you agree to the updated terms.
          If you have questions or do not agree, you can review your account at any time.
        </Text>

        <Hr style={hr} />

        <Text style={footerText}>
          You&apos;re receiving this email because you have an active JobLine.ai account.
          This is a legally required account notification and applies to all users.
        </Text>
        <Text style={footerText}>
          <a href={manageAccountUrl} style={link}>Manage your account</a>
        </Text>
        <Text style={footer}>JobLine.ai — Streamlining Manufacturing Operations</Text>
      </Container>
    </Body>
  </Html>
)

export default PolicyChangeEmail

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '40px 24px', borderRadius: '8px', maxWidth: '560px' }
const eyebrow = { color: '#2563eb', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', margin: '0 0 8px' }
const h1 = { color: '#0f172a', fontSize: '24px', fontWeight: '700', margin: '0 0 20px', lineHeight: '32px' }
const text = { color: '#334155', fontSize: '15px', lineHeight: '24px', margin: '12px 0' }
const featureSection = { backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '16px 20px', margin: '20px 0' }
const featureTitle = { color: '#0f172a', fontSize: '14px', fontWeight: '700', margin: '0 0 8px' }
const featureItem = { color: '#334155', fontSize: '14px', lineHeight: '22px', margin: '4px 0' }
const buttonSection = { textAlign: 'center' as const, margin: '28px 0' }
const button = { backgroundColor: '#2563eb', borderRadius: '6px', color: '#ffffff', display: 'inline-block', fontSize: '15px', fontWeight: '600', padding: '12px 28px', textDecoration: 'none' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footerText = { color: '#64748b', fontSize: '12px', lineHeight: '18px', margin: '8px 0' }
const link = { color: '#2563eb', textDecoration: 'underline' }
const footer = { color: '#94a3b8', fontSize: '11px', textAlign: 'center' as const, margin: '20px 0 0' }
