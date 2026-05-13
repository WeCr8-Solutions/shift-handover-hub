# E2E Gap Report Summary

**Generated:** 2026-05-13T21:44:31.822Z
**Total gaps:** 19 — 0 error / 19 warn / 0 info

## Critical failures (0)
Auth bounces, RLS leaks, dead-end routes — fix first.
_None_

## Functional blockers (0)
Errors that break a core user task.
_None_

## Warnings & concerns (19)
- **regression › console.error** [other] — 404 Error: User attempted to access non-existent route: /this-route-does-not-exist-99999
  - URL: `https://joblineai.lovable.app/this-route-does-not-exist-99999`
- **usability › nav-links /** [missing_ui] — Page has no nav/header links
  - URL: `https://joblineai.lovable.app/`
- **usability › nav-links /handbook** [missing_ui] — Page has no nav/header links
  - URL: `https://joblineai.lovable.app/handbook`
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
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /this-route-definitely-does-not-exist-12345
  - URL: `https://joblineai.lovable.app/this-route-definitely-does-not-exist-12345`

## Console / network issues (2)
- **regression › console.error** [other] — 404 Error: User attempted to access non-existent route: /this-route-does-not-exist-99999
  - URL: `https://joblineai.lovable.app/this-route-does-not-exist-99999`
- **usability › console.error** [other] — 404 Error: User attempted to access non-existent route: /this-route-definitely-does-not-exist-12345
  - URL: `https://joblineai.lovable.app/this-route-definitely-does-not-exist-12345`

## Routes touched (15)
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
- `/this-route-does-not-exist-99999`

## Categories
- **missing_ui**: 17
- **other**: 2
