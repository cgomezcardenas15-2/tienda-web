begin;

revoke all on public.proveedores from anon, authenticated;
revoke all on public.compras from anon, authenticated;
revoke all on public.productos_compra from anon, authenticated;

grant all on public.proveedores to service_role;
grant all on public.compras to service_role;
grant all on public.productos_compra to service_role;
grant usage, select on all sequences in schema public to service_role;

commit;
