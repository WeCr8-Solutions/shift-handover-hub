-- Phase 2/3 concierge helpers

-- BRANDING UPSERT --------------------------------------------------
create or replace function public.concierge_upsert_branding(
  _org_id uuid,
  _patch jsonb
) returns jsonb
security definer set search_path = public language plpgsql as $$
declare
  _actor uuid := auth.uid();
  _allowed text[] := array[
    'primary_color','secondary_color','accent_color',
    'logo_light_url','logo_dark_url','favicon_url','login_background_url',
    'company_tagline','support_email','support_phone',
    'custom_css','email_header_html','email_footer_html'
  ];
  _key text; _filtered jsonb := '{}'::jsonb;
begin
  if _actor is null then raise exception 'Not authenticated' using errcode='42501'; end if;
  if not public.has_role(_actor, 'admin'::app_role) then
    raise exception 'Not authorized' using errcode='42501';
  end if;

  for _key in select jsonb_object_keys(_patch) loop
    if _key = any(_allowed) then
      _filtered := _filtered || jsonb_build_object(_key, _patch->_key);
    end if;
  end loop;

  insert into public.organization_branding (organization_id)
  values (_org_id)
  on conflict (organization_id) do nothing;

  update public.organization_branding
     set primary_color        = coalesce(_filtered->>'primary_color',        primary_color),
         secondary_color      = coalesce(_filtered->>'secondary_color',      secondary_color),
         accent_color         = coalesce(_filtered->>'accent_color',         accent_color),
         logo_light_url       = coalesce(_filtered->>'logo_light_url',       logo_light_url),
         logo_dark_url        = coalesce(_filtered->>'logo_dark_url',        logo_dark_url),
         favicon_url          = coalesce(_filtered->>'favicon_url',          favicon_url),
         login_background_url = coalesce(_filtered->>'login_background_url', login_background_url),
         company_tagline      = coalesce(_filtered->>'company_tagline',      company_tagline),
         support_email        = coalesce(_filtered->>'support_email',        support_email),
         support_phone        = coalesce(_filtered->>'support_phone',        support_phone),
         custom_css           = coalesce(_filtered->>'custom_css',           custom_css),
         email_header_html    = coalesce(_filtered->>'email_header_html',    email_header_html),
         email_footer_html    = coalesce(_filtered->>'email_footer_html',    email_footer_html),
         updated_at = now()
   where organization_id = _org_id;

  insert into public.concierge_activity_log(organization_id, actor_user_id, action, summary, details)
  values (_org_id, _actor, 'concierge.branding.upsert',
          'Branding fields updated',
          jsonb_build_object('keys', (select jsonb_agg(k) from jsonb_object_keys(_filtered) k)));

  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.concierge_upsert_branding(uuid, jsonb) from public, anon;
grant execute on function public.concierge_upsert_branding(uuid, jsonb) to authenticated;


-- SETUP STEPS ------------------------------------------------------
create or replace function public.concierge_set_setup_step(
  _org_id uuid,
  _step text,
  _completed boolean
) returns jsonb
security definer set search_path = public language plpgsql as $$
declare _actor uuid := auth.uid();
begin
  if _actor is null then raise exception 'Not authenticated' using errcode='42501'; end if;
  if not public.has_role(_actor, 'admin'::app_role) then
    raise exception 'Not authorized' using errcode='42501';
  end if;

  if _completed then
    insert into public.organization_setup_steps(organization_id, step, completed, completed_by, completed_at)
    values (_org_id, _step, true, _actor, now())
    on conflict (organization_id, step) do update
      set completed = true, completed_by = _actor, completed_at = now();
  else
    delete from public.organization_setup_steps
     where organization_id = _org_id and step = _step;
  end if;

  insert into public.concierge_activity_log(organization_id, actor_user_id, action, summary, details)
  values (_org_id, _actor,
          'concierge.setup_step.' || case when _completed then 'mark' else 'clear' end,
          format('Setup step %s %s', _step, case when _completed then 'completed' else 'cleared' end),
          jsonb_build_object('step', _step, 'completed', _completed));

  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.concierge_set_setup_step(uuid, text, boolean) from public, anon;
grant execute on function public.concierge_set_setup_step(uuid, text, boolean) to authenticated;


-- ROUTING TEMPLATE STEPS ------------------------------------------
create or replace function public.concierge_upsert_template_step(
  _template_id uuid,
  _step_id uuid,           -- null for create
  _patch jsonb
) returns jsonb
security definer set search_path = public language plpgsql as $$
declare
  _actor uuid := auth.uid();
  _org uuid;
  _next_step int;
  _id uuid;
begin
  if _actor is null then raise exception 'Not authenticated' using errcode='42501'; end if;
  if not public.has_role(_actor, 'admin'::app_role) then
    raise exception 'Not authorized' using errcode='42501';
  end if;

  select organization_id into _org from public.routing_templates where id = _template_id;
  if _org is null then raise exception 'Template not found'; end if;

  if _step_id is null then
    select coalesce(max(step_number), 0) + 1 into _next_step
      from public.routing_template_steps where template_id = _template_id;
    insert into public.routing_template_steps(
      template_id, step_number, organization_id,
      operation_type, operation_name, work_center_type,
      setup_time_minutes, cycle_time_minutes, first_article_minutes,
      estimated_duration, instructions
    ) values (
      _template_id,
      coalesce((_patch->>'step_number')::int, _next_step),
      _org,
      coalesce(_patch->>'operation_type', 'internal'),
      coalesce(_patch->>'operation_name', 'New step'),
      _patch->>'work_center_type',
      nullif(_patch->>'setup_time_minutes','')::int,
      nullif(_patch->>'cycle_time_minutes','')::int,
      nullif(_patch->>'first_article_minutes','')::int,
      nullif(_patch->>'estimated_duration','')::int,
      _patch->>'instructions'
    ) returning id into _id;
  else
    update public.routing_template_steps
       set operation_type        = coalesce(_patch->>'operation_type', operation_type),
           operation_name        = coalesce(_patch->>'operation_name', operation_name),
           work_center_type      = coalesce(_patch->>'work_center_type', work_center_type),
           setup_time_minutes    = coalesce(nullif(_patch->>'setup_time_minutes','')::int, setup_time_minutes),
           cycle_time_minutes    = coalesce(nullif(_patch->>'cycle_time_minutes','')::int, cycle_time_minutes),
           first_article_minutes = coalesce(nullif(_patch->>'first_article_minutes','')::int, first_article_minutes),
           estimated_duration    = coalesce(nullif(_patch->>'estimated_duration','')::int, estimated_duration),
           instructions          = coalesce(_patch->>'instructions', instructions)
     where id = _step_id and template_id = _template_id
     returning id into _id;
  end if;

  insert into public.concierge_activity_log(organization_id, actor_user_id, action, summary, details)
  values (_org, _actor,
          case when _step_id is null then 'concierge.routing_step.create' else 'concierge.routing_step.update' end,
          format('Template %s step %s', _template_id, _id),
          jsonb_build_object('template_id', _template_id, 'step_id', _id, 'patch', _patch));

  return jsonb_build_object('ok', true, 'id', _id);
end $$;

revoke all on function public.concierge_upsert_template_step(uuid, uuid, jsonb) from public, anon;
grant execute on function public.concierge_upsert_template_step(uuid, uuid, jsonb) to authenticated;


create or replace function public.concierge_delete_template_step(
  _step_id uuid
) returns jsonb
security definer set search_path = public language plpgsql as $$
declare _actor uuid := auth.uid(); _org uuid; _tpl uuid;
begin
  if _actor is null then raise exception 'Not authenticated' using errcode='42501'; end if;
  if not public.has_role(_actor, 'admin'::app_role) then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  select organization_id, template_id into _org, _tpl
    from public.routing_template_steps where id = _step_id;
  if _org is null then raise exception 'Step not found'; end if;
  delete from public.routing_template_steps where id = _step_id;
  insert into public.concierge_activity_log(organization_id, actor_user_id, action, summary, details)
  values (_org, _actor, 'concierge.routing_step.delete',
          format('Template %s step %s deleted', _tpl, _step_id),
          jsonb_build_object('template_id', _tpl, 'step_id', _step_id));
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.concierge_delete_template_step(uuid) from public, anon;
grant execute on function public.concierge_delete_template_step(uuid) to authenticated;


create or replace function public.concierge_reorder_template_steps(
  _template_id uuid,
  _ordered_step_ids uuid[]
) returns jsonb
security definer set search_path = public language plpgsql as $$
declare
  _actor uuid := auth.uid();
  _org uuid;
  _i int;
begin
  if _actor is null then raise exception 'Not authenticated' using errcode='42501'; end if;
  if not public.has_role(_actor, 'admin'::app_role) then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  select organization_id into _org from public.routing_templates where id = _template_id;
  if _org is null then raise exception 'Template not found'; end if;

  -- Two-phase update to avoid hitting (template_id, step_number) unique constraint
  update public.routing_template_steps
     set step_number = -1 * step_number
   where template_id = _template_id;

  for _i in 1 .. coalesce(array_length(_ordered_step_ids, 1), 0) loop
    update public.routing_template_steps
       set step_number = _i
     where id = _ordered_step_ids[_i] and template_id = _template_id;
  end loop;

  insert into public.concierge_activity_log(organization_id, actor_user_id, action, summary, details)
  values (_org, _actor, 'concierge.routing_step.reorder',
          format('Template %s reordered (%s steps)', _template_id, coalesce(array_length(_ordered_step_ids,1),0)),
          jsonb_build_object('template_id', _template_id, 'order', to_jsonb(_ordered_step_ids)));

  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.concierge_reorder_template_steps(uuid, uuid[]) from public, anon;
grant execute on function public.concierge_reorder_template_steps(uuid, uuid[]) to authenticated;