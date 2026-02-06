
# JobLine_Setup_Template.xlsx Review and Enhancement

## Current State Analysis

### Existing Template Sheets (4 sheets)
| Sheet | Fields | Status |
|-------|--------|--------|
| **Stations** | Station ID, Station Name, Work Center, Work Center Type, Team Name, Department, Active | Good - aligns with DB |
| **Users** | Email, Display Name, Role, Team Name, Department | Good - aligns with roles |
| **Teams** | Team Name, Description, Departments | Good - basic coverage |
| **Routing Templates** | Template Name, Part Number Pattern, Step #, Operation Name, Type, Work Center, Est. Duration, Vendor, Instructions | Good - comprehensive |

### Missing Sheets (Critical for Full Onboarding)
1. **Work Orders** - No bulk import capability for queue_items
2. **Departments** - Departments are referenced but not imported as separate entities
3. **Equipment** - Organization equipment tracking not included

---

## Recommended Enhancements

### 1. Add New "Work Orders" Sheet

This is the most critical missing piece. Users should be able to bulk-import work orders to jumpstart their digital expeditor.

**Proposed Fields:**
| Column | Required | Valid Values | Maps To |
|--------|----------|--------------|---------|
| Work Order # | Yes | Text | `work_order` |
| Title | Yes | Text | `title` |
| Part Number | No | Text | `part_number` |
| Operation Number | No | Text | `operation_number` |
| Quantity | No | Number | `quantity` |
| Priority | No | low/normal/high/urgent/critical | `priority` |
| Status | No | pending/queued/in_progress/on_hold | `status` |
| Station ID (optional) | No | Text (must match) | `station_id` (lookup) |
| Team Name (optional) | No | Text (must match) | `team_id` (lookup) |
| Due Date | No | Date (YYYY-MM-DD) | `due_date` |
| Estimated Duration (min) | No | Number | `estimated_duration` |
| Tags (comma-separated) | No | Text | `tags` |
| Description | No | Text | `description` |

### 2. Add New "Departments" Sheet

Departments are frequently referenced in Stations and Users but cannot be created via bulk upload.

**Proposed Fields:**
| Column | Required | Valid Values | Maps To |
|--------|----------|--------------|---------|
| Department Name | Yes | Text | `name` |
| Team Name | Yes | Text (must exist) | `team_id` (lookup) |
| Description | No | Text | `description` |

### 3. Enhance Existing Sheets

#### Stations Sheet Enhancements
- Add optional **Routing Template** column to auto-apply templates to stations

#### Users Sheet Enhancements  
- Add **Team Role** column (owner/admin/member) to specify team-level role
- Add **Org Role** column (owner/admin/member) to specify organization-level role

#### Teams Sheet Enhancements
- Add **Shift Schedule** column (optional) for shift information

### 4. Add "Instructions" Sheet

A new sheet with instructions and tips for filling out each sheet, including:
- Required vs optional fields explanation
- Valid values for dropdown-like fields
- Tips for mapping stations to teams
- How to reference other sheets (e.g., Team Name must match exactly)

---

## Technical Implementation

### Files to Modify

**1. `src/lib/excelTemplates.ts`**
- Add `WORK_ORDERS_TEMPLATE` constant with new sheet structure
- Add `DEPARTMENTS_TEMPLATE` constant
- Update `USERS_TEMPLATE` to include team role and org role columns
- Add `INSTRUCTIONS_TEMPLATE` for the helper sheet
- Update `downloadTemplate` function to include new sheets
- Add `parseWorkOrdersSheet` function
- Add `parseDepartmentsSheet` function
- Update `ParsedExcelData` interface to include work orders and departments

**2. `src/hooks/useBulkUpload.ts`**
- Add work order creation logic with station/team lookups
- Add department creation logic with team lookups
- Update progress tracking for new entity types
- Update `UploadResult` interface to include work orders and departments created counts

**3. `src/components/BulkUploadDialog.tsx`**
- Add tabs/preview for work orders and departments
- Add routing template download button if needed
- Update summary cards to show work orders and departments

---

## Sample Data for New Sheets

### Work Orders Sample Data
```
Work Order #    | Title                    | Part Number | Op# | Qty | Priority | Status  | Station ID | Team Name      | Due Date
WO-2024-001     | Bracket Assembly         | BRK-1234    | 10  | 50  | normal   | pending | CNC-001    | Day Shift Team | 2024-03-15
WO-2024-002     | Housing Machining        | HSG-5678    | 20  | 25  | high     | queued  | LATHE-001  | Night Shift    | 2024-03-12
WO-2024-003     | Cover Plate Inspection   | CVR-9012    | 30  | 100 | normal   | pending | INSP-001   |                | 2024-03-20
WO-2024-004     | Shaft Grinding           | SFT-3456    | 40  | 10  | urgent   | pending |            | Welding Team   | 2024-03-10
```

### Departments Sample Data
```
Department Name | Team Name      | Description
Machining       | Day Shift Team | CNC milling and lathe operations
Fabrication     | Welding Team   | Welding and sheet metal work
Quality         | Quality Team   | Inspection and QC operations
Shipping        | Day Shift Team | Packaging and logistics
Assembly        | Day Shift Team | Final assembly and hardware installation
```

---

## Processing Order (Updated)

The bulk upload must process data in this sequence to satisfy foreign key relationships:

```text
1. Teams         (no dependencies)
2. Departments   (depends on Teams)
3. Stations      (depends on Teams, optionally Departments)
4. Users         (depends on Teams - for team assignment)
5. Work Orders   (depends on Teams, Stations)
6. Routing       (depends on Work Orders for queue_item_id)
```

---

## Validation Improvements

### Cross-Sheet Validation
- Warn if Station references a Team that doesn't exist in Teams sheet
- Warn if Department references a Team that doesn't exist
- Warn if Work Order references a Station that doesn't exist
- Auto-suggest matches for near-misses (fuzzy matching)

### Data Quality Checks
- Duplicate detection (same Work Order #, Station ID, Team Name)
- Date format validation for Due Date
- Numeric validation for Quantity and Duration

---

## UI/UX Improvements

### Enhanced Preview
- Show relationship warnings (e.g., "Work Order WO-001 references Station CNC-999 which was not found")
- Color-code matched vs unmatched references
- Show import order with arrows (Teams → Depts → Stations → Users → Work Orders)

### Download Options
- "Complete Setup Template" - All sheets with sample data
- "Work Orders Only" - Just work order import template
- "Departments Only" - Just departments template
- Keep existing individual templates (Stations, Users, Teams, Routing)

---

## Testing Requirements

After implementation:
- Test upload with all sheets populated
- Test upload with only some sheets (e.g., just work orders)
- Verify cross-sheet references are resolved correctly
- Verify existing entities are skipped with warnings
- Test with real manufacturing data patterns
