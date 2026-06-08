/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { main, container, brandBar, h1, text, buttonSection, button, hr, footer } from './_shared-styles.ts'

interface Props { userName?: string; appUrl?: string }

const Email = ({ userName = 'there', appUrl = 'https://jobline.ai' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to Jobline.ai</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandBar}>Jobline.ai</Text>
        <Heading style={h1}>Welcome, {userName} 👋</Heading>
        <Text style={text}>
          Your Jobline.ai account is ready. Use it to run shift handoffs, work orders,
          quality checkpoints, and your shop floor — all in one place.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={appUrl}>Open Jobline.ai</Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Jobline.ai — Streamlining manufacturing operations.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Welcome to Jobline.ai',
  displayName: 'Welcome',
  previewData: { userName: 'Brandon', appUrl: 'https://jobline.ai' },
} satisfies TemplateEntry
