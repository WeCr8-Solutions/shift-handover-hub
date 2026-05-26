# JobLine.ai Brand System — React Native / React Module

> **Version:** 1.0.0 | **Status:** Active | **Scope:** Full visual identity extraction from print collateral → typed TSX component library

## What This Is

A production-ready, fully-typed TSX component library extracted from all physical JobLine.ai print collateral (flyers, business cards, shop posters). Designed for import into the JobLine.ai React Native app and any connected web/print systems.

Covers **exact visual identity**: colors, typography scale, logo marks, spacing, iconography, and all campaign-specific card/flyer layouts as reusable components.

---

## Module Structure

```
jobline-brand-system/
├── README.md                  ← You are here (root scope)
├── CHANGELOG.md               ← Version history
│
├── src/
│   ├── tokens/
│   │   ├── README.md          ← Token system scope
│   │   ├── colors.ts          ← Full color palette (exact brand hex)
│   │   ├── typography.ts      ← Font scales and weight system
│   │   ├── spacing.ts         ← 8pt grid spacing tokens
│   │   └── index.ts           ← Barrel export
│   │
│   ├── types/
│   │   ├── README.md
│   │   └── brand.types.ts     ← Shared TypeScript interfaces
│   │
│   └── components/
│       ├── brand/
│       │   ├── README.md      ← Brand component scope
│       │   ├── GOAL.md
│       │   ├── JobLineLogo.tsx
│       │   ├── LogoMark.tsx
│       │   └── index.ts
│       │
│       ├── flyer/
│       │   ├── README.md      ← Flyer component scope
│       │   ├── GOAL.md
│       │   ├── FlyerShopMoving.tsx
│       │   ├── FlyerTalentProfile.tsx
│       │   ├── FlyerOAP.tsx
│       │   ├── FlyerLearnAI.tsx
│       │   ├── FlyerGCodeAcademy.tsx
│       │   └── index.ts
│       │
│       └── card/
│           ├── README.md      ← Card component scope
│           ├── GOAL.md
│           ├── BusinessCard.tsx
│           ├── EcosystemCard.tsx
│           └── index.ts
│
└── docs/
    ├── BRAND_AUDIT.md         ← Full color/font audit from source images
    └── INTEGRATION_GUIDE.md   ← How to wire into JobLine.ai app
```

---

## Quick Import

```typescript
// Design tokens
import { Colors, Typography, Spacing } from './src/tokens';

// Logo
import { JobLineLogo, LogoMark } from './src/components/brand';

// Flyer layouts
import { FlyerShopMoving, FlyerTalentProfile } from './src/components/flyer';

// Business cards
import { BusinessCard, EcosystemCard } from './src/components/card';
```

---

## Tech Stack

- **Framework:** React Native + React (shared TSX)
- **Styling:** StyleSheet (React Native) with web-compatible style objects
- **Types:** TypeScript strict mode
- **Fonts:** Requires `expo-font` or equivalent for `Montserrat` + `Open Sans`

---

## Brand Identity Summary

| Token | Value |
|-------|-------|
| Primary Navy | `#0D1B2A` |
| Accent Teal | `#00C9A7` |
| Accent Green | `#1DB954` (CTA) |
| Card Blue | `#112240` |
| White | `#FFFFFF` |
| Subtext | `#8899AA` |

Logo pattern: `■■■◀` (three squares + play chevron) + `JobLine` (white) + `.ai` (teal)

---

## Sections

| Section | Scope | Status |
|---------|-------|--------|
| `tokens/` | Design primitives | ✅ Complete |
| `components/brand/` | Logo + mark | ✅ Complete |
| `components/flyer/` | All 5 flyer types | ✅ Complete |
| `components/card/` | Business card system | ✅ Complete |

---

*Built for WeCr8 Solutions · JobLine.ai · San Diego, CA*
