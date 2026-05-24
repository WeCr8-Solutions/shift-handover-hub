# supabase/

Supabase project configuration, database migrations, and edge functions for Shift Handover Hub / JobLine.ai.

## Directory Structure

```
supabase/
├── config.toml            # Supabase CLI project configuration
├── seed_apply.sql         # Reference seed data (applied manually or via CI)
├── functions/             # Supabase Edge Functions (Deno)
│   └── <fn-name>/
│       └── index.ts
└── migrations/            # Ordered SQL migrations — see migrations/README.md
```

## Key Conventions

- All migrations use the `has_role(auth.uid(), 'admin')` helper for platform-admin RLS policies.
- New tables not yet reflected in generated TypeScript types must be accessed via `(supabase as any).from("table_name")` in the frontend.
- Never edit an existing migration file once it has been applied to any environment. Create a new migration instead.
- Run `supabase db push` to apply pending migrations to a local dev instance.
- Run `supabase db reset` to drop and re-apply all migrations from scratch (destructive — local only).

## Edge Functions

Edge functions live under `functions/<name>/index.ts` and are deployed via `supabase functions deploy <name>`.
See individual function directories for purpose and environment variables required.
