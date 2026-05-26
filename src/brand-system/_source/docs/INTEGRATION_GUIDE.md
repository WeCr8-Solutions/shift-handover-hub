# Integration Guide — JobLine.ai App

## Step 1: Copy Module

Copy the `src/` directory into your JobLine.ai project:

```
your-project/
└── src/
    └── brand/           ← paste jobline-brand-system/src/ here
        ├── tokens/
        ├── types/
        └── components/
```

---

## Step 2: Install Required Fonts

Add to your Expo project:

```bash
npx expo install @expo-google-fonts/montserrat @expo-google-fonts/open-sans expo-font
```

Load in `App.tsx`:

```typescript
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import {
  OpenSans_400Regular,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
} from '@expo-google-fonts/open-sans';

export default function App() {
  const [fontsLoaded] = useFonts({
    Montserrat_800ExtraBold,
    Montserrat_700Bold,
    Montserrat_600SemiBold,
    Montserrat_400Regular,
    OpenSans_400Regular,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
  });

  if (!fontsLoaded) return null;
  // ...
}
```

---

## Step 3: Install QR Code Library (Batch 02)

```bash
npx expo install react-native-qrcode-svg react-native-svg
```

Swap placeholder in any flyer component:

```typescript
// Replace qrBox View with:
import QRCode from 'react-native-qrcode-svg';

<QRCode
  value={`https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=batch02`}
  size={64}
  color={Colors.navyDeep}
  backgroundColor={Colors.white}
/>
```

---

## Step 4: Wire Deep Links

```typescript
import { FlyerShopMoving } from './brand/components/flyer';
import { useNavigation } from '@react-navigation/native';

const MyScreen = () => {
  const nav = useNavigation();
  return (
    <FlyerShopMoving
      variant="manufacturing"
      utmSource="app-discovery"
      utmCampaign="onboarding-v1"
      onCTAPress={(url) => {
        // Navigate in-app or open browser
        nav.navigate('Onboarding', { source: 'flyer-cta', url });
      }}
    />
  );
};
```

---

## Step 5: Use EcosystemCard for Discovery Screen

```typescript
import { EcosystemCard } from './brand/components/card';

// In your onboarding or discovery screen:
<EcosystemCard
  layout="scroll"
  onProductPress={(productLine, url) => {
    navigation.navigate('ProductDetail', { productLine });
  }}
/>
```

---

## Step 6: SAP Work Order Card (Future)

When the SAP S/4HANA integration is active, wrap work order data in a `BusinessCard`-style layout using the `navyCard` surface and `teal` accent tokens. The token system is already aligned with the shop floor UI color scheme.

---

## Notes

- All token values are `as const` — full TypeScript autocomplete
- Components work in React Native **and** React DOM (web) — no native-only APIs used
- QR boxes are placeholder `View` components — swap with any QR library
- `onCTAPress` prop prevents `Linking.openURL` in in-app contexts
