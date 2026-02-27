

## Add Product Preview Mockups to Marketing Feature Pages

### Current State
All 15 feature pages are text-only (icons, benefits lists, CTAs). The AIPlanningAssistant page is the sole exception — it renders inline `MockChatWindow` components that show realistic AI chat interactions. No screenshot images exist in the project.

### Approach
Create reusable **mock UI preview components** that render inline representations of the software, matching the pattern already established by AIPlanningAssistant. These are React components styled to look like the actual app, not image files.

### Component-to-Page Mapping

| Mock Component | Pages That Use It | What It Shows |
|---|---|---|
| `MockHandoffForm` | ShiftHandoffSoftware, ShiftHandoff, CNCOperatorTools | A mini handoff form with operator name, machine status, parts count, quality notes — filled with sample data |
| `MockStationDashboard` | MachineShopSoftware, ManufacturingOversight, ManufacturingVisibility, ProductionControl | A grid of 4 station cards showing CNC-01 (Running), LATHE-02 (Setup), MILL-03 (Idle), CNC-04 (Down) with operator, job, and status badges |
| `MockQueueBoard` | WorkOrderTracking, ProductionScheduling, DigitalExpeditor | A mini Kanban board with 3 columns (Queued, In Progress, Complete) containing sample work order cards |
| `MockDowntimeLog` | DowntimeTracking, MachineTimeTracking | A mini table showing downtime events with reason codes, durations, and resolution status |
| `MockTeamPanel` | TeamCollaboration | A mini org/team hierarchy card with roles, QR invite badge, and seat count |
| `MockQualityCard` | QualityManagement | A mini NCR card with severity, disposition, and corrective action fields |

### Implementation

#### 1. Create `src/components/marketing/MockAppPreviews.tsx`
A single file containing all 6 mock preview components. Each component:
- Uses existing UI primitives (Card, Badge, etc.)
- Has a dark "app window" chrome (title bar with dots)
- Contains static sample data (no interactivity needed)
- Is responsive and fits within the `max-w-4xl` marketing layout

#### 2. Update each feature page
Insert the appropriate mock component into the hero section (between the CTA buttons and the first content section) or between content sections. Each page gets one primary mock and optionally a secondary one.

Specific placements:
- **ShiftHandoffSoftware**: `MockHandoffForm` after hero CTAs
- **ShiftHandoff**: `MockHandoffForm` after hero CTAs
- **WorkOrderTracking**: `MockQueueBoard` after highlights grid
- **ProductionScheduling**: `MockQueueBoard` after highlights grid
- **DigitalExpeditor**: `MockStationDashboard` + `MockQueueBoard` after use cases grid
- **MachineShopSoftware**: `MockStationDashboard` after highlights grid
- **ManufacturingOversight**: `MockStationDashboard` after personas grid
- **ManufacturingVisibility**: `MockStationDashboard` after hero CTAs
- **ProductionControl**: `MockStationDashboard` after highlights grid
- **CNCOperatorTools**: `MockHandoffForm` after operator steps
- **DowntimeTracking**: `MockDowntimeLog` after feature cards
- **MachineTimeTracking**: `MockDowntimeLog` after hero CTAs
- **TeamCollaboration**: `MockTeamPanel` after feature cards
- **QualityManagement**: `MockQualityCard` after stats cards

### Technical Details

```text
MockAppPreviews.tsx structure:
  AppWindowChrome — shared wrapper with title bar dots + title text
  MockHandoffForm — operator field, status badges, parts counter, quality notes
  MockStationDashboard — 2x2 grid of station cards with status indicators
  MockQueueBoard — 3-column Kanban with 2 cards per column
  MockDowntimeLog — 4-row table with reason codes and durations
  MockTeamPanel — org hierarchy with roles and seat indicator
  MockQualityCard — NCR form with severity/disposition badges
```

Each mock uses `bg-card`, `border-border`, and the existing design tokens so it matches the dark theme of the marketing pages.

### Files to Create/Edit

| File | Action |
|---|---|
| `src/components/marketing/MockAppPreviews.tsx` | Create — all 6 mock components |
| `src/pages/features/ShiftHandoffSoftware.tsx` | Edit — add MockHandoffForm |
| `src/pages/features/ShiftHandoff.tsx` | Edit — add MockHandoffForm |
| `src/pages/features/WorkOrderTracking.tsx` | Edit — add MockQueueBoard |
| `src/pages/features/ProductionScheduling.tsx` | Edit — add MockQueueBoard |
| `src/pages/features/DigitalExpeditor.tsx` | Edit — add MockStationDashboard |
| `src/pages/features/MachineShopSoftware.tsx` | Edit — add MockStationDashboard |
| `src/pages/features/ManufacturingOversight.tsx` | Edit — add MockStationDashboard |
| `src/pages/features/ManufacturingVisibility.tsx` | Edit — add MockStationDashboard |
| `src/pages/features/ProductionControl.tsx` | Edit — add MockStationDashboard |
| `src/pages/features/CNCOperatorTools.tsx` | Edit — add MockHandoffForm |
| `src/pages/features/DowntimeTracking.tsx` | Edit — add MockDowntimeLog |
| `src/pages/features/MachineTimeTracking.tsx` | Edit — add MockDowntimeLog |
| `src/pages/features/TeamCollaboration.tsx` | Edit — add MockTeamPanel |
| `src/pages/features/QualityManagement.tsx` | Edit — add MockQualityCard |

