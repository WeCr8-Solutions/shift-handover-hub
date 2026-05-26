# CHANGELOG — JobLine.ai Brand System

All notable changes to this module are documented here.
Format: `[version] YYYY-MM-DD — Summary`

---

## [1.0.0] 2025-05-26 — Initial Extraction

### Added
- Full color token system extracted from 3 source print collateral images
  - Flyer sheet (8-panel): Talent, OAP, Learn AI, G Code, Shop Moving
  - Business card ecosystem (16-card layout): all 4 product lines
  - Shop posters (4-variant): "Keep Your Work Moving" series
- `Colors` token object: navy, teal, green, white, subtext, card bg
- `Typography` scale: display (32/28/24), headline (20/18), body (14/12), label (11/10)
- `Spacing` 8pt grid: xs(4) → 5xl(64)
- `JobLineLogo` TSX: text-based logo with logomark squares + teal `.ai`
- `LogoMark` TSX: standalone ■■■◀ icon mark, scalable
- `FlyerShopMoving` — "Keep Your Work Moving" shop poster layout
- `FlyerTalentProfile` — "Build Your Career / Show Your Skills" layout
- `FlyerOAP` — Operator Acceptance Program layout
- `FlyerLearnAI` — Learn AI / Apply It layout
- `FlyerGCodeAcademy` — G Code Academy layout
- `BusinessCard` — Front/back card with dark navy theme
- `EcosystemCard` — Ecosystem card (light back-of-card variant)
- All barrel `index.ts` exports
- Full `BRAND_AUDIT.md` with color/font sourcing notes
- `INTEGRATION_GUIDE.md` with step-by-step import instructions

### Brand Tokens Locked
- Primary navy `#0D1B2A` — background, all dark cards
- Accent teal `#00C9A7` — headlines, CTAs, logo `.ai`
- CTA green `#1DB954` — bullet checkmarks, scan CTAs
- Card blue `#112240` — card/flyer surface
- White `#FFFFFF` — primary text
- Subtext `#8899AA` — secondary labels

---

## [Planned] 1.1.0

- UTM deep-link QR prop system (connects to Bitly/GA4 Batch 02)
- Animation variants via `react-native-reanimated`
- Dark/light mode token switching
- SAP work order card variant for shop floor display

---

*Section leads: review GOAL.md per section for per-section objectives*
