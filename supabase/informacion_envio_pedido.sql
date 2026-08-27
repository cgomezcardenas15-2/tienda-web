begin;

alter table public.pedidos
  add column if not exists envio_transportadora text,
  add column if not exists envio_servicio text,
  add column if not exists envio_numero_guia text,
  add column if not exists envio_url_seguimiento text;

commit;
