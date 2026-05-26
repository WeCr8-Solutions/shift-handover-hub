# Flyer Components — Scope

Five flyer layout components, each corresponding to a JobLine.ai product line extracted from print collateral.

## Components

| Component | Source | URL | Variants |
|-----------|--------|-----|----------|
| `FlyerShopMoving` | Shop poster (4-variant) | `/start` | manufacturing, auto-repair, welding, generic |
| `FlyerTalentProfile` | Flyer sheet row 1+2 | `/talent` | build-career, your-skills |
| `FlyerOAP` | Flyer sheet row 1 | `/oap` | — |
| `FlyerLearnAI` | Flyer sheet row 1 | `/learn` | — |
| `FlyerGCodeAcademy` | Flyer sheet row 1+2 | `/gca` | — |

## Shared Behavior
- All accept `onCTAPress?: (url: string) => void` — wire to in-app navigation
- All accept `utmSource`, `utmCampaign` for QR tracking (Batch 02)
- QR boxes render as placeholder — replace with `react-native-qrcode-svg` for live QR

## QR Integration (Batch 02)
```typescript
import QRCode from 'react-native-qrcode-svg';

// Replace the qrBox View with:
<QRCode
  value={`https://jobline.ai/start?utm_source=${utmSource}&utm_campaign=${utmCampaign}`}
  size={64}
  color={Colors.navyDeep}
  backgroundColor={Colors.white}
/>
```
