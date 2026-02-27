

## End-to-End Testing Audit & Gap Analysis

### Current Test Coverage

**Unit Tests (useTestRunner - 20 suites, ~137 tests)**: Covers UI components, hooks, queue system, dashboard, forms, utilities, and org-scope integration. These are **simulated** — the test runner doesn't actually execute vitest; it generates mock pass results.

**Process Tests (useProcessTests - 7 suites, ~40 real tests)**: Live database tests for routing validation, work order flow, DB accessibility, manufacturing process, RLS/security, autofill/user context, and quote-to-ship routing. These actually query the database.

**Role & Scope Tests (RoleScopeTestRunner - 5 suites, ~20+ real tests)**: Live tests for platform roles, org roles, team roles, scope isolation, and profile visibility.

### Missing Test Coverage for AI-Aware Context

None of the following AI capabilities have any tests:

| Feature | Test Coverage |
|---|---|
| Part Specs (material, dimensions, weight, shape) | **None** |
| Tolerance & Surface Finish fields | **None** |
| Part Catalog CRUD | **None** |
| Part Catalog auto-fill in work orders | **None** |
| Station machine profiles (manual entry) | **None** |
| Station machine assignments (verified library) | **None** |
| AI context: machine envelope validation | **None** |
| AI context: station queue load | **None** |
| AI context: operator certifications | **None** |
| AI context: downtime awareness | **None** |
| AI context: setup/cycle/first article time | **None** |
| AI Planning Assistant edge function | **None** |
| AI usage limits (daily caps) | **None** |

### Implementation Plan

#### 1. Add AI Context Process Tests to useProcessTests
Add a new test suite `"AI Context & Part Specs"` with live database tests:
- Part catalog table is accessible and org-scoped
- Queue items with part specs (material_type, dimensions, weight, shape) are queryable
- Tolerance and surface_finish fields exist and are queryable on queue_items
- Station machine profiles table is accessible
- Station machine assignments table is accessible
- Downtime events table is accessible and filterable by `ended_at IS NULL`
- Certifications table is accessible
- Work order routing includes setup_time, cycle_time, first_article fields
- AI chat usage tracking table is accessible

#### 2. Add AI Edge Function Test to useProcessTests
Add tests under `"AI Planning Assistant"` suite:
- AI planning assistant edge function responds to authenticated requests
- AI planning assistant rejects unauthenticated requests
- AI planning assistant rejects requests without organization_id

#### 3. Add Part Specs Unit Tests
Create `src/components/queue/PartSpecsSection.test.tsx`:
- Renders material type dropdown with correct options
- Renders shape dropdown with correct options
- Renders tolerance and surface finish dropdowns
- Part catalog search input renders
- Auto-fill populates fields from catalog selection

#### 4. Add Part Catalog Unit Tests
Create `src/components/settings/PartCatalogManager.test.tsx`:
- Renders create form
- Validates required fields (part_number)
- Displays catalog entries

#### 5. Update useTestRunner Registry
Add the new test files to `testFileRegistry` so they appear in the Testing Dashboard.

#### 6. Verify via Screenshots
After implementation, navigate to `/testing` and run:
- Process Tests tab → verify AI Context suite passes
- Unit Tests tab → verify new Part Specs and Part Catalog suites appear
- Roles & Scope tab → verify existing tests still pass

### Technical Details
- New process tests go in `src/hooks/useProcessTests.ts` as a new `aiContextTests` array added to `allTestSuites`
- New unit test files follow existing patterns using vitest + testing-library
- Edge function test calls `supabase.functions.invoke("ai-planning-assistant")` with/without auth
- All new tests are real (not simulated) — they query actual database state

