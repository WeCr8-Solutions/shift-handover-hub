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

interface HandoffNotificationEmailProps {
  recipientName: string;
  stationName: string;
  outgoingOperator: string;
  shift: string;
  workOrder: string;
  partNumber: string;
  status: string;
  summary: string;
  dashboardUrl: string;
}

export const HandoffNotificationEmail = ({ 
  recipientName,
  stationName,
  outgoingOperator,
  shift,
  workOrder,
  partNumber,
  status,
  summary,
  dashboardUrl
}: HandoffNotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>New handoff submitted for {stationName} - {shift} shift</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Shift Handoff Report 📋</Heading>
        
        <Text style={text}>
          Hi {recipientName || 'there'},
        </Text>
        
        <Text style={text}>
          A new shift handoff has been submitted that you should review.
        </Text>

        <Section style={detailsSection}>
          <table style={detailsTable}>
            <tbody>
              <tr>
                <td style={labelCell}>Station:</td>
                <td style={valueCell}>{stationName}</td>
              </tr>
              <tr>
                <td style={labelCell}>Outgoing Operator:</td>
                <td style={valueCell}>{outgoingOperator}</td>
              </tr>
              <tr>
                <td style={labelCell}>Shift:</td>
                <td style={valueCell}>{shift}</td>
              </tr>
              <tr>
                <td style={labelCell}>Work Order:</td>
                <td style={valueCell}>{workOrder}</td>
              </tr>
              <tr>
                <td style={labelCell}>Part Number:</td>
                <td style={valueCell}>{partNumber}</td>
              </tr>
              <tr>
                <td style={labelCell}>Status:</td>
                <td style={valueCell}>
                  <span style={getStatusStyle(status)}>{status}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section style={summarySection}>
          <Text style={summaryLabel}>Handoff Summary:</Text>
          <Text style={summaryText}>{summary}</Text>
        </Section>

        <Section style={buttonSection}>
          <Button style={button} href={dashboardUrl}>
            View Full Report
          </Button>
        </Section>

        <Hr style={hr} />
        
        <Text style={footer}>
          JobLine.ai - Streamlining Manufacturing Operations
        </Text>
      </Container>
    </Body>
  </Html>
)

function getStatusStyle(status: string): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  }
  
  if (status.toLowerCase() === 'running') {
    return { ...baseStyle, backgroundColor: '#dcfce7', color: '#166534' }
  } else if (status.toLowerCase() === 'down') {
    return { ...baseStyle, backgroundColor: '#fee2e2', color: '#991b1b' }
  } else {
    return { ...baseStyle, backgroundColor: '#fef3c7', color: '#92400e' }
  }
}

export default HandoffNotificationEmail

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

const detailsSection = {
  margin: '24px 0',
}

const detailsTable: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}

const labelCell = {
  color: '#6b7280',
  fontSize: '14px',
  padding: '8px 12px 8px 0',
  borderBottom: '1px solid #e5e7eb',
  width: '40%',
}

const valueCell = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: '500',
  padding: '8px 0',
  borderBottom: '1px solid #e5e7eb',
}

const summarySection = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const summaryLabel = {
  color: '#374151',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
}

const summaryText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
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

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '24px 0 0',
}
