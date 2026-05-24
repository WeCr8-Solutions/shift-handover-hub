-- Admin Platform Operations: Phase 4 – Talent and Recruiting Governance
-- talent_outreach_consents: per-user consent records for recruiter interaction
-- recruiter_messaging_limits: per-org rate limit and suspension controls
-- talent_abuse_reports: candidate-submitted abuse reports

create table if not exists public.talent_outreach_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  consent_type text not null check (consent_type in (
    'recruiter_contact', 'profile_visibility', 'resume_download', 'pipeline_add'
  )),
  consented boolean not null default true,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz,
  notes text
);

alter table public.talent_outreach_consents enable row level security;

create policy "Platform admins manage outreach consents"
  on public.talent_outreach_consents for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Users manage own consents"
  on public.talent_outreach_consents for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_talent_consents_user_id on public.talent_outreach_consents(user_id);
create index idx_talent_consents_type on public.talent_outreach_consents(consent_type);

-- Per-employer rate limits and suspension flags
create table if not exists public.recruiter_messaging_limits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  daily_limit integer not null default 20,
  weekly_limit integer not null default 80,
  is_suspended boolean not null default false,
  suspension_reason text,
  suspended_by uuid references auth.users(id),
  suspended_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recruiter_messaging_limits enable row level security;

create policy "Platform admins manage recruiter limits"
  on public.recruiter_messaging_limits for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create unique index idx_recruiter_limits_org on public.recruiter_messaging_limits(organization_id);

-- Candidate-submitted abuse reports against employers
create table if not exists public.talent_abuse_reports (
  id uuid primary key default gen_random_uuid(),
  reported_by_user_id uuid not null references auth.users(id),
  reported_organization_id uuid references public.organizations(id),
  report_type text not null check (report_type in (
    'unsolicited_contact', 'harassment', 'data_misuse', 'fake_opportunity', 'other'
  )),
  description text not null,
  status text not null default 'open' check (status in ('open', 'under_review', 'resolved', 'dismissed')),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now()
);

alter table public.talent_abuse_reports enable row level security;

create policy "Platform admins manage abuse reports"
  on public.talent_abuse_reports for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Users insert own abuse reports"
  on public.talent_abuse_reports for insert to authenticated
  with check (auth.uid() = reported_by_user_id);

create index idx_talent_abuse_status on public.talent_abuse_reports(status);
create index idx_talent_abuse_created_at on public.talent_abuse_reports(created_at desc);
