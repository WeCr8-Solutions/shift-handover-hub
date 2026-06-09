## Scope

Three connected fixes around org ownership, customers, and access control.

### 1. Org-owner inclusion + multi-role in Members tab

Owner is already listed in `/teams → Members`, but the row's action menu hides every org-role item when `role === 'owner'`, and `updateMemberOrgRole` only accepts `'admin' | 'member'` — so there is no way to demote an owner, transfer ownership, or promote a stranded member to owner. App roles (supervisor / operator / viewer) are also blocked on owners because the dropdown is hidden entirely.

Changes:
- Allow promoting any active org member to owner via a new "Transfer Ownership" action (only the current owner sees it; confirmation dialog explaining the previous owner is demoted to `admin`).
- Allow assigning/removing multiple app roles (`supervisor`, `operator`, `viewer`) on the owner row — the actions menu always shows the App Roles section, even when org role is `owner`.
- Self-protection stays: owner cannot demote themselves unless they first transfer ownership; never let the last owner be deleted.
- Backend RPC `transfer_org_ownership(_org_id uuid, _to_user_id uuid)` (security definer): verifies caller is current owner, atomically demotes them to `admin` and promotes target to `owner`, logs to `organization_audit_events`.
- Hook update: extend `updateMemberOrgRole` to accept `'owner' | 'admin' | 'member'` and route to the RPC when the new role is `owner`.

### 2. Org-owner signup / RBAC gap fixes

DB check shows 1 existing org (`Aymar Engineering`) whose creator never got an `owner` row — meaning whoever created it can't reach `OrganizationSettings`. Root cause to fix forward:
- New SQL trigger `ensure_org_creator_is_owner` on `organizations` (AFTER INSERT): if `created_by` is set and no membership exists, insert `(org_id, created_by, 'owner')`. This is a safety net behind `create_org_with_owner`.
- Backfill migration: for every org missing an owner, insert the `created_by` user as `owner` (idempotent `ON CONFLICT`).
- RLS audit: confirm `organizations UPDATE` and `app_settings UPSERT` policies use `is_org_admin(...)` which already accepts both `owner` and `admin`. Document in code comments.
- Add a small `OrgAccessAlert` banner on `/settings` that shows when the current user has no `owner`/`admin` membership but appears to be the org creator — gives a "Claim ownership" CTA wired to a `claim_org_ownership(_org_id)` RPC that only succeeds when `auth.uid() = organizations.created_by AND no current owner exists`.

### 3. Customers hub page

New `/customers` route (org members can view; org admins/owner can edit) listing every row from the `customers` table seeded last turn.

UI scope:
- Search + create/edit/delete dialog (name, contact name, email, phone, address, notes, active toggle).
- "Parts" expandable row showing every `part_catalog` entry assigned to that customer, with quantity + recently-used info.
- "Recent work orders / quotes" panel: latest 10 rows from `queue_items` filtered by `customer_id`, linking to the WO detail.
- Nav: add a "Customers" tab to `/settings` shell sidebar AND a top-level entry in the supervisor / admin Header menu.

### 4. E2E coverage

Add Playwright spec `e2e/org-ownership-and-customers.spec.ts` covering the child flows:
1. Owner sees Transfer Ownership; transfer to admin user; old owner becomes admin; new owner can edit org settings.
2. Owner assigns Supervisor + Operator app roles to their own row simultaneously and they persist after reload.
3. Settings page shows `OrgAccessAlert` for a creator without membership; clicking Claim grants owner.
4. Org admin creates customer, attaches part from catalog (default qty), creates a WO that auto-selects that customer + part with quantity pre-filled.
5. Non-admin operator visits `/customers` and gets the read-only view (no Create button, edit/delete actions hidden).

Extend `e2e/helpers/seed.ts` with a `seedCustomer()` helper and a second admin fixture so the ownership-transfer flow has a valid target.

## Technical details

**Files to add**
- `supabase/migrations/<ts>_org_ownership_and_audit.sql` — `transfer_org_ownership` RPC, `claim_org_ownership` RPC, `ensure_org_creator_is_owner` trigger, backfill update, audit-event insert helpers.
- `src/pages/Customers.tsx` — hub page (list + dialogs).
- `src/components/customers/CustomerFormDialog.tsx`, `CustomerRowExpand.tsx` (parts + recent orders panels).
- `src/components/settings/OrgAccessAlert.tsx`.
- `e2e/org-ownership-and-customers.spec.ts`.
- Unit tests: `src/hooks/useCustomers.test.ts`, `src/hooks/useOrganizationMembers.transfer.test.ts`.

**Files to edit**
- `src/hooks/useOrganizationMembers.ts` — widen `updateMemberOrgRole` signature; add `transferOwnership`.
- `src/components/OrganizationMemberManager.tsx` — surface Transfer Ownership; always render App Roles section; remove `!isOwner` guard around the App Roles block; keep destructive owner actions behind confirmation.
- `src/App.tsx` — register `/customers` route (gated by `RequireAuth` + `RequireOrg`).
- `src/components/Header.tsx` (or relevant nav) — add Customers link for admins/supervisors.
- `src/pages/Settings.tsx` — mount `OrgAccessAlert` near the top.
- `src/integrations/supabase/types.ts` — regenerated post-migration.

**Safety**
- Owner-only RPCs check `is_org_admin` + role string explicitly.
- Customers UI continues using the existing RLS policies created in the prior migration (admins write, members read, platform admin override).
- Backfill statement is idempotent (`ON CONFLICT (organization_id, user_id) DO NOTHING`).
- Audit row written to `organization_audit_events` for every ownership transfer and ownership claim.
- No destructive schema changes; only additive RPCs/triggers and one INSERT backfill.