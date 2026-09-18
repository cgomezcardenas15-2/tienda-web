begin;

-- La conciliación se renderiza exclusivamente en el servidor, después de
-- validar la sesión administrativa. El navegador nunca recibe esta credencial.
revoke all on table public.pagos_procesados from public, anon, authenticated;
grant select on table public.pagos_procesados to service_role;

commit;
