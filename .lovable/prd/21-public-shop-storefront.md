# PRD 21 — Public Shop Storefront (Apparel, Stickers & Merch)

> **Status**: Draft → Phase 1 Ready  
> **Owner**: Platform Team  
> **Backend**: Shopify Storefront API (via Lovable Shopify Integration)  
> **Store ID**: `joblineai-dwxhd`  
> **Last Updated**: 2026-03-08

---

## 1. Purpose & Goals

Build a public-facing merch shop at `/shop` selling JobLine.ai branded apparel, stickers, and accessories. The shop is separate from the SaaS subscription billing and uses Shopify for product catalog, inventory, variants, and checkout.

### Goals
- Generate non-subscription revenue from community/brand merchandise
- Provide a polished, on-brand shopping experience consistent with JobLine.ai design system
- Zero authentication required — fully public pages
- Real Shopify integration — no mock products

### Non-Goals
- No user accounts for shopping (Shopify handles guest checkout)
- No order management UI in JobLine (use Shopify admin)
- No fake reviews or testimonials

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Public Pages (no auth required)                │
│                                                 │
│  /shop ─────────── ShopPage (product grid)      │
│  /shop/:handle ─── ProductDetailPage            │
│                                                 │
│  Components:                                    │
│  ├── ShopLayout          (nav + cart drawer)     │
│  ├── ProductGrid         (responsive grid)      │
│  ├── ProductCard         (image/title/price)     │
│  ├── ProductDetailView   (variants/gallery)      │
│  ├── CartDrawer          (sheet sidebar)         │
│  ├── VariantSelector     (size/color picker)     │
│  └── ShopHero            (banner section)        │
│                                                 │
│  Hooks:                                         │
│  ├── useShopifyProducts  (fetch product list)    │
│  ├── useShopifyProduct   (fetch single product)  │
│  └── useCartSync         (visibility sync)       │
│                                                 │
│  State:                                         │
│  └── cartStore (Zustand + localStorage persist)  │
│                                                 │
│  API Layer:                                     │
│  └── src/lib/shopify.ts  (Storefront GraphQL)    │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  Shopify Storefront API (2025-07)               │
│  - Product queries (GraphQL)                    │
│  - Cart mutations (create/add/update/remove)    │
│  - Checkout URL generation                      │
└─────────────────────────────────────────────────┘
```

---

## 3. Phased Implementation Plan

### Phase 1: Foundation (Core Infrastructure)
**Priority: Critical | Estimated: 1 session**

| # | Task | Files | Status |
|---|------|-------|--------|
| 1.1 | Create `src/lib/shopify.ts` — Storefront API client, types, GraphQL queries, cart mutations | `src/lib/shopify.ts` | ☐ |
| 1.2 | Create Zustand cart store with localStorage persistence | `src/stores/cartStore.ts` | ☐ |
| 1.3 | Create `useCartSync` hook for visibility-change sync | `src/hooks/useCartSync.ts` | ☐ |
| 1.4 | Wire `useCartSync` into `App.tsx` | `src/App.tsx` | ☐ |
| 1.5 | Create `useShopifyProducts` hook (React Query wrapper) | `src/hooks/useShopifyProducts.ts` | ☐ |
| 1.6 | Create `useShopifyProduct` hook (single product by handle) | `src/hooks/useShopifyProduct.ts` | ☐ |

### Phase 2: Shop Pages & Components
**Priority: Critical | Estimated: 1 session**

| # | Task | Files | Status |
|---|------|-------|--------|
| 2.1 | Create `ShopHero` — branded banner with tagline | `src/components/shop/ShopHero.tsx` | ☐ |
| 2.2 | Create `ProductCard` — image, title, price, "Add to Cart" | `src/components/shop/ProductCard.tsx` | ☐ |
| 2.3 | Create `ProductGrid` — responsive grid with loading skeletons | `src/components/shop/ProductGrid.tsx` | ☐ |
| 2.4 | Create `VariantSelector` — size/color option pickers | `src/components/shop/VariantSelector.tsx` | ☐ |
| 2.5 | Create `CartDrawer` — Sheet sidebar with item management | `src/components/shop/CartDrawer.tsx` | ☐ |
| 2.6 | Create `ShopLayout` — MarketingNav + CartDrawer wrapper | `src/components/shop/ShopLayout.tsx` | ☐ |
| 2.7 | Create `/shop` page — ShopLayout + Hero + ProductGrid | `src/pages/Shop.tsx` | ☐ |
| 2.8 | Create `/shop/:handle` page — product detail with gallery | `src/pages/ShopProduct.tsx` | ☐ |
| 2.9 | Add routes to `App.tsx` | `src/App.tsx` | ☐ |

### Phase 3: Polish & UX
**Priority: Important | Estimated: 1 session**

| # | Task | Files | Status |
|---|------|-------|--------|
| 3.1 | Add toast notifications on cart add (NOT bottom-right) | `ProductCard.tsx` | ☐ |
| 3.2 | Empty state: "No products found" with CTA to check back | `ProductGrid.tsx` | ☐ |
| 3.3 | Product image gallery with thumbnail navigation | `ShopProduct.tsx` | ☐ |
| 3.4 | SEO: Helmet meta tags, JSON-LD Product schema | `Shop.tsx`, `ShopProduct.tsx` | ☐ |
| 3.5 | Add `/shop` link to MarketingNav and Landing page | `MarketingNav.tsx` | ☐ |
| 3.6 | Mobile responsive testing & fixes | Various | ☐ |

### Phase 4: Products & Launch
**Priority: Important | Estimated: 1 session**

| # | Task | Files | Status |
|---|------|-------|--------|
| 4.1 | Create initial products via Shopify tools (apparel, stickers) | Shopify API | ☐ |
| 4.2 | Upload product images | Shopify API | ☐ |
| 4.3 | Configure shipping in Shopify admin | Shopify Admin | ☐ |
| 4.4 | Configure payment methods in Shopify admin | Shopify Admin | ☐ |
| 4.5 | End-to-end checkout flow test | Manual | ☐ |

---

## 4. Component Specifications

### 4.1 `src/lib/shopify.ts`
- Constants: `SHOPIFY_API_VERSION`, `SHOPIFY_STORE_PERMANENT_DOMAIN`, `SHOPIFY_STOREFRONT_URL`, `SHOPIFY_STOREFRONT_TOKEN`
- `storefrontApiRequest(query, variables)` — GraphQL fetch helper with 402 toast handling
- `ShopifyProduct` TypeScript interface
- All GraphQL queries and cart mutations
- Cart helper functions: `createShopifyCart`, `addLineToShopifyCart`, `updateShopifyCartLine`, `removeLineFromShopifyCart`
- `formatCheckoutUrl` — appends `channel=online_store` param

### 4.2 `src/stores/cartStore.ts`
- Zustand store with `persist` middleware (localStorage)
- State: `items`, `cartId`, `checkoutUrl`, `isLoading`, `isSyncing`
- Actions: `addItem`, `updateQuantity`, `removeItem`, `clearCart`, `syncCart`, `getCheckoutUrl`
- `partialize` to exclude loading states from persistence

### 4.3 `useShopifyProducts` Hook
```typescript
function useShopifyProducts(count?: number, query?: string): {
  products: ShopifyProduct[];
  isLoading: boolean;
  error: Error | null;
}
```
- React Query wrapper around `storefrontApiRequest`
- `staleTime: 60_000` (1 min cache)
- Supports optional search query parameter

### 4.4 `useShopifyProduct` Hook
```typescript
function useShopifyProduct(handle: string): {
  product: ShopifyProduct | null;
  isLoading: boolean;
  error: Error | null;
}
```
- Fetches single product by handle via Storefront API
- Used on `/shop/:handle` detail page

### 4.5 `ProductCard`
- Props: `product: ShopifyProduct`
- Displays: first image, title, price range, "Add to Cart" button
- Clicking card navigates to `/shop/${product.node.handle}`
- "Add to Cart" uses first available variant by default
- Loading state on add-to-cart action

### 4.6 `CartDrawer`
- Sheet component (right side)
- Trigger: shopping cart icon with badge count
- Item list: image, title, variant info, price, quantity controls, remove
- Footer: total price + "Checkout with Shopify" button
- Checkout opens in new tab via `window.open(checkoutUrl, '_blank')`
- Syncs with Shopify on open

### 4.7 `VariantSelector`
- Renders option groups (Size, Color, etc.) from `product.node.options`
- Updates selected variant, disables unavailable combinations
- Shows "Out of Stock" for `availableForSale: false` variants

---

## 5. Routing

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/shop` | `Shop.tsx` | Public | Product grid with hero |
| `/shop/:handle` | `ShopProduct.tsx` | Public | Product detail page |

---

## 6. Testing Checklist

### Unit Tests
- [ ] `cartStore` — add, update, remove, clear, sync operations
- [ ] `useShopifyProducts` — loading, error, success states
- [ ] `formatCheckoutUrl` — appends channel param correctly

### Integration Tests
- [ ] Add item to cart → verify Shopify cart created via API
- [ ] Update quantity → verify `cartLinesUpdate` mutation called
- [ ] Remove last item → verify cart cleared
- [ ] Cart persistence → reload page, verify items restored
- [ ] Cart sync on tab return → verify stale carts cleared

### E2E Validation
- [ ] Browse products on `/shop`
- [ ] Click product → navigate to `/shop/:handle`
- [ ] Select variant → add to cart → see cart drawer update
- [ ] Adjust quantity in cart drawer
- [ ] Click checkout → new tab opens Shopify checkout
- [ ] Complete purchase → return to tab → cart cleared
- [ ] Mobile responsive layout verified
- [ ] Empty product state displays correctly

### Security
- [ ] No auth tokens exposed in public pages
- [ ] Storefront token is public/read-only (safe to expose)
- [ ] No PII stored in localStorage beyond cart items

---

## 7. Performance Considerations

| Concern | Mitigation |
|---------|-----------|
| Product image loading | Shopify CDN handles optimization; use `loading="lazy"` |
| Cart state hydration | Zustand persist with `partialize` (exclude transient states) |
| API request deduplication | React Query with `staleTime: 60s` |
| Cart sync storms | `isSyncing` guard prevents concurrent sync calls |
| Bundle size | Shop components lazy-loaded via `React.lazy` |

---

## 8. Design System Compliance

- All colors via semantic tokens (`--primary`, `--background`, `--muted`, etc.)
- No hardcoded color values
- Uses existing shadcn components: `Button`, `Card`, `Sheet`, `Badge`, `Skeleton`
- Consistent with MarketingNav styling
- Dark/light mode compatible via CSS variables

---

## 9. Dependencies

| Package | Purpose | Status |
|---------|---------|--------|
| `zustand` | Cart state management | ✅ Installed |
| `@tanstack/react-query` | Product data fetching | ✅ Installed |
| `sonner` | Toast notifications | ✅ Installed |
| `lucide-react` | Icons | ✅ Installed |

No new dependencies required.

---

## 10. Open Questions

1. **Product categories**: Should we add category filtering (Apparel, Stickers, Accessories)?
2. **Featured products**: Should certain products be highlighted on the landing page?
3. **Discount codes**: Should we surface a promo code input in the cart drawer (handled by Shopify checkout)?
4. **Analytics**: Should shop page views and add-to-cart events feed into the existing analytics system?
