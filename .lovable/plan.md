

## Machine Library Admin Panel for SDK Admins & Developers

### What We're Building

A full CRUD management panel for the 79 verified machine profiles in the `verified_machine_library` table. This panel lives in the Admin Dashboard's Dev Tools bucket and allows platform admins/developers to:

- Browse all library entries with search/filter by manufacturer, machine type
- View full specs for any entry (travel, envelope, capabilities, tolerances)
- Edit verified numbers inline (dimensions, weights, tolerances, boolean capabilities)
- Add new machine profiles to the library
- Delete entries (with purchase protection — cannot delete if purchased)
- See purchase stats (how many orgs purchased each profile)
- Toggle verified status
- View revenue metrics (total purchases at $0.99 each)

### Implementation

#### 1. New Component: `MachineLibraryManagement`
**File**: `src/components/admin/MachineLibraryManagement.tsx`

Full-featured admin panel with:
- **Stats bar**: Total machines, total purchases, revenue estimate
- **Filterable table**: Manufacturer, model, type, platform, travel specs, capabilities, verified badge, purchase count
- **Search**: By manufacturer or model name
- **Filter dropdowns**: By manufacturer, machine type
- **Add Machine dialog**: Form with all 27 fields grouped into sections (Identity, Travel/Envelope, Capabilities, Materials, Tolerances)
- **Edit Machine dialog**: Same form, pre-populated with existing values
- **Delete button**: Disabled if the machine has active purchases (shows tooltip explaining why)
- **Purchase count column**: Shows how many orgs have purchased each profile

The component queries `verified_machine_library` and `organization_machine_purchases` using the existing Supabase client with `as any` casts (matching existing patterns).

#### 2. Add Tab to Admin Dashboard
**File**: `src/pages/Admin.tsx`

Add a "Library" tab trigger inside the Dev Tools bucket (destructive/red border group) with a `Cpu` icon. Add corresponding `TabsContent` rendering `<MachineLibraryManagement />`. Only visible when `hasTestingAccess` is true (admin/developer only).

#### 3. No Database Changes Needed
- RLS already allows `is_dev_or_admin` for ALL operations on `verified_machine_library`
- Table schema already has all needed columns
- `update_updated_at_column` trigger already exists

### Technical Details

- Uses existing `MANUFACTURERS` and `MACHINE_TYPES` constants from `useStationMachineProfile.ts` for dropdowns
- Material capability stored as `text[]` — UI uses multi-select checkboxes for common materials
- `hard_constraints` stored as `jsonb[]` — editable as JSON
- Purchase count derived from `organization_machine_purchases` grouped by `machine_library_id`
- Revenue display: purchase count × $0.99
- All mutations use service-authenticated Supabase calls (RLS enforces admin-only writes)

