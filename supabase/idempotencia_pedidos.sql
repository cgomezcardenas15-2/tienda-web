-- Evita que un doble clic o una repetición de red cree dos pedidos iguales.
alter table public.pedidos
  add column if not exists clave_idempotencia uuid;

create unique index if not exists pedidos_clave_idempotencia_unica
  on public.pedidos (clave_idempotencia)
  where clave_idempotencia is not null;

comment on column public.pedidos.clave_idempotencia is
  'Identificador técnico de un único intento de compra.';
