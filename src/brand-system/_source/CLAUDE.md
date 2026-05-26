# CLAUDE.md — Agent Instructions

> This file tells a coding agent (Claude Code, Cursor, Copilot) exactly how to work with this module.

## Module Purpose
TSX component library extracting the full JobLine.ai visual identity from print collateral into React Native / React components. Used in the JobLine.ai app (React + TypeScript + Vite + Supabase stack).

## Architecture Rules

### DO
- Import all colors from `src/tokens/colors.ts` — never hardcode hex
- Import all font values from `src/tokens/typography.ts`
- Use `StyleSheet.create()` for all styles — no inline style objects
- Keep components pure — no Supabase calls, no business logic
- Use `BaseFlyerProps` as base interface for all flyer components
- Export from `index.ts` barrel files only

### DO NOT
- Hardcode any color hex values in components
- Add navigation logic inside brand components (use `onCTAPress` callback)
- Modify `Colors` or `FontFamily` token values without updating `CHANGELOG.md`
- Import from sibling components — brand → (nothing), flyer → brand only, card → brand only

## Adding a New Flyer

1. Create `src/components/flyer/FlyerXxx.tsx`
2. Implement `BaseFlyerProps` interface
3. Use only tokens for colors/typography/spacing
4. Export from `src/components/flyer/index.ts`
5. Add entry to `CHANGELOG.md`
6. Add row to `docs/BRAND_AUDIT.md` source table

## Adding a New Token

1. Add to appropriate token file (`colors.ts`, `typography.ts`, `spacing.ts`)
2. Keep `as const` assertion
3. Update `CHANGELOG.md`
4. Document source evidence in `docs/BRAND_AUDIT.md`

## QR Code Placeholder Pattern

All QR boxes currently render a white `View` with label text "QR". 
Replace with `react-native-qrcode-svg` per `docs/INTEGRATION_GUIDE.md` Step 3.
The QR value should be constructed as:
```
https://jobline.ai/{path}?utm_source={utmSource}&utm_medium=print&utm_campaign={utmCampaign}
```

## Type Safety

Use `as unknown as TargetType` double-cast pattern if working with untyped Supabase data (per project convention).

## File Naming

- Components: `PascalCase.tsx`
- Tokens: `camelCase.ts`
- Docs: `SCREAMING_SNAKE.md`
- Exports: `index.ts`
