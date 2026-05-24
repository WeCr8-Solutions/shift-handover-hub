-- Admin Platform Operations: Phase 2 – Legal and Policy Operations
-- policy_versions: immutable published policy version records
-- policy_acceptances: user acceptance ledger tied to version identifiers

create table if not exists public.policy_versions (
  id uuid primary key default gen_random_uuid(),
  policy_type text not null check (policy_type in ('terms', 'privacy', 'cookies', 'billing', 'combined')),
  version_label text not null,
  title text not null,
  summary text,
  change_highlights text[] default '{}',
  full_policy_url text,
  effective_date date not null,
  approval_state text not null default 'draft' check (approval_state in ('draft', 'in_review', 'approved', 'published', 'archived')),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  linked_announcement_id uuid references public.policy_change_announcements(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.policy_versions enable row level security;

create policy "Platform admins manage policy versions"
  on public.policy_versions for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Users read published policy versions"
  on public.policy_versions for select to authenticated
  using (approval_state = 'published');

create index idx_policy_versions_policy_type on public.policy_versions(policy_type);
create index idx_policy_versions_approval_state on public.policy_versions(approval_state);
create index idx_policy_versions_effective_date on public.policy_versions(effective_date desc);

-- Acceptance ledger: one row per user per version, idempotent
create table if not exists public.policy_acceptances (
  id uuid primary key default gen_random_uuid(),
  policy_version_id uuid not null references public.policy_versions(id),
  user_id uuid not null references auth.users(id),
  organization_id uuid references public.organizations(id),
  accepted_at timestamptz not null default now(),
  acceptance_method text not null default 'explicit_click' check (acceptance_method in ('explicit_click', 'implicit_scroll', 'api'))
);

alter table public.policy_acceptances enable row level security;

create policy "Platform admins read all policy acceptances"
  on public.policy_acceptances for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Users insert own acceptance"
  on public.policy_acceptances for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users read own acceptances"
  on public.policy_acceptances for select to authenticated
  using (auth.uid() = user_id);

create index idx_policy_acceptances_user_id on public.policy_acceptances(user_id);
create index idx_policy_acceptances_version_id on public.policy_acceptances(policy_version_id);
create index idx_policy_acceptances_accepted_at on public.policy_acceptances(accepted_at desc);
create unique index idx_policy_acceptances_unique on public.policy_acceptances(policy_version_id, user_id);
