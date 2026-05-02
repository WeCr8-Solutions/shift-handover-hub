revoke execute on function public.has_passed_gca_bank(uuid, uuid) from anon, public;
revoke execute on function public.has_passed_oap_role_program(uuid, uuid) from anon, public;
grant execute on function public.has_passed_gca_bank(uuid, uuid) to authenticated, service_role;
grant execute on function public.has_passed_oap_role_program(uuid, uuid) to authenticated, service_role;