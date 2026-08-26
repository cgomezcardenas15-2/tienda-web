create or replace function public.confirmar_pago_wompi(
  p_pedido_id uuid,
  p_transaccion_id text,
  p_referencia_pedido text,
  p_monto_centavos integer,
  p_moneda text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pago_id uuid;
  v_total numeric;
  v_moneda text;
  v_referencia text;
  v_producto record;
  v_productos integer := 0;
begin
  if p_transaccion_id is null or btrim(p_transaccion_id) = '' then
    raise exception 'La transacción de Wompi no es válida';
  end if;

  select total, moneda, referencia_pago
    into v_total, v_moneda, v_referencia
  from public.pedidos
  where id = p_pedido_id
  for update;

  if not found then
    raise exception 'El pedido no existe';
  end if;

  if v_referencia is distinct from p_referencia_pedido
    or round(v_total * 100)::integer <> p_monto_centavos
    or v_moneda is distinct from p_moneda
    or p_moneda <> 'COP' then
    raise exception 'Los datos del pago no coinciden con el pedido';
  end if;

  insert into public.pagos_procesados (
    pedido_id,
    proveedor,
    referencia_externa,
    monto,
    moneda
  )
  values (
    p_pedido_id,
    'wompi',
    p_transaccion_id,
    p_monto_centavos,
    p_moneda
  )
  on conflict (proveedor, referencia_externa) do nothing
  returning id into v_pago_id;

  if v_pago_id is null then
    return jsonb_build_object('procesado', false, 'duplicado', true);
  end if;

  for v_producto in
    select
      pp.producto_id,
      pp.cantidad,
      p.controla_stock,
      p.stock
    from public.productos_pedido pp
    join public.productos p on p.id::text = pp.producto_id
    where pp.pedido_id = p_pedido_id
    order by pp.producto_id
    for update of p
  loop
    v_productos := v_productos + 1;

    if v_producto.controla_stock then
      if v_producto.stock < v_producto.cantidad then
        raise exception 'Stock insuficiente para completar el pedido';
      end if;

      update public.productos
      set stock = stock - v_producto.cantidad
      where id::text = v_producto.producto_id;
    end if;
  end loop;

  if v_productos = 0 then
    raise exception 'El pedido no contiene productos';
  end if;

  update public.pedidos
  set
    estado_pago = 'aprobado',
    estado_pedido = 'pagado'
  where id = p_pedido_id;

  return jsonb_build_object('procesado', true, 'duplicado', false);
end;
$$;

revoke all on function public.confirmar_pago_wompi(uuid, text, text, integer, text)
from public, anon, authenticated;

grant execute on function public.confirmar_pago_wompi(uuid, text, text, integer, text)
to service_role;
