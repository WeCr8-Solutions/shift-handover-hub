/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { main, container, brandBar, h1, text, muted, buttonSection, button, hr, footer } from './_shared-styles.ts'

interface Props { userName?: string; resetUrl?: string; expiryMinutes?: number }

const Email = ({ userName = 'there', resetUrl = 'https://jobline.ai/auth', expiryMinutes = 60 }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your Jobline.ai password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandBar}>Jobline.ai</Text>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>Hi {userName}, click the button below to set a new password.</Text>
        <Section style={buttonSection}>
          <Button style={button} href={resetUrl}>Reset password</Button>
        </Section>
        <Text style={muted}>This link expires in {expiryMinutes} minutes. If you didn't request this, ignore this email.</Text>
        <Hr style={hr} />
        <Text style={footer}>Jobline.ai security notice.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Reset your Jobline.ai password',
  displayName: 'Password reset',
  previewData: { userName: 'Brandon', resetUrl: 'https://jobline.ai/auth', expiryMinutes: 60 },
} satisfies TemplateEntry
