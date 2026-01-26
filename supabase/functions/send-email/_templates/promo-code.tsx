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

interface PromoCodeEmailProps {
  recipientName: string;
  senderName: string;
  promoCode: string;
  discountAmount: string;
  expiryDate: string;
  signupUrl: string;
}

export const PromoCodeEmail = ({ 
  recipientName,
  senderName,
  promoCode,
  discountAmount,
  expiryDate,
  signupUrl
}: PromoCodeEmailProps) => (
  <Html>
    <Head />
    <Preview>{senderName} shared a special offer with you - {discountAmount} off JobLine.ai!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You've Got a Special Offer! 🎁</Heading>
        
        <Text style={text}>
          Hi {recipientName || 'there'},
        </Text>
        
        <Text style={text}>
          <strong>{senderName}</strong> thought you'd love JobLine.ai and shared 
          an exclusive promo code with you!
        </Text>

        <Section style={promoSection}>
          <Text style={promoLabel}>Your Promo Code:</Text>
          <Text style={promoCodeStyle}>{promoCode}</Text>
          <Text style={discountText}>{discountAmount} OFF</Text>
        </Section>

        <Text style={text}>
          JobLine.ai helps manufacturing teams streamline shift handoffs and 
          track floor operations in real-time.
        </Text>

        <Section style={buttonSection}>
          <Button style={button} href={`${signupUrl}?promo=${promoCode}`}>
            Claim Your Discount
          </Button>
        </Section>

        <Text style={expiryText}>
          ⏰ Offer expires: {expiryDate}
        </Text>

        <Hr style={hr} />

        <Text style={footerNote}>
          This promo code was shared by {senderName} who is a JobLine.ai user. 
          They'll receive credit when you sign up!
        </Text>
        
        <Text style={footer}>
          JobLine.ai - Streamlining Manufacturing Operations
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PromoCodeEmail

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

const promoSection = {
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const promoLabel = {
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
  letterSpacing: '1px',
}

const promoCodeStyle = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: '700',
  fontFamily: 'monospace',
  letterSpacing: '4px',
  margin: '0 0 8px',
  padding: '12px 20px',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: '8px',
  display: 'inline-block',
}

const discountText = {
  color: '#fbbf24',
  fontSize: '18px',
  fontWeight: '700',
  margin: '12px 0 0',
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
  padding: '14px 36px',
  textDecoration: 'none',
}

const expiryText = {
  color: '#f59e0b',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '16px 0',
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
