# PRD: Pipeline Cleanup — Zero Errors, All Tests Pass

## Goal
Achieve a clean `npm run lint` and `npm run test` with no errors.
Priority order: highest impact, lowest effort first.

---

## Phase 1 — Test Failures (2 suites broken, blocking CI)

### 1.1 Fix `useOperatorSessions.test.ts`
- **Problem:** Hook calls `useOrgContext` but tests render without `OrgProvider`
- **Fix:** Wrap `renderHook` calls with an `OrgProvider` (mocked or minimal)
- **File:** `src/hooks/useOperatorSessions.test.ts`

### 1.2 Fix `useERPConnector.test.ts`
- **Problem:** Same provider pattern — missing context wrappers
- **Fix:** Add required providers to the render wrapper
- **File:** `src/hooks/useERPConnector.test.ts`

---

## Phase 2 — Quick Type Wins (4 errors, ~10 min)

### 2.1 Fix empty interface types
- **Problem:** `no-empty-object-type` — interface with no members
- **Files:**
  - `src/components/ui/command.tsx:24`
  - `src/components/ui/textarea.tsx:5`
- **Fix:** Replace empty `interface Foo extends Bar {}` with `type Foo = Bar`

### 2.2 Fix `require()` imports
- **Problem:** `no-require-imports`
- **Files:**
  - `tailwind.config.ts:104` — `require()` plugin call
  - `src/components/TeamManagement.test.tsx:54`
- **Fix:** Convert to ESM `import` or use `// eslint-disable-next-line` for tailwind (plugin format requires it)

---

## Phase 3 — Hook Dependency Warnings (4 warnings → potential bugs)

### 3.1 Fix missing `useCallback`/`useEffect` deps
- **Files:**
  - `src/components/BulkUploadDialog.tsx:80` — `handleFileSelect` missing from `useCallback` deps
  - `src/components/StationCard.tsx:408` — `pendingDelivery` missing from `useEffect` deps
- **Fix:** Add missing deps or restructure to avoid stale closure bugs
- **Note:** Verify logic before adding deps — stale closures here may cause real bugs

---

## Phase 4 — `no-explicit-any` (~350 errors, systematic)

Work file-by-file in this order (highest reuse/impact first):

| Priority | File | Count |
|---|---|---|
| 1 | `src/components/StationCard.tsx` | 6 |
| 2 | `src/components/TeamStationManager.tsx` | 6+ |
| 3 | `src/hooks/useERPConnector.test.ts` | 6 |
| 4 | `src/components/NewHandoffForm.tsx` | 4 |
| 5 | `src/components/InviteCodeGenerator.tsx` | 4 |
| 6 | `src/components/ShiftStats.tsx` | 4 |
| 7 | `src/hooks/useAiChatUsage.ts` | 3 |
| 8 | `src/contexts/AuthContext.tsx` | 2 |
| 9 | `supabase/functions/*` | ~15 |
| 10 | Remaining files | remainder |

**Strategy per file:**
- Use specific types from existing DB types (`Database["public"]["Tables"][...]`)
- Use `unknown` + narrowing where type is truly unknowable
- Use `// eslint-disable-next-line @typescript-eslint/no-explicit-any` only for third-party callback signatures that cannot be typed

---

## Phase 5 — `react-refresh` Warnings (~50, low risk)

### 5.1 Shadcn UI components
- **Problem:** Files export both components and constants/functions — fast refresh limitation
- **Files:** `button.tsx`, `form.tsx`, `sidebar.tsx`, `sonner.tsx`, `toggle.tsx`, `navigation-menu.tsx`, `StatusBadge.tsx`, context files
- **Fix options (pick one):**
  - Move exported constants/functions to a sibling `*.utils.ts` file
  - Add `// eslint-disable-next-line react-refresh/only-export-components` above the export
- **Recommendation:** Suppress in shadcn files (they're generated), fix in our own files (StatusBadge, context files)

---

## Acceptance Criteria

- [ ] `npm run test` — all suites pass, 0 failures
- [ ] `npm run lint` — 0 errors (warnings from shadcn may be suppressed)
- [ ] `npm run build` — clean build, no TS errors

## Out of Scope
- New features
- Refactoring beyond what is needed to fix the above errors
- Supabase Edge Function typing (Deno runtime — separate lint config needed)
