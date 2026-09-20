begin;

create table if not exists public.alertas_whatsapp (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique,
  tipo text not null check (tipo in ('pago_aprobado','pago_rechazado','diferencia_pago','stock_bajo')),
  referencia text not null,
  destinatario text not null,
  estado text not null default 'procesando' check (estado in ('procesando','enviada')),
  message_id text,
  creada_en timestamptz not null default now(),
  enviada_en timestamptz
);

alter table public.alertas_whatsapp enable row level security;
revoke all on table public.alertas_whatsapp from public, anon, authenticated;
grant select, insert, update, delete on table public.alertas_whatsapp to service_role;

commit;
