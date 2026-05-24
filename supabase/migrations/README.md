# supabase/migrations/

SQL migration files for Shift Handover Hub / JobLine.ai, applied in timestamp order by the Supabase CLI.

## Naming Convention

```
YYYYMMDDHHMMSS_short_description.sql
```

Example: `20260523120001_admin_policy_acceptance_ledger.sql`

The timestamp prefix must be unique and increases monotonically. Never reuse or alter a timestamp once the migration is committed.

## RLS Pattern

All new tables containing sensitive data must have Row-Level Security enabled:

```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Platform admin full access
CREATE POLICY "platform_admin_all" ON my_table
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User scoped access (where applicable)
CREATE POLICY "user_own" ON my_table
  FOR SELECT USING (user_id = auth.uid());
```

The `has_role(auth.uid(), 'admin')` helper is defined in the auth schema and available across all migrations.

## Adding a New Migration

1. Create a new file: `supabase/migrations/<timestamp>_<description>.sql`
2. Write idempotent SQL using `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, etc.
3. Enable RLS and create policies if the table contains user or org data.
4. Apply locally: `supabase db push`
5. Update `supabase/migrations/CHANGELOG.md` with a brief summary.

## Current Migration Count

250+ migrations as of 2026-05-23. See `CHANGELOG.md` for recent additions.
