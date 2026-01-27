# PRD View: Operator

**Version**: 1.0  
**Last Updated**: 2025-01-27  
**Target Role**: `operator` (app_role - default for new signups)

---

## 1. Role Overview

Operators are the shop floor users who execute work orders, manage their station queue, document handoffs between shifts, and submit continuous improvement suggestions.

---

## 2. Access Matrix

| Feature Area | Access Level |
|--------------|--------------|
| **Station View** |
| View assigned station | ✅ Read |
| View station queue | ✅ Read |
| View station status | ✅ Read |
| **Work Order Execution** |
| Start work order | ✅ Write |
| Pause work order | ✅ Write |
| Complete routing step | ✅ Write |
| Update part counts | ✅ Write |
| Self-assign from queue | ✅ Write (if enabled) |
| **Handoffs** |
| Create handoff record | ✅ Write |
| View shift history | ✅ Read |
| Mark as incoming | ✅ Write |
| **Performance Updates** |
| Submit improvement | ✅ Write |
| View own submissions | ✅ Read |
| Upload images | ✅ Write |
| **Deliveries** |
| Confirm receipt | ✅ Write |
| Request pickup | ✅ Write |
| **Profile** |
| Update own profile | ✅ Write |
| Notification preferences | ✅ Write |

---

## 3. UI Entry Points

```mermaid
graph TD
    subgraph Dashboard["/dashboard - Station View"]
        D1[My Station Card] --> D1a[Current job status]
        D2[Queue Panel] --> D2a[Station-specific queue]
        D3[Quick Actions] --> D3a[Start, Pause, Complete]
    end
    
    subgraph Handoff["Shift Handoff"]
        H1[New Handoff Form] --> H1a[Job state, counts, notes]
        H2[Incoming Review] --> H2a[Acknowledge previous shift]
        H3[History] --> H3a[Past handoffs]
    end
    
    subgraph Updates["Performance Updates"]
        U1[Submit Form] --> U1a[Type, description, images]
        U2[My Submissions] --> U2a[Track status]
    end
    
    subgraph Profile["/profile"]
        P1[Personal Info]
        P2[Notifications]
        P3[My Teams]
    end
```

---

## 4. Relevant PRD Sections

| PRD | Sections | Purpose |
|-----|----------|---------|
| [01-User Roles](../01-user-roles-access-control.md) | §3.2 Operator capabilities | Role definition |
| [08-Operator Workflow](../08-operator-workflow.md) | All sections | Core workflows |
| [05-Handoff System](../05-handoff-system.md) | §3-4 Handoff creation | Shift transitions |
| [04-Work Order Queue](../04-work-order-queue.md) | §4 Status Updates | Work execution |

---

## 5. Key Workflows

### 5.1 Starting Work on a Job

```mermaid
sequenceDiagram
    participant O as Operator
    participant UI as Station Panel
    participant DB as Database
    
    O->>UI: View station queue
    UI->>DB: SELECT queue_items WHERE station_id = my_station
    DB->>UI: Return queued items
    
    O->>UI: Click "Start" on top item
    UI->>DB: UPDATE queue_items SET status = 'in_progress', started_at = now()
    UI->>DB: UPDATE work_order_routing SET status = 'in_progress', started_at = now()
    UI->>DB: UPDATE current_station_status
    UI->>O: Show active job panel
```

### 5.2 Work Order Execution Cycle

```mermaid
stateDiagram-v2
    [*] --> Queued: Job assigned to station
    Queued --> InProgress: Operator starts
    
    InProgress --> Paused: Pause with reason
    Paused --> InProgress: Resume work
    
    InProgress --> StepComplete: Complete routing step
    StepComplete --> NeedsDelivery: Next step at different station
    StepComplete --> InProgress: Continue at same station
    StepComplete --> Completed: All steps done
    
    NeedsDelivery --> [*]: Material handler takes
    Completed --> [*]
```

### 5.3 Pause Workflow

```mermaid
sequenceDiagram
    participant O as Operator
    participant UI as Active Job Panel
    participant DB as Database
    
    O->>UI: Click "Pause"
    UI->>O: Show pause reason selector
    Note over UI: Machine issue, Material shortage, Tooling change, Break, Other
    O->>UI: Select reason, add notes
    UI->>DB: INSERT pause_event
    UI->>DB: UPDATE queue_items SET status = 'on_hold'
    UI->>O: Job paused, timer stopped
    
    O->>UI: Click "Resume"
    UI->>DB: UPDATE pause_event SET ended_at = now()
    UI->>DB: UPDATE queue_items SET status = 'in_progress'
    UI->>O: Job resumed, timer continues
```

### 5.4 Completing Routing Step

```mermaid
sequenceDiagram
    participant O as Operator
    participant UI as Step Completion
    participant DB as Database
    
    O->>UI: Click "Complete Step"
    UI->>O: Show completion form
    Note over UI: Parts complete, scrap, rework, notes
    O->>UI: Enter counts, submit
    UI->>DB: UPDATE work_order_routing SET status = 'completed', completed_at = now()
    
    alt More steps at same station
        UI->>O: Show next step
    else Next step at different station
        UI->>DB: UPDATE queue_items SET needs_delivery = true
        UI->>O: "Awaiting pickup for next station"
    else All steps complete
        UI->>DB: UPDATE queue_items SET status = 'completed', completed_at = now()
        UI->>O: "Work order complete!"
    end
```

### 5.5 Shift Handoff

```mermaid
sequenceDiagram
    participant O1 as Outgoing Operator
    participant UI as Handoff Form
    participant DB as Database
    participant O2 as Incoming Operator
    
    O1->>UI: Click "Create Handoff"
    UI->>O1: Show handoff form
    Note over UI: Auto-populated: station, current job, part counts
    O1->>UI: Complete form
    Note over O1,UI: Job state, issues, material status, equipment condition
    O1->>UI: Submit
    UI->>DB: INSERT handoff_records
    UI->>DB: UPDATE current_station_status
    
    O2->>UI: View incoming handoff
    UI->>O2: Show handoff details
    O2->>UI: Acknowledge receipt
    UI->>DB: UPDATE handoff_records SET incoming_time = now()
```

### 5.6 Submitting Performance Update

```mermaid
sequenceDiagram
    participant O as Operator
    participant UI as Update Form
    participant DB as Database
    participant S as Supervisor
    
    O->>UI: Click "Submit Improvement"
    UI->>O: Show update form
    Note over O,UI: Type: process, tooling, quality, safety, efficiency
    O->>UI: Enter details
    Note over O,UI: Title, description, proposed solution, images
    O->>UI: Submit
    UI->>DB: INSERT job_performance_updates
    DB->>S: Notification: New submission
    UI->>O: "Submitted for review"
    
    Note over O: Can track status in "My Submissions"
```

---

## 6. Station Queue Interface

### 6.1 Queue Card Display

```
┌────────────────────────────────────────────────────┐
│ 🔧 CNC-001 Queue                         [3 items] │
├────────────────────────────────────────────────────┤
│ ▶ IN PROGRESS                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ WO-2024-001 | PN-12345 Rev A                   │ │
│ │ Op 20 - CNC Turning                            │ │
│ │ Qty: 25/100 complete | 🕐 2h 15m elapsed       │ │
│ │ [Pause] [Complete Step]                        │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ 📋 UP NEXT                                         │
│ ┌────────────────────────────────────────────────┐ │
│ │ 🔴 URGENT | WO-2024-002 | PN-67890            │ │
│ │ Due: Today 4:00 PM                             │ │
│ │ [Start When Ready]                             │ │
│ └────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────┐ │
│ │ 🟡 HIGH | WO-2024-003 | PN-11111              │ │
│ │ Due: Tomorrow 10:00 AM                         │ │
│ └────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

### 6.2 Active Job Panel

```
┌────────────────────────────────────────────────────┐
│ ACTIVE JOB                                   🟢    │
├────────────────────────────────────────────────────┤
│ Work Order:    WO-2024-001                         │
│ Part Number:   PN-12345 Rev A                      │
│ Operation:     20 - CNC Turning                    │
│ Quantity:      100 pcs                             │
│                                                    │
│ ┌──────────────┬──────────────┬──────────────┐    │
│ │ Complete     │ Scrap        │ Rework       │    │
│ │     25       │      2       │      1       │    │
│ │   [+] [-]    │   [+] [-]    │   [+] [-]    │    │
│ └──────────────┴──────────────┴──────────────┘    │
│                                                    │
│ Elapsed Time: 2h 15m 32s                          │
│                                                    │
│ ┌────────────────────────────────────────────────┐ │
│ │ [⏸ Pause]  [✓ Complete Step]  [📝 Add Note]  │ │
│ └────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

---

## 7. Data Access Patterns

### 7.1 Operator-Scoped Queries

```typescript
// Get operator's assigned station queue
const { data: stationQueue } = await supabase
  .from('queue_items')
  .select(`
    *,
    routing:work_order_routing(*)
  `)
  .eq('station_id', assignedStationId)
  .in('status', ['queued', 'in_progress', 'on_hold'])
  .order('priority', { ascending: false })
  .order('position');

// Get current handoff for review
const { data: incomingHandoff } = await supabase
  .from('handoff_records')
  .select('*')
  .eq('station_id', stationId)
  .is('incoming_time', null)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

### 7.2 RLS Policies

```sql
-- Operators can view their station's queue
CREATE POLICY "Operators view station queue"
ON public.queue_items
FOR SELECT
USING (
  station_id IN (
    SELECT s.id FROM stations s
    JOIN team_members tm ON s.team_id = tm.team_id
    WHERE tm.user_id = auth.uid()
  )
);

-- Operators can create handoffs for their station
CREATE POLICY "Operators create handoffs"
ON public.handoff_records
FOR INSERT
WITH CHECK (
  outgoing_operator_id = auth.uid()
  AND station_id IN (
    SELECT s.id FROM stations s
    JOIN team_members tm ON s.team_id = tm.team_id
    WHERE tm.user_id = auth.uid()
  )
);

-- Operators can submit performance updates
CREATE POLICY "Operators submit updates"
ON public.job_performance_updates
FOR INSERT
WITH CHECK (user_id = auth.uid());
```

---

## 8. Work Center Specific Fields

Different work center types show contextual fields:

| Work Center | Additional Fields |
|-------------|-------------------|
| CNC Lathe/Mill | Tool life, program number, offsets |
| Manual Machine | Setup notes, tooling list |
| Grinding | Wheel condition, coolant status |
| Welding | Wire spool level, gas pressure, amperage |
| Water Jet | Abrasive level, water pressure, nozzle wear |
| Assembly | Component checklist, torque values |
| Inspection | Measurement data, inspection report |

---

## 9. Implementation Checklist

### Station Interface
- [ ] Station card with current status
- [ ] Queue panel (station-filtered only)
- [ ] Active job panel with counters
- [ ] Start/Pause/Complete buttons

### Work Execution
- [ ] Start work order
- [ ] Pause with reason capture
- [ ] Resume from pause
- [ ] Part count updates (complete, scrap, rework)
- [ ] Routing step completion
- [ ] Delivery request on step complete

### Handoffs
- [ ] Handoff creation form
- [ ] Work center specific fields
- [ ] Incoming handoff review
- [ ] Acknowledgment flow
- [ ] History view

### Performance Updates
- [ ] Submission form with types
- [ ] Image upload
- [ ] My submissions list with status tracking
- [ ] Notification on status change

---

## 10. Related Documentation

- [User Role Architecture](../../user-role-architecture.md)
- [08-Operator Workflow PRD](../08-operator-workflow.md)
- [05-Handoff System PRD](../05-handoff-system.md)
