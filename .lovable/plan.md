

# Flexible Naming: Remove Prescriptive Placeholders and Labels

## Problem

The platform currently uses prescriptive placeholder text and example formats that dictate how users should name their work orders, stations, and parts (e.g., "WO-2024-001", "PN-12345", "CNC-001", "Haas VF-2"). JobLine is a platform to assist tracking -- it should not impose naming conventions on users who already have their own systems.

Additionally, the station/machine field is currently **required** on the Create Work Order dialog, but per the existing memory note, station assignment should be optional to reduce onboarding friction.

## Changes

### 1. `src/components/queue/CreateWorkOrderDialog.tsx`
- **Placeholders**: Change from prescriptive examples to generic hints:
  - Work Order #: `"e.g., WO-2024-001"` → `"Enter your work order number"`
  - Part Number: `"e.g., PN-12345"` → `"Enter part number"`
  - Operation #: `"e.g., 10"` → `"Enter operation"`
  - Quantity: `"e.g., 100"` → `"Qty"`
  - Setup/FAI/Cycle placeholders: `"e.g., 30"` etc. → `"Min"` or just `"0"`
- **Label**: `"Assign to Machine"` → `"Assign to Station (Optional)"`
- **Station no longer required**: Remove the `station_id` required validation (lines 114-117). Allow submission without a station.
- **Select placeholder**: `"Select a machine..."` → `"Select a station..."`

### 2. `src/components/NewHandoffForm.tsx`
- Work Order placeholder: `"WO-2024-XXXX"` → `"Enter work order number"`
- Part Number placeholder: `"PN-XXXX-X"` → `"Enter part number"`

### 3. `src/components/JobPerformanceUpdateForm.tsx`
- Work Order placeholder: `"WO-XXXX"` → `"Enter work order number"`
- Part Number placeholder: `"PN-XXXX"` → `"Enter part number"`

### 4. `src/components/TeamStationManager.tsx`
- Station ID placeholder: `"e.g., CNC-001"` → `"Enter station ID"`
- Station Name placeholder: `"e.g., Haas VF-2"` → `"Enter display name"`
- Work Center placeholder: `"e.g., CNC Bay 1"` → `"Enter work center name"`

### 5. `src/components/TeamManagement.tsx`
- Team name placeholder: `"e.g., CNC Department"` → `"Enter team name"`
- Team description: `"e.g., All CNC mill and lathe operators"` → `"Describe this team"`

### 6. `src/components/onboarding/OrganizationSetup.tsx`
- Org name placeholder: `"e.g., Acme Manufacturing Co."` → `"Enter your organization name"`

### 7. `src/components/admin/RoutingTemplateManagement.tsx`
- Template name: `"e.g., Standard Machining"` → `"Enter template name"`
- Part pattern: `"e.g., PART-* or *-ASSY"` → `"Enter part number pattern"`

## Scope

All changes are placeholder text and label updates, plus removing the station-required validation. No database or backend changes needed.

