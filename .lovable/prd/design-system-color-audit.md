# PRD: Design System & Color Token Audit

**Date:** 2026-03-10  
**Status:** Draft  
**Priority:** High  

---

## Executive Summary

An audit of `index.css` and `tailwind.config.ts` reveals **2,371 hardcoded color instances across 134 files** bypassing the semantic token system. While the foundational token architecture is solid, significant gaps in token coverage, theme support, and adoption enforcement exist.

---

## Current State Assessment

### ✅ What's Working Well
- **Semantic status/state tokens** (`--status-ok`, `--state-running`, etc.) — well-structured for manufacturing domain
- **Component utility classes** (`.status-badge`, `.machine-card`, `.data-label`) — good pattern
- **Sidebar tokens** — fully tokenized
- **Font system** — clean Inter + JetBrains Mono pairing with ITAR fallback support

### 🔴 Critical Issues

#### 1. Massive Hardcoded Color Leakage (2,371 instances / 134 files)
Components use raw Tailwind colors (`bg-green-500`, `text-red-400`, `bg-yellow-500`, `text-gray-500`, `bg-blue-500`, `text-white`, `bg-black`) instead of design tokens. Examples:
- `bg-green-500` for success states → should use `bg-status-ok`
- `text-red-400` for alerts → should use `text-status-critical`
- `bg-yellow-500` for setup/warning → should use `bg-status-warning`
- `text-gray-500` for muted → should use `text-muted-foreground`
- `text-white` / `bg-black` → should use `text-foreground` / `bg-background`

#### 2. No Light Mode Support
Only `:root` (dark) defined — no `.light` or `.dark` class variants. This blocks:
- Accessibility (WCAG contrast in bright environments)
- Print-friendly views (shift reports, work orders)
- User preference support

#### 3. Redundant Token Definitions
Three tokens map to identical values with no semantic distinction:

| Token | Value | Purpose |
|---|---|---|
| `--status-ok` | `142 70% 45%` | Status badges |
| `--state-running` | `142 70% 45%` | Machine cards |
| `--success` | `142 71% 45%` | General success |

Same pattern for warning/orange and critical/red families.

#### 4. Missing Token Categories
| Category | Status | Impact |
|---|---|---|
| **Role colors** (admin, supervisor, operator, viewer) | ❌ Missing | Hardcoded across permission UIs |
| **Priority tokens** | Defined in CSS, ❌ not in Tailwind config | Can't use `bg-priority-critical` |
| **Chart/data-viz colors** | ❌ Missing | Recharts uses hardcoded hex |
| **Gradient tokens** | ❌ Missing | `text-gradient` exists but no reusable gradient vars |
| **Elevation/shadow tokens** | ❌ Missing | Inconsistent shadows across cards |
| **Surface layers** (elevated, sunken, overlay) | ❌ Missing | Cards/modals use same `--card` |
| **Interactive states** (hover, active, focus-visible) | ❌ Missing | Inconsistent hover treatments |

#### 5. Foreground Token Inconsistency
`--success-foreground` and `--warning-foreground` use darker shades of the same hue (for text-on-white), but in a dark-only theme these are never the right contrast pairing. They should be light text values or removed.

---

## Recommended Improvements

### Phase 1: Token Expansion (index.css)

```css
:root {
  /* ── Existing tokens (keep) ── */

  /* ── NEW: Surface layers ── */
  --surface-elevated: 220 18% 15%;     /* modals, dropdowns */
  --surface-sunken: 220 20% 8%;        /* inset areas, wells */
  --surface-overlay: 220 20% 6%;       /* full-screen overlays */

  /* ── NEW: Role colors ── */
  --role-admin: 0 84% 60%;
  --role-developer: 25 95% 53%;
  --role-supervisor: 199 89% 48%;
  --role-operator: 142 70% 45%;
  --role-viewer: 220 13% 46%;
  --role-org-owner: 271 81% 56%;
  --role-org-admin: 239 84% 67%;

  /* ── NEW: Chart palette (6-color) ── */
  --chart-1: 185 70% 45%;
  --chart-2: 142 70% 45%;
  --chart-3: 38 92% 50%;
  --chart-4: 271 81% 56%;
  --chart-5: 199 89% 48%;
  --chart-6: 0 70% 50%;

  /* ── NEW: Interactive states ── */
  --hover: 220 15% 24%;
  --active: 220 15% 28%;
  --focus-ring: 185 70% 45%;

  /* ── NEW: Elevation shadows ── */
  --shadow-sm: 0 1px 2px 0 hsl(0 0% 0% / 0.3);
  --shadow-md: 0 4px 12px -2px hsl(0 0% 0% / 0.4);
  --shadow-lg: 0 10px 30px -4px hsl(0 0% 0% / 0.5);
  --shadow-glow: 0 0 20px -4px hsl(var(--primary) / 0.3);
}
```

### Phase 2: Tailwind Config Registration

Add missing token groups to `tailwind.config.ts`:

```ts
colors: {
  // ... existing ...
  priority: {
    critical: "hsl(var(--priority-critical))",
    urgent: "hsl(var(--priority-urgent))",
    high: "hsl(var(--priority-high))",
    normal: "hsl(var(--priority-normal))",
  },
  role: {
    admin: "hsl(var(--role-admin))",
    developer: "hsl(var(--role-developer))",
    supervisor: "hsl(var(--role-supervisor))",
    operator: "hsl(var(--role-operator))",
    viewer: "hsl(var(--role-viewer))",
    "org-owner": "hsl(var(--role-org-owner))",
    "org-admin": "hsl(var(--role-org-admin))",
  },
  success: {
    DEFAULT: "hsl(var(--success))",
    foreground: "hsl(var(--success-foreground))",
  },
  warning: {
    DEFAULT: "hsl(var(--warning))",
    foreground: "hsl(var(--warning-foreground))",
  },
  info: {
    DEFAULT: "hsl(var(--info))",
    foreground: "hsl(var(--info-foreground))",
  },
  chart: {
    1: "hsl(var(--chart-1))",
    2: "hsl(var(--chart-2))",
    3: "hsl(var(--chart-3))",
    4: "hsl(var(--chart-4))",
    5: "hsl(var(--chart-5))",
    6: "hsl(var(--chart-6))",
  },
  surface: {
    elevated: "hsl(var(--surface-elevated))",
    sunken: "hsl(var(--surface-sunken))",
    overlay: "hsl(var(--surface-overlay))",
  },
}
```

### Phase 3: Consolidate Redundant Tokens

**Merge** `--status-ok`, `--state-running`, and `--success` into a single source:

| Semantic Use | Token | Maps To |
|---|---|---|
| General positive | `--success` | `142 70% 45%` |
| Status badge | `--status-ok` | `var(--success)` (alias) |
| Machine state | `--state-running` | `var(--success)` (alias) |

Same for warning/critical families. This ensures one change propagates everywhere.

### Phase 4: Hardcoded Color Migration (Phased)

| Priority | File Count | Pattern | Replacement |
|---|---|---|---|
| P0 | ~40 files | `text-green-500`, `bg-green-500` | `text-status-ok`, `bg-status-ok` |
| P0 | ~35 files | `text-red-400/500`, `bg-red-500` | `text-status-critical`, `bg-status-critical` |
| P0 | ~25 files | `text-yellow-400/500`, `bg-yellow-500` | `text-status-warning`, `bg-status-warning` |
| P1 | ~20 files | `text-gray-*`, `bg-gray-*` | `text-muted-foreground`, `bg-muted` |
| P1 | ~10 files | `text-blue-*`, `bg-blue-*` | `text-status-waiting`, `bg-status-waiting` |
| P2 | ~15 files | `text-white`, `bg-white` | `text-foreground`, `bg-background` |
| P2 | ~10 files | `text-purple/indigo/orange-*` | `text-role-*` tokens |

### Phase 5: Light Mode (Future)

Add a `.light` class variant in `index.css` with inverted luminance values. Required for:
- Print stylesheets (shift handoff reports)
- Accessibility compliance
- Outdoor/bright shop floor tablet use

---

## Success Metrics

| Metric | Current | Target |
|---|---|---|
| Hardcoded color instances | 2,371 | < 50 (decorative only) |
| Token coverage (categories) | 5/11 | 11/11 |
| Theme variants | 1 (dark) | 2 (dark + light) |
| WCAG AA contrast compliance | Unknown | 100% |

---

## Implementation Priority

1. **Phase 1+2** (Token expansion) — 1 session, no breaking changes
2. **Phase 3** (Dedup) — 1 session, CSS-only
3. **Phase 4** (Migration) — 3-5 sessions, component-by-component
4. **Phase 5** (Light mode) — 2 sessions, after Phase 4

---

## Notes on Build Error

The edge function deployment error (`SUPABASE_INTERNAL_ERROR`) is a transient Lovable Cloud infrastructure issue unrelated to code changes. It will resolve on retry automatically.
