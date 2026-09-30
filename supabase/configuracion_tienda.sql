create table if not exists public.configuracion_tienda (
  id boolean primary key default true check (id = true),
  compra_minima_activa boolean not null default false,
  monto_minimo_compra integer not null default 0 check (monto_minimo_compra >= 0),
  actualizado_en timestamptz not null default now()
);

insert into public.configuracion_tienda (id)
values (true)
on conflict (id) do nothing;

alter table public.configuracion_tienda enable row level security;
revoke all on public.configuracion_tienda from anon, authenticated;
grant select, insert, update on public.configuracion_tienda to service_role;
