/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { main, container, brandBar, h1, text, muted, buttonSection, button, hr, footer } from './_shared-styles.ts'

interface Props { inviterName?: string; teamName?: string; inviteUrl?: string; role?: string }

const Email = ({ inviterName = 'A teammate', teamName = 'the team', inviteUrl = 'https://jobline.ai/auth', role = 'member' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're invited to {teamName} on Jobline.ai</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandBar}>Jobline.ai</Text>
        <Heading style={h1}>Team invitation</Heading>
        <Text style={text}>
          <strong>{inviterName}</strong> invited you to join <strong>{teamName}</strong> as <strong>{role}</strong>.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={inviteUrl}>Accept invitation</Button>
        </Section>
        <Text style={muted}>If you weren't expecting this, you can safely ignore this email.</Text>
        <Hr style={hr} />
        <Text style={footer}>Jobline.ai team invite.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `You're invited to ${d?.teamName ?? 'a team'} on Jobline.ai`,
  displayName: 'Team invite',
  previewData: { inviterName: 'Brandon', teamName: 'Aymar Engineering', inviteUrl: 'https://jobline.ai/auth?invite=ABC123', role: 'supervisor' },
} satisfies TemplateEntry
