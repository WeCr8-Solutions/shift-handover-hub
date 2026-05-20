create table if not exists public.learning_ideas (
  id uuid primary key default gen_random_uuid(),
  term_id text not null,
  term_name text not null,
  role text,
  title text not null,
  problem text not null,
  solution text,
  user_id uuid references auth.users (id) on delete set null,
  org_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_learning_ideas_org_id on public.learning_ideas (org_id);
create index if not exists idx_learning_ideas_term_id on public.learning_ideas (term_id);
create index if not exists idx_learning_ideas_created_at on public.learning_ideas (created_at desc);

alter table public.learning_ideas enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'learning_ideas'
      and policyname = 'Anyone can submit a learning idea'
  ) then
    create policy "Anyone can submit a learning idea"
      on public.learning_ideas
      for insert
      to anon, authenticated
      with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'learning_ideas'
      and policyname = 'Users can read own ideas'
  ) then
    create policy "Users can read own ideas"
      on public.learning_ideas
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;
end
$$;