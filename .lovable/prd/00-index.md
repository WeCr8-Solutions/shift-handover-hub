# JobLine.ai Product Requirements Documents

**Last Updated**: 2026-03-08

---

## Document Index

| # | Document | Status | Description |
|---|----------|--------|-------------|
| 01 | [User Roles & Access Control](./01-user-roles-access-control.md) | ✅ Active | Multi-tiered permission system |
| 02 | [Organization & Team Management](./02-organization-team-management.md) | ✅ Active | Hierarchical structure management |
| 03 | [Invite System](./03-invite-system.md) | ✅ Active | QR codes and invite code redemption |
| 04 | [Work Order & Queue](./04-work-order-queue.md) | ✅ Active | Manufacturing work order management |
| 05 | [Handoff System](./05-handoff-system.md) | ✅ Active | Shift handoff documentation |
| 06 | [Subscription & Billing](./06-subscription-billing.md) | ✅ Active | Stripe integration and entitlements |
| 07 | [Admin & Supervisor Operations](./07-admin-supervisor-operations.md) | ✅ Active | Management workflows for stations, WOs, routing |
| 08 | [Operator Workflow](./08-operator-workflow.md) | ✅ Active | Daily operator tasks and job execution |
| 09 | [Developer Tooling & Integration](./09-developer-tooling-integration.md) | ✅ Active | Issues, Dev Queue, RLS Health, User Journey |
| 10 | [ERP Connector Implementation](./10-erp-connector-implementation.md) | ✅ Active | ERP sync, status mapping, usage metering |
| 11 | [Component Creation & Edit Standards](./11-component-standards.md) | ✅ Active | Import rules, styling, testing, gating checklist |

---

## Quick Reference

### User Hierarchy
```
Platform Roles: admin > developer > supervisor > operator > viewer
Org Roles:      owner > admin > member
Team Roles:     owner > admin > member
```

### Key Flows
1. **New User Signup** → Gets `operator` role → Creates/joins org → Joins team → Works
2. **Invite Code** → Admin generates → User scans QR → Auto-joins org/team with roles
3. **Work Order** → Created → Queued → Assigned → In Progress → Completed
4. **Handoff** → Outgoing creates → Captures status → Incoming reviews → Station updated

### Data Relationships
```
Organization
├── Members (users with org roles)
├── Teams
│   ├── Team Members (users with team roles)
│   ├── Departments
│   └── Stations
├── Entitlements (subscription features/limits)
├── Invite Codes
├── Queue Items (work orders)
└── Handoff Records
```

---

## Status Definitions

| Status | Meaning |
|--------|---------|
| ✅ Active | Current, implemented, and maintained |
| 🚧 Draft | In development, not yet implemented |
| 📋 Planned | Approved for future development |
| ⚠️ Deprecated | Being phased out |

---

## Role-Based Views

For role-specific perspectives on these PRDs, see:

| Role | Document |
|------|----------|
| Platform Admin & Developer | [roles/platform-admin-developer.md](./roles/platform-admin-developer.md) |
| Org Owner & Admin | [roles/org-owner-admin.md](./roles/org-owner-admin.md) |
| Supervisor | [roles/supervisor.md](./roles/supervisor.md) |
| Operator | [roles/operator.md](./roles/operator.md) |
| Viewer | [roles/viewer.md](./roles/viewer.md) |

Full index: [roles/index.md](./roles/index.md)

---

## Contributing

When updating PRDs:
1. Update the version number
2. Update "Last Updated" date
3. Add to changelog if significant
4. Update index if adding new PRD
5. Cross-reference related PRDs

---

## Architecture Documents

See also:
- [User Role Architecture](../user-role-architecture.md) - Detailed role system with Mermaid diagrams
- [Plan](../plan.md) - Development roadmap
