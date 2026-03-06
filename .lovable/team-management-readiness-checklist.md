# Team Management Readiness Checklist

**Last Updated**: 2026-03-06  
**Status**: Active Audit

---

## 1. Organization Members Tab

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1.1 | Display all org members with profile info | ✅ Fixed | Separated FK join; profiles fetched independently |
| 1.2 | Show org role (Owner/Admin/Member) | ✅ Working | Dropdown for role changes |
| 1.3 | Show app roles (Supervisor/Operator) | ✅ Working | Toggle via dropdown menu |
| 1.4 | **Show team memberships per member** | ✅ Fixed | New `team_memberships` column added |
| 1.5 | Add member by email | ✅ Working | Falls back to invite if user not found |
| 1.6 | Create personal invite for unknown email | ✅ Working | 7-day expiry, single use |
| 1.7 | Remove member from org | ✅ Working | Owner cannot be removed |
| 1.8 | Search/filter members | ✅ Working | By name or email |
| 1.9 | Seat count accuracy | ✅ Working | Synced with entitlements |

## 2. Teams Tab

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 2.1 | List all teams with station count | ✅ Working | Badge shows count |
| 2.2 | Create new team | ✅ Working | Requires org context |
| 2.3 | Delete team (owner only) | ✅ Working | Cascades team_members |
| 2.4 | View team members | ✅ Working | Expand panel on click |
| 2.5 | Add member to team by email | ✅ Working | Uses `team_members_user_id_profiles_fkey` |
| 2.6 | Change team member role | ✅ Working | Admin/Member select |
| 2.7 | Remove team member | ✅ Working | Admin/Owner can remove |
| 2.8 | Generate invite code for team | ✅ Working | Opens InviteCodeGenerator with team preset |

## 3. Station Management (within teams)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 3.1 | Add station to team | ✅ Working | With work center type |
| 3.2 | Bulk upload stations | ✅ Working | Excel import |
| 3.3 | View stations grouped by type | ✅ Working | With icons and colors |
| 3.4 | **Edit station details** | ✅ Fixed | Name, work center, type editable |
| 3.5 | **Delete station** | ✅ Fixed | With confirmation |
| 3.6 | **Reassign station to different team** | ✅ Fixed | Dropdown of other teams |

## 4. Invite Codes Tab

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 4.1 | Create invite with team/role presets | ✅ Working | |
| 4.2 | Seat availability banner | ✅ Working | Progress bar with warnings |
| 4.3 | QR code generation | ✅ Working | |
| 4.4 | Copy code/link | ✅ Working | |
| 4.5 | Deactivate/delete invites | ✅ Working | |
| 4.6 | Redemption history | ✅ Working | Shows who redeemed |
| 4.7 | Seat limit enforcement | ✅ Working | Blocks creation at limit |

## 5. Data Isolation & Security

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 5.1 | Org members scoped by org_id | ✅ | RLS enforced |
| 5.2 | Teams scoped by org_id | ✅ | RLS enforced |
| 5.3 | Stations scoped by org_id | ✅ | RLS enforced |
| 5.4 | Invite codes scoped by org_id | ✅ | RLS enforced |
| 5.5 | Admin actions gated by role | ✅ | isOrgAdmin check |

## 6. Known Issues / Future Work

| # | Issue | Priority | Status |
|---|-------|----------|--------|
| 6.1 | Team edit (rename/description) from card | Medium | TODO |
| 6.2 | Drag-and-drop station reordering | Low | Future |
| 6.3 | Batch station operations | Low | Future |
| 6.4 | Member activity timeline | Low | Future |

---

## Root Causes Fixed

1. **PGRST200 Error**: `organization_members` had no FK to `profiles` table. Fixed by using separate queries instead of PostgREST embedded joins.
2. **Missing Station Actions**: `TeamStationManager` only had create; added edit, delete, and team reassignment.
3. **Missing Team Column**: `OrganizationMemberManager` didn't show which teams members belong to; added `team_memberships` data fetch and column.
4. **Wrong FK Name**: `useTeamMembers` used `team_members_user_id_fkey` but actual FK is `team_members_user_id_profiles_fkey`.
