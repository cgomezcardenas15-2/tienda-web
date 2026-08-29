begin;

alter table public.pedidos
  add column if not exists envio_notificado_email_en timestamp with time zone;

comment on column public.pedidos.envio_notificado_email_en is
  'Fecha en que NOVA confirmó el envío del correo con la guía al comprador.';

commit;
