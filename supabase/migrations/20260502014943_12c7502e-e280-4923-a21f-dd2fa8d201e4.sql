-- Idempotent helper functions for certificate gating

create or replace function public.has_passed_gca_bank(_user_id uuid, _bank_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.gca_test_attempts
    where user_id = _user_id
      and bank_id = _bank_id
      and passed = true
  );
$$;

create or replace function public.has_passed_oap_role_program(_user_id uuid, _role_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with required as (
    select q.id as quiz_id
    from public.oap_role_program_courses rpc
    join public.oap_quizzes q on q.course_id = rpc.course_id
    where rpc.role_program_id = _role_program_id
  ),
  passed as (
    select distinct quiz_id
    from public.oap_quiz_attempts
    where user_id = _user_id
      and passed = true
      and quiz_id in (select quiz_id from required)
  )
  select (select count(*) from required) > 0
     and (select count(*) from required) = (select count(*) from passed);
$$;

-- Allow authenticated users + service role to call these (read-only checks)
grant execute on function public.has_passed_gca_bank(uuid, uuid) to authenticated, service_role, anon;
grant execute on function public.has_passed_oap_role_program(uuid, uuid) to authenticated, service_role, anon;