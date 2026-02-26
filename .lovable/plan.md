

# Remaining Prescriptive Placeholders Cleanup

## Current State

The previous round of changes updated the main `CreateWorkOrderDialog`, `NewHandoffForm`, `JobPerformanceUpdateForm`, `TeamManagement`, `OrganizationSetup`, and `RoutingTemplateManagement`. However, several prescriptive placeholders were missed across the codebase.

## Remaining Issues

### 1. `src/components/queue/CreateQueueItemDialog.tsx` (3 issues)
- **Line 233**: `"e.g., Setup and run Part #12345"` -- prescriptive title placeholder
- **Line 326**: `"e.g., 30"` (setup time) -- should be `"Min"`
- **Line 335**: `"e.g., 15"` (first article) -- should be `"Min"`
- **Line 344**: `"e.g., 5"` (cycle time) -- should be `"Min"`

### 2. `src/components/NewHandoffForm.tsx` (2 issues)
- **Line 677**: `"Rev A"` -- prescriptive revision placeholder, should be `"Enter revision"`
- **Line 686**: `"OP-XX"` -- prescriptive operation placeholder, should be `"Enter operation"`

### 3. `src/components/JobPerformanceUpdateForm.tsx` (1 issue)
- **Line 322**: `"OP-XX"` -- prescriptive operation placeholder, should be `"Enter operation"`

### 4. `src/components/TeamStationManager.tsx` (1 issue)
- **Line 195**: `"e.g., CNC Bay 1"` -- work center placeholder, should be `"Enter work center name"`

### 5. `src/components/admin/StationManagement.tsx` (1 issue)
- **Line 345**: `"e.g., CNC Mill Bay 1"` -- work center placeholder, should be `"Enter work center name"`

### 6. `src/pages/Setup.tsx` (1 issue)
- **Line 273**: Description text `"Organize your workforce into teams (e.g., Day Shift, Night Shift, Welding Team)."` -- prescriptive team name examples. Change to `"Organize your workforce into teams that match how your facility operates."`

### 7. `src/components/onboarding/OrganizationSetup.tsx` (1 issue)
- **Line 114**: Auto-created station uses hardcoded `station_id: 'STN-001'` and `work_center_type: 'Manual Mill'`. This seeds a prescriptive naming convention into new orgs. Consider changing to something more generic like `station_id: 'Station-1'` and `work_center_type` to a more generic default, or better yet, just `name: 'My First Station'`.

### Not Changed (intentionally)
- **`src/lib/mockData.ts`**: Uses `WO-`, `PN-`, `CNC-` etc. -- this is demo/sample data and is expected to use realistic examples. No change needed.
- **`src/hooks/useQueue.test.ts`**: Test data uses `WO-001`, `PN-123` -- test fixtures are fine as-is.
- **`src/components/NewHandoffForm.tsx` line 460**: Comment saying "e.g., when focused on navigation buttons" -- this is a code comment, not UI text. No change.

## Implementation

All changes are placeholder text updates. No database, backend, or logic changes required.

