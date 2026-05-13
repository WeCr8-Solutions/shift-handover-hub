# E2E Gap Report Summary

**Generated:** 2026-05-13T21:34:11.027Z
**Total gaps:** 42 — 16 error / 26 warn / 0 info

## Critical failures (16)
Auth bounces, RLS leaks, dead-end routes — fix first.
- **usability › guard /work-orders** [auth] — Guarded route did not redirect anon user to /auth
  - URL: `https://joblineai.lovable.app/work-orders`
  - Fix: Wrap /work-orders in <RequireAuth> in src/App.tsx.
- **usability › guard /work-orders** [dead_end] — Anon user lands on 404 instead of auth bounce
  - URL: `https://joblineai.lovable.app/work-orders`
- **usability › guard /work-orders/completed** [auth] — Guarded route did not redirect anon user to /auth
  - URL: `https://joblineai.lovable.app/work-orders/completed`
  - Fix: Wrap /work-orders/completed in <RequireAuth> in src/App.tsx.
- **usability › guard /work-orders/completed** [dead_end] — Anon user lands on 404 instead of auth bounce
  - URL: `https://joblineai.lovable.app/work-orders/completed`
- **usability › guard /work-orders/cancelled** [auth] — Guarded route did not redirect anon user to /auth
  - URL: `https://joblineai.lovable.app/work-orders/cancelled`
  - Fix: Wrap /work-orders/cancelled in <RequireAuth> in src/App.tsx.
- **usability › guard /work-orders/cancelled** [dead_end] — Anon user lands on 404 instead of auth bounce
  - URL: `https://joblineai.lovable.app/work-orders/cancelled`
- **usability › guard /work-orders/on-hold** [auth] — Guarded route did not redirect anon user to /auth
  - URL: `https://joblineai.lovable.app/work-orders/on-hold`
  - Fix: Wrap /work-orders/on-hold in <RequireAuth> in src/App.tsx.
- **usability › guard /work-orders/on-hold** [dead_end] — Anon user lands on 404 instead of auth bounce
  - URL: `https://joblineai.lovable.app/work-orders/on-hold`
- **usability › guard /work-orders** [auth] — Guarded route did not redirect anon user to /auth
  - URL: `https://joblineai.lovable.app/work-orders`
  - Fix: Wrap /work-orders in <RequireAuth> in src/App.tsx.
- **usability › guard /work-orders** [dead_end] — Anon user lands on 404 instead of auth bounce
  - URL: `https://joblineai.lovable.app/work-orders`
- **usability › guard /work-orders/completed** [auth] — Guarded route did not redirect anon user to /auth
  - URL: `https://joblineai.lovable.app/work-orders/completed`
  - Fix: Wrap /work-orders/completed in <RequireAuth> in src/App.tsx.
- **usability › guard /work-orders/completed** [dead_end] — Anon user lands on 404 instead of auth bounce
  - URL: `https://joblineai.lovable.app/work-orders/completed`
- **usability › guard /work-orders/cancelled** [auth] — Guarded route did not redirect anon user to /auth
  - URL: `https://joblineai.lovable.app/work-orders/cancelled`
  - Fix: Wrap /work-orders/cancelled in <RequireAuth> in src/App.tsx.
- **usability › guard /work-orders/cancelled** [dead_end] — Anon user lands on 404 instead of auth bounce
  - URL: `https://joblineai.lovable.app/work-orders/cancelled`
- **usability › guard /work-orders/on-hold** [auth] — Guarded route did not redirect anon user to /auth
  - URL: `https://joblineai.lovable.app/work-orders/on-hold`
  - Fix: Wrap /work-orders/on-hold in <RequireAuth> in src/App.tsx.
- **usability › guard /work-orders/on-hold** [dead_end] — Anon user lands on 404 instead of auth bounce
  - URL: `https://joblineai.lovable.app/work-orders/on-hold`

## Functional blockers (0)
Errors that break a core user task.
_None_

## Warnings & concerns (26)
- **usability › nav-links /** [missing_ui] — Page has no nav/header links
  - URL: `https://joblineai.lovable.app/`
- **usability › nav-links /handbook** [missing_ui] — Page has no nav/header links
  - URL: `https://joblineai.lovable.app/handbook`
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /work-orders
  - URL: `https://joblineai.lovable.app/work-orders`
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /work-orders/completed
  - URL: `https://joblineai.lovable.app/work-orders/completed`
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /work-orders/cancelled
  - URL: `https://joblineai.lovable.app/work-orders/cancelled`
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /work-orders/on-hold
  - URL: `https://joblineai.lovable.app/work-orders/on-hold`
- **usability › mobile /** [missing_ui] — No mobile menu or interactive element visible
  - URL: `https://joblineai.lovable.app/`
  - Fix: Verify Header renders mobile hamburger menu.
- **usability › nav-links /** [missing_ui] — Page has no nav/header links
  - URL: `https://joblineai.lovable.app/`
- **usability › mobile /pricing** [missing_ui] — No mobile menu or interactive element visible
  - URL: `https://joblineai.lovable.app/pricing`
  - Fix: Verify Header renders mobile hamburger menu.
- **usability › mobile /talent** [missing_ui] — No mobile menu or interactive element visible
  - URL: `https://joblineai.lovable.app/talent`
  - Fix: Verify Header renders mobile hamburger menu.
- **usability › mobile /talent/browse** [missing_ui] — No mobile menu or interactive element visible
  - URL: `https://joblineai.lovable.app/talent/browse`
  - Fix: Verify Header renders mobile hamburger menu.
- **usability › mobile /oap** [missing_ui] — No mobile menu or interactive element visible
  - URL: `https://joblineai.lovable.app/oap`
  - Fix: Verify Header renders mobile hamburger menu.
- **usability › mobile /gcode-academy** [missing_ui] — No mobile menu or interactive element visible
  - URL: `https://joblineai.lovable.app/gcode-academy`
  - Fix: Verify Header renders mobile hamburger menu.
- **usability › mobile /handbook** [missing_ui] — No mobile menu or interactive element visible
  - URL: `https://joblineai.lovable.app/handbook`
  - Fix: Verify Header renders mobile hamburger menu.
- **usability › nav-links /handbook** [missing_ui] — Page has no nav/header links
  - URL: `https://joblineai.lovable.app/handbook`
- **usability › mobile /resources** [missing_ui] — No mobile menu or interactive element visible
  - URL: `https://joblineai.lovable.app/resources`
  - Fix: Verify Header renders mobile hamburger menu.
- **usability › mobile /resources/glossary** [missing_ui] — No mobile menu or interactive element visible
  - URL: `https://joblineai.lovable.app/resources/glossary`
  - Fix: Verify Header renders mobile hamburger menu.
- **usability › mobile /resources/gcode** [missing_ui] — No mobile menu or interactive element visible
  - URL: `https://joblineai.lovable.app/resources/gcode`
  - Fix: Verify Header renders mobile hamburger menu.
- **usability › mobile /auth** [missing_ui] — No mobile menu or interactive element visible
  - URL: `https://joblineai.lovable.app/auth`
  - Fix: Verify Header renders mobile hamburger menu.
- **usability › mobile /shift-handoff** [missing_ui] — No mobile menu or interactive element visible
  - URL: `https://joblineai.lovable.app/shift-handoff`
  - Fix: Verify Header renders mobile hamburger menu.
- **usability › mobile /manufacturing-visibility** [missing_ui] — No mobile menu or interactive element visible
  - URL: `https://joblineai.lovable.app/manufacturing-visibility`
  - Fix: Verify Header renders mobile hamburger menu.
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /work-orders
  - URL: `https://joblineai.lovable.app/work-orders`
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /work-orders/completed
  - URL: `https://joblineai.lovable.app/work-orders/completed`
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /work-orders/cancelled
  - URL: `https://joblineai.lovable.app/work-orders/cancelled`
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /work-orders/on-hold
  - URL: `https://joblineai.lovable.app/work-orders/on-hold`
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /this-route-definitely-does-not-exist-12345
  - URL: `https://joblineai.lovable.app/this-route-definitely-does-not-exist-12345`

## Console / network issues (9)
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /work-orders
  - URL: `https://joblineai.lovable.app/work-orders`
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /work-orders/completed
  - URL: `https://joblineai.lovable.app/work-orders/completed`
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /work-orders/cancelled
  - URL: `https://joblineai.lovable.app/work-orders/cancelled`
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /work-orders/on-hold
  - URL: `https://joblineai.lovable.app/work-orders/on-hold`
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /work-orders
  - URL: `https://joblineai.lovable.app/work-orders`
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /work-orders/completed
  - URL: `https://joblineai.lovable.app/work-orders/completed`
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /work-orders/cancelled
  - URL: `https://joblineai.lovable.app/work-orders/cancelled`
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /work-orders/on-hold
  - URL: `https://joblineai.lovable.app/work-orders/on-hold`
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /this-route-definitely-does-not-exist-12345
  - URL: `https://joblineai.lovable.app/this-route-definitely-does-not-exist-12345`

## Routes touched (18)
- `/`
- `/auth`
- `/gcode-academy`
- `/handbook`
- `/manufacturing-visibility`
- `/oap`
- `/pricing`
- `/resources`
- `/resources/gcode`
- `/resources/glossary`
- `/shift-handoff`
- `/talent`
- `/talent/browse`
- `/this-route-definitely-does-not-exist-12345`
- `/work-orders`
- `/work-orders/cancelled`
- `/work-orders/completed`
- `/work-orders/on-hold`

## Categories
- **missing_ui**: 17
- **other**: 9
- **auth**: 8
- **dead_end**: 8
