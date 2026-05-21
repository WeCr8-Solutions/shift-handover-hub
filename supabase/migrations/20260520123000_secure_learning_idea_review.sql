alter table public.learning_ideas
  add column if not exists status text not null default 'pending' check (status in ('pending', 'reviewed', 'approved', 'rejected', 'spam'));

alter table public.learning_ideas
  add column if not exists reviewer_id uuid references auth.users(id) on delete set null;

alter table public.learning_ideas
  add column if not exists reviewer_name text;

alter table public.learning_ideas
  add column if not exists review_notes text;

alter table public.learning_ideas
  add column if not exists reviewed_at timestamptz;

alter table public.learning_ideas
  add column if not exists source_path text;

alter table public.learning_ideas
  add column if not exists submitter_name text;

alter table public.learning_ideas
  add column if not exists submitter_email text;

alter table public.learning_ideas
  add column if not exists spam_score integer not null default 0;

create index if not exists idx_learning_ideas_status on public.learning_ideas (status);
create index if not exists idx_learning_ideas_user_created_at on public.learning_ideas (user_id, created_at desc);

drop policy if exists "Anyone can submit a learning idea" on public.learning_ideas;
drop policy if exists "Users can read own ideas" on public.learning_ideas;

create or replace function public.submit_learning_idea(
  _term_id text,
  _term_name text,
  _role text,
  _title text,
  _problem text,
  _solution text default null,
  _source_path text default null,
  _honeypot text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid := auth.uid();
  _org_id uuid;
  _profile_name text;
  _profile_email text;
  _idea_id uuid;
  _trimmed_title text := btrim(coalesce(_title, ''));
  _trimmed_problem text := btrim(coalesce(_problem, ''));
  _trimmed_solution text := nullif(btrim(coalesce(_solution, '')), '');
  _trimmed_role text := nullif(btrim(coalesce(_role, '')), '');
  _trimmed_term_id text := btrim(coalesce(_term_id, ''));
  _trimmed_term_name text := btrim(coalesce(_term_name, ''));
  _trimmed_source_path text := nullif(left(btrim(coalesce(_source_path, '')), 240), '');
  _recent_hour_count integer := 0;
  _recent_day_count integer := 0;
  _duplicate_count integer := 0;
  _spam_score integer := 0;
begin
  if _user_id is null then
    raise exception 'Sign in required to submit an idea';
  end if;

  if coalesce(_honeypot, '') <> '' then
    raise exception 'Spam submission rejected';
  end if;

  if _trimmed_term_id = '' or _trimmed_term_name = '' then
    raise exception 'Term context is required';
  end if;

  if length(_trimmed_title) < 5 or length(_trimmed_title) > 140 then
    raise exception 'Title must be between 5 and 140 characters';
  end if;

  if length(_trimmed_problem) < 20 or length(_trimmed_problem) > 2000 then
    raise exception 'Problem description must be between 20 and 2000 characters';
  end if;

  if _trimmed_solution is not null and length(_trimmed_solution) > 2000 then
    raise exception 'Follow-up must be 2000 characters or less';
  end if;

  select public.get_user_org_id(_user_id) into _org_id;

  select p.display_name, p.email
  into _profile_name, _profile_email
  from public.profiles p
  where p.user_id = _user_id
  limit 1;

  select count(*)::integer
  into _recent_hour_count
  from public.learning_ideas li
  where li.user_id = _user_id
    and li.created_at > now() - interval '1 hour';

  if _recent_hour_count >= 5 then
    raise exception 'Rate limit reached for idea submissions. Please try again later.';
  end if;

  select count(*)::integer
  into _recent_day_count
  from public.learning_ideas li
  where li.user_id = _user_id
    and li.created_at > now() - interval '24 hours';

  if _recent_day_count >= 20 then
    raise exception 'Daily submission limit reached. Please wait before sending more ideas.';
  end if;

  select count(*)::integer
  into _duplicate_count
  from public.learning_ideas li
  where li.user_id = _user_id
    and lower(li.title) = lower(_trimmed_title)
    and lower(li.problem) = lower(_trimmed_problem)
    and li.created_at > now() - interval '7 days';

  if _duplicate_count > 0 then
    raise exception 'This idea was already submitted recently';
  end if;

  if position('http://' in lower(_trimmed_problem)) > 0 or position('https://' in lower(_trimmed_problem)) > 0 then
    _spam_score := _spam_score + 2;
  end if;

  if position('http://' in lower(coalesce(_trimmed_solution, ''))) > 0 or position('https://' in lower(coalesce(_trimmed_solution, ''))) > 0 then
    _spam_score := _spam_score + 2;
  end if;

  if _recent_hour_count >= 3 then
    _spam_score := _spam_score + 1;
  end if;

  insert into public.learning_ideas (
    term_id,
    term_name,
    role,
    title,
    problem,
    solution,
    user_id,
    org_id,
    status,
    source_path,
    submitter_name,
    submitter_email,
    spam_score
  )
  values (
    _trimmed_term_id,
    _trimmed_term_name,
    _trimmed_role,
    _trimmed_title,
    _trimmed_problem,
    _trimmed_solution,
    _user_id,
    _org_id,
    case when _spam_score >= 3 then 'spam'::text else 'pending'::text end,
    _trimmed_source_path,
    _profile_name,
    _profile_email,
    _spam_score
  )
  returning id into _idea_id;

  return _idea_id;
end;
$$;

grant execute on function public.submit_learning_idea(text, text, text, text, text, text, text, text) to authenticated;

create policy "Platform staff can review learning ideas"
on public.learning_ideas
for select
to authenticated
using (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  or public.has_role(auth.uid(), 'developer'::public.app_role)
);

create policy "Platform staff can update learning ideas"
on public.learning_ideas
for update
to authenticated
using (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  or public.has_role(auth.uid(), 'developer'::public.app_role)
)
with check (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  or public.has_role(auth.uid(), 'developer'::public.app_role)
);

create policy "Submitters can view their own learning ideas"
on public.learning_ideas
for select
to authenticated
using (user_id = auth.uid());