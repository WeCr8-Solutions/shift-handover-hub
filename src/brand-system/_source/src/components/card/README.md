# Card Components — Scope

Business card system matching the JOBLINE.AI ECOSYSTEM print layout.

## Components

| Component | Use |
|-----------|-----|
| `BusinessCard` | Single front or back card — for in-app sharing, profile pages |
| `EcosystemCard` | Full 4-product discovery grid — for onboarding and landing screens |

## BusinessCard Props
```typescript
<BusinessCard
  productLine="talent"   // talent | oap | learn | gca | start
  side="front"           // front | back
  theme="dark"           // dark | light (light = back-of-card white variant)
  urlOverride="..."      // optional UTM URL override
/>
```

## EcosystemCard Props
```typescript
<EcosystemCard
  layout="scroll"        // scroll | grid
  filter="oap"           // optional — show only one product
  onProductPress={(id, url) => navigate(id)}
/>
```

## Changelog
See root `CHANGELOG.md` — section: `[1.0.0] Cards`
