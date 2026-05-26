# Design Tokens — Scope & Guide

## What's Here
Primitive design values extracted directly from JobLine.ai print collateral. These are the single source of truth for all visual identity in the app.

## Files
| File | Contents |
|------|----------|
| `colors.ts` | All hex values — navy, teal, green, white, semantic aliases |
| `typography.ts` | Font families, sizes, weights, pre-built text styles |
| `spacing.ts` | 8pt grid, border radii, shadows, flyer dimensions |

## Usage Rule
**Always import tokens — never hardcode hex/font values in components.**

```typescript
// ✅ Correct
import { Colors, TextStyles } from '../tokens';
style={{ backgroundColor: Colors.navyDeep }}

// ❌ Wrong
style={{ backgroundColor: '#0D1B2A' }}
```

## Changelog
See root `CHANGELOG.md` — section: `[1.0.0] Tokens`
