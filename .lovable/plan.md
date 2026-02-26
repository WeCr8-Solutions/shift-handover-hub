# Ensure Supervisors Can Save Routing Templates (Org-Scoped)

## Problem

There are two issues preventing supervisors from saving routing templates:

### 1. Database RLS blocks supervisor writes on `routing_templates` and `routing_template_steps`

Current policies:


| Table                    | SELECT                              | INSERT/UPDATE/DELETE                    |
| ------------------------ | ----------------------------------- | --------------------------------------- |
| `routing_templates`      | `is_org_member` (any org member)    | `is_org_admin` only                     |
| `routing_template_steps` | `is_org_member` (via template join) | `is_org_admin` only (via template join) |


Supervisors can **create, update, or delete** routing templates in their org scope.l with or

By contrast, `work_order_routing` (saving routing on actual work orders) already has supervisor-scoped INSERT and UPDATE policies -- so supervisors can save routing on individual work orders, but cannot create reusable templates and should be able to as a supervisor. 

### 2. No UI-level gating issue (minor)

The `RoutingTemplateManagement` component receives `isAdmin` but does not gate create/edit/delete buttons behind it -- it shows them to anyone who can see the component. The component is rendered on the Admin page which supervisors can access. So the UI already allows the action; it just fails silently at the DB level.

## Solution

### Database Migration

Replace the `FOR ALL` policies on both `routing_templates` and `routing_template_steps` with policies that also allow supervisors within the same org:

`**routing_templates`:**

- Drop: `"Org admins can manage templates"` (FOR ALL, `is_org_admin` only)
- Add: `"Org admins and supervisors can manage templates"` (FOR ALL) using `is_org_admin(auth.uid(), organization_id) OR is_supervisor_in_org(auth.uid(), organization_id)`

`**routing_template_steps`:**

- Drop: `"Org admins can manage template steps"` (FOR ALL, `is_org_admin` via template join)
- Add: `"Org admins and supervisors can manage template steps"` (FOR ALL) with the same pattern, joining through `routing_templates` to check org membership

This is consistent with how other supervisor-scoped write policies work in this codebase (announcements, equipment, maintenance, shift assignments, NCR approval all use the `is_org_admin OR is_supervisor_in_org` pattern).

### No Frontend Changes Needed

The `RoutingTemplateManagement` component already:

- Scopes all queries to `organization.id`
- Sets `organization_id` on insert for both templates and steps
- Passes `created_by: user?.id`
- Shows create/edit/delete UI to anyone on the Admin page

The `WorkOrderRoutingEditor` already works for supervisors (the `work_order_routing` RLS allows supervisor writes).

### Files Changed

1. **New migration** -- Drop and recreate 2 RLS policies (one per table)

No frontend file changes required.