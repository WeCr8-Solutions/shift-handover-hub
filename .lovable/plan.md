# Fix: Aymar Engineering missing from Live concierge

## What's actually wrong

`jobline.ai` is **not** being intercepted by Vercel. Verified:
- HTTP headers show `server: cloudflare` + `x-deployment-id` → served by Lovable's edge
- `jobline.ai/release.json` returns commit `42e767e`, the build we just published
- All A records (`@`, `www`, `app`, `dev`, `docs`) → `185.158.133.1` (Lovable)

The real issue: **Aymar Engineering only exists in your Test database**, not in Live. Lovable Cloud has two completely separate Postgres databases (Test and Live). Publishing syncs *schema + edge functions + secrets* between them but **never copies data**. Aymar was created while we were iterating on concierge in Test, so when you sign in on `jobline.ai` (which talks to Live), the org doesn't exist there and concierge shows nothing.

The `__l5e/trackevents` 502 in console is unrelated — it's Lovable's visitor telemetry, harmless noise on custom domains.

## What gets copied to Live

Exact row counts pulled from Test (`organization_id = 41f0e268-87d6-4981-b21e-a3c4e8245688`):

| Table | Rows |
|---|---|
| organizations | 1 (Aymar Engineering) |
| organization_members | 1 (zach@wecr8.info as owner) |
| onboarding_engagements | 1 |
| onboarding_intake_responses | 2 |
| onboarding_checklist_items | 10 |
| concierge_activity_log | 1 |
| teams | 1 |
| stations | 17 |

Tables with zero Aymar rows (skipped): organization_branding, organization_billing, subscriptions, concierge_document_records, concierge_uploaded_documents, organization_setup_steps.

The owner user (`7d924865-7e19-4bf8-a503-75eeeab26d03`) already exists in Live's `auth.users`, so the membership FK resolves cleanly.

## Approach

Write one idempotent migration with literal `INSERT … ON CONFLICT (id) DO NOTHING` statements containing the exact column values pulled from Test. Because of `ON CONFLICT DO NOTHING`:

- **In Test (apply-on-save):** rows already exist → skipped, no-op.
- **In Live (apply-on-publish):** rows don't exist → seeded. Aymar appears in concierge.

This stays inside the normal Lovable workflow (no manual Live SQL editor), is reversible (a follow-up migration could delete the seeded IDs), and the migration file itself documents the seed for future devs.

## Steps

1. **Dump Aymar rows from Test** for the 8 tables above, capturing all columns and FK ids verbatim.
2. **Generate a single migration file** containing:
   - `INSERT INTO organizations … ON CONFLICT (id) DO NOTHING`
   - same pattern for `teams`, `stations`, `organization_members`, `onboarding_engagements`, `onboarding_intake_responses`, `onboarding_checklist_items`, `concierge_activity_log`
   - Ordered so parent rows (organization → team → stations / engagement → intake / checklist) land before children.
3. **Approve & run the migration.** It applies to Test (no-op), the next Publish applies it to Live (seeds the rows).
4. **Publish** the project.
5. **Verify** by querying Live for `organizations WHERE name='Aymar Engineering'` and signing in fresh at `jobline.ai`.

## Technical notes

- `ON CONFLICT (id) DO NOTHING` requires each table to have `id` as a primary/unique key (all 8 do).
- `stations` rows reference `teams.id`; insert teams before stations.
- `organization_members` references `auth.users(id)` — the owner user already exists in Live, confirmed.
- No RLS bypass needed: migrations run as the superuser role.
- The `__l5e/trackevents` 502 is unrelated to this fix and will stay in console until Lovable's platform fixes their telemetry route on custom domains.

## What this does NOT do

- Does not migrate any work orders, queue items, handoffs, NCRs, certificates, or quality data for Aymar (none exist in Test).
- Does not touch any other org's data in Live.
- Does not change any code, only inserts data.