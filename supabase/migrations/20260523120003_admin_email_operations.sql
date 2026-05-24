-- Admin Platform Operations: Phase 2 – Email Operations
-- email_templates: versioned, categorised template library
-- email_delivery_events: provider-side delivery status log
-- email_suppressions: bounce/complaint/unsubscribe suppression list

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null check (category in ('legal', 'transactional', 'recruiting', 'marketing', 'system')),
  subject text not null,
  body_html text not null,
  body_text text,
  version integer not null default 1,
  is_active boolean not null default false,
  send_requires_approval boolean not null default false,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.email_templates enable row level security;

create policy "Platform admins manage email templates"
  on public.email_templates for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index idx_email_templates_category on public.email_templates(category);
create index idx_email_templates_is_active on public.email_templates(is_active);

-- Delivery events populated by provider webhooks or edge-function callbacks
create table if not exists public.email_delivery_events (
  id uuid primary key default gen_random_uuid(),
  message_id text,
  recipient_email text not null,
  recipient_user_id uuid references auth.users(id),
  template_id uuid references public.email_templates(id),
  category text check (category in ('legal', 'transactional', 'recruiting', 'marketing', 'system')),
  status text not null check (status in ('sent', 'delivered', 'bounced', 'complained', 'suppressed', 'failed', 'opened', 'clicked')),
  provider text,
  provider_event_id text,
  error_message text,
  occurred_at timestamptz not null default now()
);

alter table public.email_delivery_events enable row level security;

create policy "Platform admins manage delivery events"
  on public.email_delivery_events for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index idx_email_delivery_status on public.email_delivery_events(status);
create index idx_email_delivery_occurred_at on public.email_delivery_events(occurred_at desc);
create index idx_email_delivery_recipient on public.email_delivery_events(recipient_email);

-- Global suppression list – checked before any outbound send
create table if not exists public.email_suppressions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  reason text not null check (reason in ('bounce', 'complaint', 'unsubscribe', 'manual')),
  suppressed_at timestamptz not null default now(),
  suppressed_by uuid references auth.users(id),
  notes text
);

alter table public.email_suppressions enable row level security;

create policy "Platform admins manage suppressions"
  on public.email_suppressions for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index idx_email_suppressions_email on public.email_suppressions(email);
create index idx_email_suppressions_reason on public.email_suppressions(reason);
