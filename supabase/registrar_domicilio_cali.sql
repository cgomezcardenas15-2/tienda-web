begin;

alter table public.pedidos
  add column if not exists envio_valor_confirmado numeric(12, 2),
  add column if not exists envio_valor_confirmado_en timestamptz,
  add column if not exists envio_pago_recibido boolean not null default false,
  add column if not exists envio_pago_recibido_en timestamptz;

alter table public.pedidos
  drop constraint if exists pedidos_envio_valor_confirmado_check,
  drop constraint if exists pedidos_envio_pago_recibido_check;

alter table public.pedidos
  add constraint pedidos_envio_valor_confirmado_check
    check (
      (envio_valor_confirmado is null and envio_valor_confirmado_en is null)
      or (envio_valor_confirmado > 0 and envio_valor_confirmado_en is not null)
    ),
  add constraint pedidos_envio_pago_recibido_check
    check (
      (envio_pago_recibido = false and envio_pago_recibido_en is null)
      or (
        envio_pago_recibido = true
        and envio_valor_confirmado is not null
        and envio_pago_recibido_en is not null
      )
    );

comment on column public.pedidos.envio_valor_confirmado is
  'Valor del domicilio local de Cali acordado después de crear el pedido. No forma parte de pedido.total ni del cobro de Wompi.';
comment on column public.pedidos.envio_pago_recibido is
  'Indica si NOVA recibió por separado el pago del domicilio local de Cali.';

commit;
