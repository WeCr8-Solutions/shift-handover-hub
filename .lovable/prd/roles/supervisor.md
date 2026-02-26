# PRD View: Supervisor

**Version**: 1.0  
**Last Updated**: 2025-01-27  
**Target Role**: `supervisor` (app_role)

---

## 1. Role Overview

Supervisors oversee production workflows, manage team assignments, review performance updates, and coordinate the digital expeditor system. They bridge management and shop floor operations.

---

## 2. Access Matrix

| Feature Area | Access Level |
|--------------|--------------|
| **Dashboard** |
| View all org stations | ✅ Read |
| View station status | ✅ Read |
| View production metrics | ✅ Read |
| **Queue Management** |
| View organization queue | ✅ Read |
| Create work orders | ✅ Write |
| Edit work orders | ✅ Write |
| Assign to operators | ✅ Write |
| Reprioritize queue | ✅ Write |
| **Routing** |
| Apply routing to WO | ✅ Write |
| Modify active routing | ✅ Write |
| Create templates | ✅ Write |
| **Performance Updates** |
| Review submissions | ✅ Read/Write |
| Approve/reject | ✅ Write |
| Assign for implementation | ✅ Write |
| **Delivery Coordination** |
| View all deliveries | ✅ Read |
| Override delivery status | ✅ Write |
| **Handoffs** |
| View all team handoffs | ✅ Read |
| Review/acknowledge | ✅ Write |
| **Invite Codes** |
| Generate for team | ✅ Write |
| Manage own invites | ✅ Write |

---

## 3. UI Entry Points

```mermaid
graph TD
    subgraph Dashboard["/dashboard"]
        D1[Station Grid] --> D1a[All stations status]
        D2[Alerts Panel] --> D2a[Machine down, delays]
        D3[Metrics Cards] --> D3a[Production stats]
    end
    
    subgraph Queue["/queue"]
        Q1[Kanban View] --> Q1a[Drag-drop priority]
        Q2[List View] --> Q2a[Bulk operations]
        Q3[Calendar View] --> Q3a[Schedule view]
        Q4[Filters] --> Q4a[Station, status, priority]
    end
    
    subgraph Admin["/admin"]
        A1[Performance Updates] --> A1a[Review queue]
        A2[Team Oversight] --> A2a[Monitor teams]
    end
    
    subgraph Expeditor["Digital Expeditor"]
        E1[Production Overview] --> E1a[Active, delayed, complete]
        E2[Attention Required] --> E2a[Bottlenecks, issues]
        E3[Station Map] --> E3a[Real-time status]
    end
```

---

## 4. Relevant PRD Sections

| PRD | Sections | Purpose |
|-----|----------|---------|
| [01-User Roles](../01-user-roles-access-control.md) | §3.2 Supervisor capabilities | Role definition |
| [04-Work Order Queue](../04-work-order-queue.md) | §3 Queue Views, §5 Assignment | Queue management |
| [07-Admin Operations](../07-admin-supervisor-operations.md) | §4-8 All supervisor sections | Core workflows |
| [05-Handoff System](../05-handoff-system.md) | §5 Supervisor Review | Handoff oversight |

---

## 5. Key Workflows

### 5.1 Digital Expeditor Dashboard

```mermaid
graph TD
    subgraph Overview["Production Overview"]
        A[Active WOs] --> A1["12 in progress"]
        B[On Hold] --> B1["3 waiting"]
        C[Delayed] --> C1["2 overdue 🔴"]
        D[Completed Today] --> D1["45 done"]
    end
    
    subgraph Attention["🚨 Attention Required"]
        E["WO-2024-001: Overdue at CNC-001 (2h late)"]
        F["WO-2024-015: Waiting delivery to Assembly"]
        G["WO-2024-022: Outside processing delayed"]
    end
    
    subgraph StationMap["Station Status"]
        H["CNC-001 🟢"] --> H1[Running]
        I["CNC-002 🟡"] --> I1[Setup]
        J["CNC-003 🔴"] --> J1[Down]
        K["ASM-001 🟢"] --> K1[Running]
    end
```

### 5.2 Reviewing Performance Update

```mermaid
sequenceDiagram
    participant S as Supervisor
    participant UI as Review Panel
    participant DB as Database
    participant O as Operator
    
    S->>UI: Open Performance Updates tab
    UI->>DB: SELECT pending updates
    DB->>UI: Return submissions
    S->>UI: Select update to review
    UI->>S: Show details, images, proposed solution
    
    alt Approve
        S->>UI: Click Approve
        S->>UI: Add review notes
        UI->>DB: UPDATE status = 'approved'
        DB->>O: Notification: Approved
    else Reject
        S->>UI: Click Reject
        S->>UI: Provide rejection reason
        UI->>DB: UPDATE status = 'rejected'
        DB->>O: Notification: Rejected with reason
    else Request Info
        S->>UI: Click Request Info
        S->>UI: Specify what's needed
        UI->>DB: UPDATE status = 'more_info_needed'
        DB->>O: Notification: Please provide more info
    end
```

### 5.3 Queue Priority Management

```mermaid
sequenceDiagram
    participant S as Supervisor
    participant UI as Queue Kanban
    participant DB as Database
    
    S->>UI: View queue (org-wide default)
    UI->>DB: SELECT queue_items WHERE org_id = ?
    DB->>UI: Return all queue items
    
    S->>UI: Drag WO to higher priority
    UI->>DB: UPDATE queue_items SET position = ?
    
    S->>UI: Filter by station CNC-001
    UI->>DB: SELECT WHERE station_id = ?
    
    S->>UI: Bulk update: Mark 3 as urgent
    UI->>DB: UPDATE queue_items SET priority = 'urgent' WHERE id IN (...)
```

### 5.4 Delivery Coordination

```mermaid
sequenceDiagram
    participant S as Supervisor
    participant UI as Station Cards
    participant DB as Database
    
    Note over UI: CNC-001 shows "Needs Delivery" alert
    S->>UI: View delivery details
    UI->>S: WO-2024-001 → Assembly-001
    
    S->>UI: Confirm pickup
    UI->>DB: UPDATE routing status, picked_up_at
    
    Note over UI: Assembly-001 shows "Incoming Items"
    S->>UI: Confirm delivery at destination
    UI->>DB: UPDATE routing status = 'delivered'
    DB->>DB: Auto-queue at next station
```

---

## 6. Expeditor Actions

| Action | Description | Keyboard |
|--------|-------------|----------|
| **Reprioritize** | Drag-drop to change queue order | - |
| **Reassign** | Move work to different station | `R` |
| **Expedite** | Flag for priority handling | `E` |
| **Split** | Divide quantity across stations | `S` |
| **Hold** | Pause work with reason | `H` |
| **Skip Step** | Bypass routing step (with approval) | `K` |

---

## 7. Key Metrics to Monitor

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| On-Time % | WOs completed by due date | < 90% |
| Avg Cycle Time | Time from start to complete | > 120% estimate |
| WIP Count | Work in progress | > capacity |
| Bottleneck Station | Station with highest queue | > 5 items |
| Delivery Time | Avg time between stations | > 30 min |
| Pending Reviews | Performance updates awaiting review | > 10 |

---

## 8. Data Access Patterns

### 8.1 Supervisor-Scoped Queries

```typescript
// Queue items for the org (supervisor default view)
const { data: queueItems } = await supabase
  .from('queue_items')
  .select(`
    *,
    station:stations(name, station_id),
    routing:work_order_routing(*)
  `)
  .eq('organization_id', orgId)
  .order('priority', { ascending: false })
  .order('position');

// Performance updates pending review
const { data: pendingUpdates } = await supabase
  .from('job_performance_updates')
  .select('*')
  .eq('team_id', teamId)
  .eq('status', 'pending')
  .order('created_at');
```

### 8.2 RLS Policies

```sql
-- Supervisors can view org-wide queue
CREATE POLICY "Supervisors view org queue"
ON public.queue_items
FOR SELECT
USING (
  is_supervisor_in_org(organization_id, auth.uid())
  OR is_org_admin(organization_id, auth.uid())
);

-- Supervisors can review performance updates in their org
CREATE POLICY "Supervisors review updates"
ON public.job_performance_updates
FOR UPDATE
USING (
  is_supervisor_for_team(team_id, auth.uid())
  OR is_org_admin(
    (SELECT organization_id FROM teams WHERE id = team_id),
    auth.uid()
  )
);
```

---

## 9. Implementation Checklist

### Dashboard
- [ ] Station grid with real-time status
- [ ] Alert panel for issues (down, delayed, delivery needed)
- [ ] Production metrics cards
- [ ] Clickable stations to drill down

### Queue Management
- [ ] Organization-wide view (default)
- [ ] Toggle for station-specific view
- [ ] Kanban with drag-drop priority
- [ ] Bulk operations (status, priority, assignment)
- [ ] Advanced filters

### Performance Reviews
- [ ] Pending updates queue
- [ ] Detail view with images
- [ ] Approve/Reject/Request Info actions
- [ ] Assignment to team/station
- [ ] Review notes

### Expeditor System
- [ ] Production overview dashboard
- [ ] Attention required alerts
- [ ] Station status map
- [ ] Quick actions (expedite, reassign, hold)

---

## 10. Related Documentation

- [User Role Architecture](../../user-role-architecture.md)
- [07-Admin Operations PRD](../07-admin-supervisor-operations.md)
- [04-Work Order Queue PRD](../04-work-order-queue.md)
