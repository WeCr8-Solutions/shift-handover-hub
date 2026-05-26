# Types — Scope & Guide

Shared TypeScript interfaces for the entire brand system. Import from here — never redefine locally.

## Key Types

| Type | Use |
|------|-----|
| `ProductLine` | Which JobLine.ai product (talent, oap, learn, gca, start) |
| `FlyerVariant` | Which flyer layout to render |
| `CTAProps` | CTA + QR block — includes UTM fields for Batch 02 tracking |
| `BulletItem` | Bullet list rows with optional color override |
| `BaseFlyerProps` | Base props inherited by all flyer components |
| `BusinessCardProps` | Card component props |

## UTM Integration Note
`CTAProps.utmSource/utmMedium/utmCampaign` fields feed directly into the Bitly + GA4 tracking pipeline (Batch 02). When rendering flyers digitally, pass these values to generate tracked QR codes.
