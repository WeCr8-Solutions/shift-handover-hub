-- Admin Platform Operations: Phase 3 – Security, Compliance, and Support Controls
-- admin_audit_events: structured, append-only audit log for sensitive admin actions

create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id),
  actor_email text,
  event_category text not null check (event_category in (
    'legal', 'billing', 'org', 'support', 'security', 'talent', 'system'
  )),
  event_action text not null,
  target_type text,
  target_id text,
  target_label text,
  previous_state jsonb,
  new_state jsonb,
  reason text,
  organization_id uuid references public.organizations(id),
  created_at timestamptz not null default now()
);

alter table public.admin_audit_events enable row level security;

-- Append-only for authenticated users (actors log their own actions)
create policy "Authenticated users insert audit events"
  on public.admin_audit_events for insert to authenticated
  with check (auth.uid() = actor_id);

-- Only platform admins can read the full log
create policy "Platform admins read audit events"
  on public.admin_audit_events for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create index idx_admin_audit_actor_id on public.admin_audit_events(actor_id);
create index idx_admin_audit_event_category on public.admin_audit_events(event_category);
create index idx_admin_audit_created_at on public.admin_audit_events(created_at desc);
create index idx_admin_audit_organization_id on public.admin_audit_events(organization_id);
create index idx_admin_audit_target on public.admin_audit_events(target_type, target_id);
