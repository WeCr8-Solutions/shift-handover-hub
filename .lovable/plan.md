
# Plan: Complete Station Setup Flow After Team Creation

## Overview
This plan addresses the full workflow after team creation: fixing the team members display issue, enabling smooth station setup with department organization, and integrating with the job performance update and queue systems.

## Current Issues Identified

### Issue 1: Team Members Panel Broken
The network request shows a 400 error when fetching team members:
```
"Could not find a relationship between 'team_members' and 'profiles'"
```
The `useTeamMembers` hook attempts to join `team_members` with `profiles` using a foreign key hint (`team_members_user_id_fkey`) that doesn't exist in the database.

### Issue 2: No Direct Path from Team to Station Creation
After creating a team on the Teams page, users must navigate separately to the Admin page to add stations. There's no guided flow to add stations immediately after team creation.

### Issue 3: Stations Lack Department Grouping
The current station model has `work_center` (department) as a text field, but there's no dedicated departments table to properly organize and filter stations by department.

---

## Solution Architecture

```text
+------------------+     +------------------+     +------------------+
|   Create Team    | --> | Add Departments  | --> |  Add Stations    |
+------------------+     +------------------+     +------------------+
         |                       |                        |
         v                       v                        v
+------------------+     +------------------+     +------------------+
|  Team Members    |     | Filter by Dept   |     | Handoff Tracking |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
                                                 +------------------+
                                                 | Performance      |
                                                 | Updates & Queue  |
                                                 +------------------+
```

---

## Implementation Steps

### Step 1: Fix Team Members Foreign Key Relationship

**Database Migration Required**

Add a foreign key constraint between `team_members.user_id` and `profiles.user_id`:

```sql
ALTER TABLE public.team_members
ADD CONSTRAINT team_members_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
ON DELETE CASCADE;
```

This enables the Supabase client to perform the join query in `useTeamMembers`.

---

### Step 2: Add "Quick Add Stations" Flow After Team Creation

**File: src/components/TeamManagement.tsx**

After a team is successfully created, show a prompt or dialog to immediately add stations to that team:

- After `createTeam` succeeds, open a new "Add Stations" dialog
- Pre-select the newly created team
- Allow users to add multiple stations in quick succession
- Provide option to use bulk upload or manual entry

**UI Changes:**
- Add "Add Stations" button on team cards
- Add station count badge to team cards
- Show inline station creation form after team creation success

---

### Step 3: Create Departments Management (Optional Enhancement)

**New Database Table: `departments`**

```sql
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stations 
ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
```

This allows stations to be organized into departments within a team (e.g., "CNC Bay 1", "Welding Area", "Quality Lab").

**RLS Policies:**
- Team members can view departments in their team
- Team admins can create/update/delete departments
- Admins can manage all departments

---

### Step 4: Enhance Station Creation in Team Context

**File: src/components/TeamStationManager.tsx** (New Component)

Create a dedicated component for managing stations within a team context:

- Shows stations filtered by the selected team
- Allows grouping stations by work center (department)
- Inline quick-add form for new stations
- Bulk upload option with pre-filled team assignment
- Visual grouping by work center type with icons

**Key Features:**
- Station cards grouped by work center
- Quick status overview (active/inactive count)
- Direct link to handoff creation for each station
- Performance update shortcut per station

---

### Step 5: Add Station Quick Actions for Performance Updates

**File: src/components/StationCard.tsx**

Enhance station cards with quick action buttons:

- "New Handoff" button
- "Performance Update" button (pre-fills station context)
- "View Queue" button (filters queue to this station)
- Station-specific issue count badge

---

### Step 6: Integrate with Queue System

**File: src/hooks/useQueue.ts**

Ensure queue items can be filtered and created with station context:

- Add station filter to queue views
- Pre-populate station when creating queue items from station context
- Show queue item count per station on station cards

---

## Technical Details

### Database Changes Summary

| Change | Type | Purpose |
|--------|------|---------|
| Add FK: team_members -> profiles | Migration | Fix team members display |
| Create departments table | Migration (Optional) | Organize stations by department |
| Add department_id to stations | Migration (Optional) | Link stations to departments |

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| useTeams.ts | Modify | Handle FK join correctly |
| TeamManagement.tsx | Modify | Add station quick-add after team creation |
| TeamStationManager.tsx | Create | New component for team-scoped station management |
| StationCard.tsx | Modify | Add quick action buttons |
| Setup.tsx | Modify | Improve wizard flow guidance |

### Component Flow

```text
Teams Page
    |
    +-- TeamManagement
    |       |
    |       +-- Create Team Dialog
    |       |       |
    |       |       +-- Success --> "Add Stations" prompt
    |       |
    |       +-- Team Card
    |               |
    |               +-- Click --> TeamMembersPanel
    |               +-- "Add Stations" button --> Inline Station Form
    |
    +-- TeamStationManager (new)
            |
            +-- Stations grouped by Work Center
            +-- Quick Add Station form
            +-- Bulk Upload integration
```

---

## User Experience Flow

1. **User creates a team** (e.g., "CNC Department")
2. **System prompts**: "Would you like to add stations to CNC Department now?"
3. **User clicks "Add Stations"**
4. **Station creation form appears** with team pre-selected
5. **User adds stations** (CNC-001, CNC-002, etc.) with work center grouping
6. **Stations appear on dashboard** filtered by team
7. **User can submit handoffs** from station cards
8. **Performance updates** track improvements per station
9. **Queue items** can be assigned to specific stations

---

## Security Considerations

- All new tables will have RLS enabled
- Department access follows team membership
- Station creation requires team admin or global admin role
- Performance updates logged in activity audit

---

## Summary

This plan provides a complete solution for:
1. Fixing the immediate team members display bug
2. Creating a smooth station setup flow after team creation  
3. Organizing stations by work center/department
4. Integrating stations with handoff, performance update, and queue systems

The changes maintain backward compatibility with existing data while enabling the full manufacturing floor tracking workflow the user described.
