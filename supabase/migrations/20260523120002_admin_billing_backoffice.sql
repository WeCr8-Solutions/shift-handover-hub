-- Admin Platform Operations: Phase 2 – Billing Operations
-- billing_events: immutable audit trail for billing state changes
-- billing_notes: admin-authored account notes and flags

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  event_type text not null check (event_type in (
    'seat_change', 'credit_applied', 'complimentary_access',
    'payment_failed', 'payment_recovered', 'plan_change',
    'cancellation', 'renewal', 'downgrade', 'upgrade', 'manual_adjustment'
  )),
  description text not null,
  amount_cents integer,
  currency text default 'usd',
  seat_delta integer,
  previous_value text,
  new_value text,
  reason text,
  reference_id text,
  performed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.billing_events enable row level security;

create policy "Platform admins manage billing events"
  on public.billing_events for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index idx_billing_events_organization_id on public.billing_events(organization_id);
create index idx_billing_events_event_type on public.billing_events(event_type);
create index idx_billing_events_created_at on public.billing_events(created_at desc);

-- Admin-authored notes about an org's billing posture
create table if not exists public.billing_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  note text not null,
  note_type text not null default 'general' check (note_type in (
    'general', 'payment_exception', 'contract', 'churn_risk', 'vip', 'collection'
  )),
  is_pinned boolean not null default false,
  authored_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.billing_notes enable row level security;

create policy "Platform admins manage billing notes"
  on public.billing_notes for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index idx_billing_notes_organization_id on public.billing_notes(organization_id);
create index idx_billing_notes_note_type on public.billing_notes(note_type);
create index idx_billing_notes_created_at on public.billing_notes(created_at desc);
