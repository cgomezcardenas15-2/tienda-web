create table if not exists public.configuracion_envios (
  id boolean primary key default true check (id = true),
  tarifa_cali integer not null default 8000 check (tarifa_cali >= 0),
  tarifa_valle integer not null default 12000 check (tarifa_valle >= 0),
  tarifa_nacional integer not null default 16000 check (tarifa_nacional >= 0),
  envio_gratis_activo boolean not null default false,
  envio_gratis_desde integer not null default 0 check (envio_gratis_desde >= 0),
  actualizado_en timestamptz not null default now()
);

insert into public.configuracion_envios (id)
values (true)
on conflict (id) do nothing;

alter table public.configuracion_envios enable row level security;
revoke all on public.configuracion_envios from anon, authenticated;
grant select, insert, update on public.configuracion_envios to service_role;
