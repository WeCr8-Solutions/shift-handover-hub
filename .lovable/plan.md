## Goal

When Aymar people (Brandon, Jaime, future hires) **claim** their QR invite, or when an **existing Jobline user** (like Cory `isk8rduder@aol.com`) gets dropped into the org, everything should snap into place automatically — correct `org_role`, correct `app_role`, joined to the right **team**, optionally pinned to a **station**, with RLS satisfied — so concierge never has to chase down "they joined but they're not on the Production team / not an owner / still showing as member" the day after.

Right now the gap is real:
- `redeem_invite_code` creates an `organization_members` row but Brandon's invite (`org_role=owner`, `app_role=admin`, `team_id=NULL`, `station_id` doesn't exist) means after he claims, **zach is still the only owner**, Brandon lands as admin, and nobody is on a team. Cory already proved this — he's a `member` of Aymar but on **no team**.
- There's no "add existing user" path. If someone already has a Jobline login, concierge has to ask them to redeem a QR — even though we could just attach them.

## What we'll build

### 1. Extend `organization_invites` so a single invite can fully provision a user
Add nullable `station_id uuid REFERENCES stations(id)` so each invite can pin the new user to a specific station on claim. `team_id` already exists. `org_role` already exists. (Migration.)

### 2. Rewrite `public.redeem_invite_code(_code, _user_id)` to be the single source of truth on claim
Inside one SECURITY DEFINER transaction:
1. Validate code (active, not expired, uses_count < max_uses, email matches if `invited_email` is set).
2. Upsert `organization_members` with **`role = invite.org_role`** (not hardcoded `admin`). Owner stays owner.
3. If `invite.team_id` is set → upsert `team_members(team_id, user_id)`.
4. If `invite.station_id` is set → upsert the station-operator link used by `station_machine_assignments` / `operator_station_sessions` (whichever the project already uses for "operator's home station" — I'll match what `TeamManagement` writes).
5. If `invite.app_role` is set → upsert `user_roles(user_id, role)` scoped to the org.
6. Bump `uses_count`, deactivate when full, stamp `invite_redemptions` audit row.
7. If this user is the first owner → stamp `organizations.claimed_at / claimed_by_user_id / activation_state='claimed'` via the existing `stamp_owner_claimed` path.

Result: one click on the QR → user is **fully set up**, no follow-up admin work.

### 3. Pre-staging UI in the Concierge engagement panel (Invites section)
Per invite row, add two inline selects:
- **Team** (dropdown of org's teams + "None")
- **Station** (dropdown of stations in selected team + "None")

Saving writes `team_id` / `station_id` straight onto `organization_invites`. Edit allowed only while `uses_count = 0`. Visible only to platform admins / concierge.

This is what would have prevented today's "Cory is on no team" cleanup — Cory's invite would have carried Production team + a station, and his existing-state would already be right.

### 4. "Add existing Jobline user" panel (Concierge-only)
New server RPC `concierge_add_existing_user(_org_id, _email, _org_role, _app_role, _team_id, _station_id)`:
1. Look up `profiles.user_id` by email (case-insensitive). If not found → return `{ok:false, reason:'no_account'}` so UI can suggest sending an invite instead.
2. Same upserts as redemption steps 2–5 above.
3. Write `concierge_activity_log` row (`action='added_existing_user'`).

UI lives next to "Invites": email field + the same Team / Station / Role selects + "Add to organization" button. This is exactly the action you needed for Cory today.

### 5. Fix Brandon's existing invite's role inconsistency
His row has `org_role=owner` + `app_role=admin`. The new redemption will trust `org_role`, so on claim he becomes owner. We'll also pre-set `team_id = Production` on his and Jaime's invites via the new UI before he arrives.

### 6. Audit + RLS
- All writes go through SECURITY DEFINER functions with explicit `search_path = public`.
- `concierge_add_existing_user` gated by `has_role(auth.uid(),'platform_admin') OR has_role(auth.uid(),'developer')`.
- `organization_invites` update policy already restricts to org admins/platform admins; pre-stage UI uses that.
- No client-side bypass — all role/team writes route through the two RPCs.

## What this fixes for the on-site visit

| Scenario | Before | After |
| --- | --- | --- |
| Brandon scans QR | Becomes admin, no team, zach still owner | Becomes owner, on Production team, on his station |
| Jaime scans QR | Becomes supervisor, no team | Becomes supervisor on Production team |
| Cory (already has account) | Manually added as member, no team — current state | One click in concierge panel adds him to Production + his station |
| Future new hire with no account | QR → member only | QR → member on correct team + station, no follow-up |

## Open decisions for you

1. **Cory's app_role** — keep `operator` (current default) or upgrade since he's a known machinist?
2. **Notify existing users** when added via "Add existing user" — silent add, or send a "You've been added to Aymar Engineering" email? Default plan = silent add + an in-app announcement on next login.
3. **Station assignment** — pin to a single station, or just team-level and let supervisor assign station? Default plan = optional single station on the invite, supervisor can change later.

Tell me which way on those three and I'll switch to build.

## Technical notes (for reference)

- Migration: `ALTER TABLE organization_invites ADD COLUMN station_id uuid REFERENCES stations(id) ON DELETE SET NULL` (idempotent guard).
- `CREATE OR REPLACE FUNCTION public.redeem_invite_code(...)` — replaces existing, same signature, no client changes.
- New `CREATE OR REPLACE FUNCTION public.concierge_add_existing_user(...)` with `EXECUTE` granted to `authenticated`, RLS-style auth check inside.
- New UI lives in `src/components/admin/onboarding/InvitesPanel.tsx` (pre-stage selects) and a new `AddExistingUserPanel.tsx` next to it.
- Tests: extend `src/test/org-scope-integration.test.ts` with claim-with-team and add-existing-user cases.
