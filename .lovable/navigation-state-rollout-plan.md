# Navigation-State Persistence — Rollout Plan

Goal: the browser Back button should always restore the exact view the
user was in — filters, tabs, pagination, scroll position, and unsaved
form drafts — across every authenticated surface of the app.

## Primitives already shipped

| File | Purpose |
| --- | --- |
| `src/lib/navigationMemory.ts` | sessionStorage-backed scroll memory keyed by `history.state.key`. Disables the browser's built-in scroll restore so ours is authoritative. |
| `src/components/ScrollToTop.tsx` | Saves outgoing scroll on every nav; on **POP** restores; on **PUSH/REPLACE** scrolls to top. Mounted globally in `App.tsx`. |
| `src/hooks/useUrlState.ts` | `useUrlState<T>(key, default)` + `useUrlStateNumber(key, default)` — typed URL-search-param state. Strips defaults from the URL automatically. |
| `src/hooks/useDraftPersistence.ts` | Debounced sessionStorage draft hook keyed by a stable string. Returns `[value, set, { clear, hasDraft }]`. |

## Completed surfaces

- **Public blog (`/blog`)** — category filter now lives in `?category=…`. Deep-linkable and Back-restorable.
- **Admin → Blog editor (`BlogAdmin`)** — `editingPost` persisted to sessionStorage on every change. On mount, an unsaved "new post" draft auto-reopens the dialog with a "Draft restored" banner and a Discard button. Drafts clear on successful Save only.

## Pending rollout (priority order)

### Phase 1 — High-traffic admin / operator surfaces

| Surface | URL state to lift | Draft persistence | Notes |
| --- | --- | --- | --- |
| Work Order Queue (`/queue`) | `view` (kanban/list/calendar), `station`, `status`, `q`, `page`, `tab` | — | Some keys already present — align the rest via `useUrlState`. |
| Work Order Create / Edit (`/work-orders/new`, `/work-orders/:id/edit`) | — | `wo:new`, `wo:${id}` for all form fields | Clear on submit success. |
| Work Order History (`/work-orders/cancelled`, `/work-orders/history`) | `status`, `from`, `to`, `q`, `page`, `sort` | — | Mirror Queue conventions. |
| Teams & Members (`/teams`) | `tab` (teams / members / invites) | — | Currently local `useState` — swap. |
| Admin panel (`/admin`) | top-level `tab`, nested panel `subtab` | — | Many tabs nested; keep keys short (e.g. `tab=library&sub=tools`). |
| Operator Station Dashboard | `station`, `view`, expanded WO | — | Already partly deep-linked — finish via `useUrlState`. |
| Dashboard → Machine Detail → WO Detail | scroll memory (already covered) | — | Verify nothing remounts on hash changes. |

### Phase 2 — Reporting / analytics

| Surface | URL state | Notes |
| --- | --- | --- |
| Production Analytics | `range`, `shift`, `station`, `metric` | All Recharts filters via `useUrlState`. |
| Notifications | `tab`, `filter`, `read` | Make filters bookmarkable. |
| NCR / Quality | `status`, `assignee`, `severity`, `page` | |

### Phase 3 — Editors / long-form forms

| Surface | Draft key | Notes |
| --- | --- | --- |
| NCR create | `ncr:new` | Multi-step form — persist per step. |
| Handoff form | `handoff:${stationId}` | Already auto-saves draft — fold into `useDraftPersistence` for consistency. |
| Profile editor | `profile:${userId}` | Avoid persisting sensitive PII; whitelist fields. |
| Org settings forms | `org-settings:${section}` | |

### Phase 4 — Talent / public

| Surface | URL state |
| --- | --- |
| `/talent` search | `q`, `skill`, `location`, `page`, `sort` |
| `/handbook` index | `category`, `q` |
| `/resources` index | `topic`, `q` |

## Implementation pattern (per page)

1. Identify every `useState` whose value is a **user-chosen filter / tab /
   pagination / sort / search term**.
2. Replace with `useUrlState("key", default)` (or `useUrlStateNumber`).
3. For **derived defaults** (e.g. role-based default tab), keep the default
   argument deterministic so the URL stays clean when unchanged.
4. For form editors, wrap the form value in `useDraftPersistence` keyed by a
   stable id. Always call `clear()` after successful submit.
5. **Do not** lift transient UI state (hover, open menu, focus) into the URL.

## End-to-end test strategy

A shared spec template covers each surface:

```ts
// e2e/nav-state-<surface>.spec.ts
test("filter persists in URL", ...)
test("deep link pre-selects filter", ...)
test("Back from detail restores filter + scroll", ...)
test("draft survives accidental refresh (editor only)", ...)
```

Shipped now:
- `e2e/nav-state-blog.spec.ts` — public blog filter + scroll restore.

To add per phase (one spec per surface):
- `nav-state-queue.spec.ts`
- `nav-state-work-order-edit.spec.ts` (draft persistence)
- `nav-state-teams.spec.ts`
- `nav-state-admin-tabs.spec.ts`
- `nav-state-analytics.spec.ts`
- `nav-state-talent-search.spec.ts`

Each spec uses the existing Playwright auth helpers in `e2e/helpers/auth.ts`
and runs against the preview build. Add them to the matrix in
`e2e/helpers/roleMatrix.ts` so the relevant role exercises the flow.

## Acceptance criteria

A surface is "done" when:

1. Every filter / tab / pagination / sort / search key appears in the URL
   when non-default, and is absent when default.
2. Refreshing the page produces the **same** rendered state.
3. Browser Back from a child detail restores both the URL state AND the
   scroll position (within ±50px tolerance).
4. Form editors restore unsaved drafts on accidental refresh; drafts clear
   only on explicit Save success or a user-triggered Discard action.
5. A dedicated `nav-state-<surface>.spec.ts` passes in CI.

## Out of scope

- Cross-tab synchronization (would require `BroadcastChannel` — defer).
- Server-side session-restore for hard refreshes that lose `sessionStorage`
  (rare; would require a per-user "last view" Supabase table — defer).
- Animated scroll restoration (we use `behavior: "instant"` intentionally
  to avoid jank on slow devices).
