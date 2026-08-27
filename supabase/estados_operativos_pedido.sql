begin;

alter table public.pedidos
  drop constraint if exists pedidos_estado_pedido_check;

alter table public.pedidos
  add constraint pedidos_estado_pedido_check
  check (
    estado_pedido in (
      'pendiente_pago',
      'pagado',
      'preparando',
      'enviado',
      'entregado',
      'cancelado'
    )
  );

commit;
