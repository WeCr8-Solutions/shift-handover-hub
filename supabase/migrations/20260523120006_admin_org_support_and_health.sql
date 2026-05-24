-- Admin Platform Operations: Phase 5 – Platform Support and Executive Reporting
-- org_support_notes: admin timeline notes for org support context
-- org_health_snapshots: periodic org-level health indicator records

create table if not exists public.org_support_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  note_type text not null default 'general' check (note_type in (
    'general', 'escalation', 'churn_risk', 'success', 'implementation', 'legal', 'billing'
  )),
  body text not null,
  is_pinned boolean not null default false,
  authored_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.org_support_notes enable row level security;

create policy "Platform admins manage org support notes"
  on public.org_support_notes for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index idx_org_support_notes_org_id on public.org_support_notes(organization_id);
create index idx_org_support_notes_type on public.org_support_notes(note_type);
create index idx_org_support_notes_created_at on public.org_support_notes(created_at desc);

-- Periodic snapshots capturing key health indicators per org
create table if not exists public.org_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  snapshot_date date not null default current_date,
  active_user_count integer,
  work_order_count_30d integer,
  last_active_at timestamptz,
  subscription_tier text,
  seat_utilization_pct numeric(5, 2),
  has_past_due_invoice boolean not null default false,
  policy_acceptance_pct numeric(5, 2),
  risk_flags text[] default '{}',
  health_score numeric(4, 1),
  created_at timestamptz not null default now()
);

alter table public.org_health_snapshots enable row level security;

create policy "Platform admins manage org health snapshots"
  on public.org_health_snapshots for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index idx_org_health_org_id on public.org_health_snapshots(organization_id);
create index idx_org_health_snapshot_date on public.org_health_snapshots(snapshot_date desc);
create unique index idx_org_health_unique on public.org_health_snapshots(organization_id, snapshot_date);
