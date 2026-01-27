# User Role Architecture & Signup Flow

## Overview

This document describes the multi-level role architecture and the correct flow for new user signups in the organization-scoped SaaS application.

---

## Role Hierarchy

The application uses a **three-tier role system**:

| Level | Table | Roles | Purpose |
|-------|-------|-------|---------|
| **Platform** | `user_roles` | `admin`, `developer`, `supervisor`, `operator`, `viewer` | App-wide permissions |
| **Organization** | `organization_members` | `owner`, `admin`, `member` | Org management permissions |
| **Team** | `team_members` | `owner`, `admin`, `member` | Team-level permissions |

### Platform Roles (`user_roles`)

| Role | Who Can Assign | Description |
|------|----------------|-------------|
| `admin` | Platform owner only | Global super-admin, full system access |
| `developer` | Platform owner only | Access to testing suites, SDK, billing |
| `supervisor` | Org admins | Can oversee teams, review performance updates |
| `operator` | Auto-assigned on signup | Base role, can submit handoffs and updates |
| `viewer` | Org admins | Read-only access |

### Organization Roles (`organization_members`)

| Role | Who Can Assign | Description |
|------|----------------|-------------|
| `owner` | System (on org creation) | Full org control, billing, cannot be removed |
| `admin` | Org owner/admin | Can manage org members, teams, assign roles |
| `member` | Org owner/admin | Standard org membership |

### Team Roles (`team_members`)

| Role | Who Can Assign | Description |
|------|----------------|-------------|
| `owner` | System (on team creation) | Full team control |
| `admin` | Team owner/org admin | Can manage team members, stations |
| `member` | Team admin/org admin | Can view team data, submit handoffs |

---

## New User Signup Flow

### What Happens on Signup

When a new user signs up, the `handle_new_user` database trigger automatically:

1. Creates a `profiles` record with their email and display name
2. Assigns the `operator` role in `user_roles` (base access level)
3. Creates a `user_onboarding` record to track onboarding progress

**Initial State After Signup:**
- Platform Role: `operator` ✅
- Organization: None ❌
- Team: None ❌

### Signup Flow Diagram

```mermaid
flowchart TD
    A[User Signs Up] --> B[handle_new_user trigger fires]
    B --> C[Create profiles record]
    B --> D[Assign 'operator' role]
    B --> E[Create user_onboarding record]
    
    C & D & E --> F[Welcome Modal]
    F --> G{Create or Join Org?}
    
    G -->|Create New| H[Organization Setup]
    H --> I[User becomes org 'owner']
    I --> J[Create First Team]
    J --> K[User becomes team 'owner']
    
    G -->|Invited by Admin| L[Added to Existing Org]
    L --> M[User becomes org 'member']
    M --> N[Org Admin assigns app roles]
    N --> O[Added to Team by Admin]
    O --> P[User becomes team 'member']
    
    K --> Q[Setup Stations]
    P --> Q
    Q --> R[Dashboard - Ready to Work]
    
    style A fill:#10b981,color:#fff
    style R fill:#3b82f6,color:#fff
    style I fill:#f59e0b,color:#fff
    style M fill:#8b5cf6,color:#fff
```

---

## Role Assignment Permissions

### Who Can Assign What?

```mermaid
flowchart LR
    subgraph Platform["Platform Level (Reserved)"]
        PA[Platform Admin] -->|assigns| PR1[admin role]
        PA -->|assigns| PR2[developer role]
    end
    
    subgraph Organization["Organization Level"]
        OA[Org Admin/Owner] -->|assigns| OR1[supervisor role]
        OA -->|assigns| OR2[operator role]
        OA -->|assigns| OR3[viewer role]
        OA -->|assigns| OM[org admin/member role]
    end
    
    subgraph Team["Team Level"]
        TA[Team Admin/Org Admin] -->|assigns| TM[team admin/member role]
    end
    
    style PA fill:#ef4444,color:#fff
    style OA fill:#f59e0b,color:#fff
    style TA fill:#3b82f6,color:#fff
```

---

## Complete User Journey

### Scenario 1: User Creates Organization (Founder)

```mermaid
sequenceDiagram
    participant U as New User
    participant S as System
    participant DB as Database
    
    U->>S: Signs up with email/password
    S->>DB: Create profile (display_name, email)
    S->>DB: Insert user_roles (operator)
    S->>DB: Insert user_onboarding
    
    Note over U,DB: User has: operator role, no org
    
    U->>S: Completes onboarding - Creates Org
    S->>DB: Insert organizations (created_by: user)
    S->>DB: Insert organization_members (role: owner)
    
    Note over U,DB: User has: operator role + org owner
    
    U->>S: Creates first team
    S->>DB: Insert teams (created_by: user)
    S->>DB: Insert team_members (role: owner)
    
    Note over U,DB: User has: operator + org owner + team owner
    
    U->>S: Can now assign supervisor to self if needed
    S->>DB: Insert user_roles (supervisor)
    
    Note over U,DB: Final: operator + supervisor + org owner + team owner
```

### Scenario 2: User is Invited to Existing Organization

```mermaid
sequenceDiagram
    participant OU as Org Admin
    participant NU as New User
    participant S as System
    participant DB as Database
    
    NU->>S: Signs up with email/password
    S->>DB: Create profile, operator role, onboarding
    
    Note over NU,DB: New user has: operator role only
    
    OU->>S: Adds new user to organization
    S->>DB: Insert organization_members (role: member)
    
    OU->>S: Assigns supervisor role
    S->>DB: Insert user_roles (supervisor)
    
    OU->>S: Adds to team
    S->>DB: Insert team_members (role: member)
    
    Note over NU,DB: Final: operator + supervisor + org member + team member
```

---

## Access Control Matrix

| Action | admin | developer | supervisor | operator | viewer |
|--------|-------|-----------|------------|----------|--------|
| View all orgs/users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Access testing suite | ❌ | ✅ | ❌ | ❌ | ❌ |
| View billing/subscriptions | ❌ | ✅ | ❌ | ❌ | ❌ |
| Review performance updates | ✅ | ❌ | ✅ (org-scoped) | ❌ | ❌ |
| Manage work orders | ✅ | ❌ | ✅ (org-scoped) | ❌ | ❌ |
| Submit handoffs | ✅ | ❌ | ✅ | ✅ | ❌ |
| Submit performance updates | ✅ | ❌ | ✅ | ✅ | ❌ |
| View team data | ✅ | ❌ | ✅ (org-scoped) | ✅ (team-scoped) | ✅ (team-scoped) |

---

## RLS Policy Summary

### Key Security Functions

| Function | Purpose |
|----------|---------|
| `has_role(user_id, role)` | Check if user has platform role |
| `is_org_member(user_id, org_id)` | Check org membership |
| `is_org_admin(user_id, org_id)` | Check org admin/owner status |
| `is_supervisor_in_org(user_id, org_id)` | Check supervisor role + org membership |
| `is_team_member(user_id, team_id)` | Check team membership |
| `is_team_admin(user_id, team_id)` | Check team admin/owner status |

### Data Isolation

```mermaid
flowchart TD
    subgraph Global["Global Access (Platform Admin Only)"]
        A[All Organizations]
        B[All Users]
        C[All Activity Logs]
    end
    
    subgraph OrgScope["Organization-Scoped Access"]
        D[Org Teams]
        E[Org Members]
        F[Org Work Orders]
        G[Org Performance Updates]
    end
    
    subgraph TeamScope["Team-Scoped Access"]
        H[Team Stations]
        I[Team Handoffs]
        J[Team Queue Items]
    end
    
    PA[Platform Admin] --> Global
    OA[Org Admin/Supervisor] --> OrgScope
    OP[Operator] --> TeamScope
    
    style PA fill:#ef4444,color:#fff
    style OA fill:#f59e0b,color:#fff
    style OP fill:#10b981,color:#fff
```

---

## Summary

1. **New users automatically get `operator` role** - this is the base access level
2. **Users must create or join an organization** to access full functionality
3. **Organization founders become `owner`** with full control
4. **Invited users become `member`** with roles assigned by org admins
5. **Platform `admin` and `developer` roles are reserved** for platform owners only
6. **Org admins can only assign `supervisor`, `operator`, `viewer`** roles within their org
7. **All data is scoped** by organization → team → station hierarchy
