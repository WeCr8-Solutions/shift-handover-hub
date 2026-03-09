

## Plan: Ensure `useOrgContext` is utilized in all org-scoped hooks

### Audit Results

After reviewing all 47+ hooks in `src/hooks`, here are the hooks that query org-scoped tables but **do not** use `useOrgContext` for tenant filtering:

#### Hooks Needing `useOrgContext` Integration

1. **`useJobPerformanceUpdates.ts`** — Queries `job_performance_updates` without org filter in `fetchUpdates`. Also manually queries `organization_members` to get org_id for inserts instead of using context.
   - **Fix**: Import `useOrgContext`, filter `fetchUpdates` by `organization_id`, use `organization.id` in `createUpdate` instead of the manual lookup.

2. **`useGlobalUpdates.ts`** — Queries `global_updates` with no org filter. This is a platform-level table (admin-only), but `createUpdate` and `editUpdate` don't scope to org.
   - **Assessment**: This is intentionally platform-scoped (admin changelog). **No change needed** — global updates are visible to all users by design.

3. **`useMyIssues.ts`** — Queries `issues` filtered by `reporter_id` only.
   - **Assessment**: Already user-scoped (own issues only). **No change needed**.

4. **`useIssueDetail.ts`** — Queries single issue by ID.
   - **Assessment**: Single-record lookup by primary key, RLS handles access. **No change needed**.

5. **`useDimensions.ts`** — Queries `routing_step_dimensions` and `dimension_readings` by `routing_step_id`.
   - **Assessment**: Already scoped by routing step (child of org-scoped work order). **No change needed**.

6. **`useDimensionRequests.ts`** — Queries `dimension_check_requests` by `routing_step_id` or `queue_item_id`.
   - **Assessment**: Already scoped by parent entity. **No change needed**.

7. **`useSetupSheets.ts`** — Queries `setup_sheets` by `routing_step_id`.
   - **Assessment**: Already scoped by parent entity; inserts require explicit `organization_id`. **No change needed**.

8. **`useProcessTests.ts`** — Database queries use `.limit(1)` for accessibility checks only.
   - **Assessment**: Test harness, not production data retrieval. **No change needed**.

9. **`useNotificationPrefs.ts`** — Queries `notification_preferences` by `user_id`.
   - **Assessment**: User-scoped, not org-scoped. **No change needed**.

10. **`useOnboarding.ts`** — Stores progress per user.
    - **Assessment**: User-scoped. **No change needed**.

### Changes Required

Only **1 hook** needs modification:

#### `useJobPerformanceUpdates.ts`
- Import `useOrgContext` from `@/contexts/OrgContext`
- Add `organization_id` filter to `fetchUpdates` query
- Replace manual org_id lookup in `createUpdate` with `organization.id` from context
- Replace manual org_id lookup in `uploadImage` with `organization.id` from context
- Add `organization?.id` to the `useCallback` dependency arrays

### Technical Details

```text
useJobPerformanceUpdates.ts changes:
  1. Add import: useOrgContext from "@/contexts/OrgContext"
  2. Add: const { organization } = useOrgContext();
  3. fetchUpdates: add .eq("organization_id", organization.id) when org exists
  4. createUpdate: replace org_members lookup with organization.id
  5. uploadImage: replace org_members lookup with organization.id
```

