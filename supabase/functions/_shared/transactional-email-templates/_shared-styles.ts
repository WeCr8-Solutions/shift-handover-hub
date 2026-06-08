// Shared inline-style tokens for all Jobline.ai transactional emails.
// Email Body backgrounds must stay #ffffff per Lovable Emails guidance.

export const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
}

export const container = {
  margin: '0 auto',
  padding: '32px 24px',
  maxWidth: '560px',
}

export const brandBar = {
  fontSize: '14px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: '#0f172a',
  textTransform: 'uppercase' as const,
  marginBottom: '24px',
}

export const h1 = {
  color: '#0f172a',
  fontSize: '26px',
  fontWeight: 700,
  lineHeight: '34px',
  margin: '0 0 16px',
}

export const text = {
  color: '#334155',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

export const muted = {
  color: '#64748b',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 12px',
}

export const card = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '20px 22px',
  margin: '20px 0',
}

export const codeBox = {
  fontFamily: '"SF Mono", Menlo, monospace',
  fontSize: '20px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  color: '#0f172a',
  backgroundColor: '#eef2ff',
  border: '1px solid #c7d2fe',
  borderRadius: '8px',
  padding: '14px 18px',
  textAlign: 'center' as const,
  margin: '12px 0',
}

export const buttonSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

export const button = {
  backgroundColor: '#0f172a',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 28px',
  borderRadius: '8px',
}

export const hr = {
  borderColor: '#e2e8f0',
  margin: '28px 0 16px',
}

export const footer = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0',
}
