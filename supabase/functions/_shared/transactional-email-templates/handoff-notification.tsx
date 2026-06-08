/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { main, container, brandBar, h1, text, muted, card, buttonSection, button, hr, footer } from './_shared-styles.ts'

interface Props {
  recipientName?: string; stationName?: string; outgoingOperator?: string
  shift?: string; workOrder?: string; partNumber?: string
  status?: string; summary?: string; dashboardUrl?: string
}

const Email = ({
  recipientName = 'there', stationName = '', outgoingOperator = '',
  shift = '', workOrder = '', partNumber = '', status = '', summary = '',
  dashboardUrl = 'https://jobline.ai/dashboard',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New handoff for {stationName} — {shift} shift</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandBar}>Jobline.ai</Text>
        <Heading style={h1}>New shift handoff</Heading>
        <Text style={text}>Hi {recipientName}, {outgoingOperator} submitted a handoff on <strong>{stationName}</strong> ({shift} shift).</Text>
        <Section style={card}>
          {workOrder && <Text style={muted}><strong>Work order:</strong> {workOrder}</Text>}
          {partNumber && <Text style={muted}><strong>Part:</strong> {partNumber}</Text>}
          {status && <Text style={muted}><strong>Status:</strong> {status}</Text>}
          {summary && <Text style={{ ...text, marginTop: '8px' }}>{summary}</Text>}
        </Section>
        <Section style={buttonSection}>
          <Button style={button} href={dashboardUrl}>Open dashboard</Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Jobline.ai handoff notification.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `New handoff for ${d?.stationName ?? 'a station'} — ${d?.shift ?? ''} shift`.trim(),
  displayName: 'Handoff notification',
  previewData: { recipientName: 'Brandon', stationName: 'Haas VF-2', outgoingOperator: 'Cory', shift: '1st', workOrder: 'WO-1042', partNumber: 'P-9981', status: 'In progress', summary: 'Roughed first 12 of 30. Coolant topped off. Tool 4 wearing — swap before finishing.', dashboardUrl: 'https://jobline.ai/dashboard' },
} satisfies TemplateEntry
