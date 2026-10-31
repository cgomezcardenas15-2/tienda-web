begin;

alter table public.pedidos
  add column if not exists metodo_pago text not null default 'wompi',
  add column if not exists pago_confirmado_en timestamptz;

alter table public.pedidos
  drop constraint if exists pedidos_metodo_pago_check;

alter table public.pedidos
  add constraint pedidos_metodo_pago_check
  check (metodo_pago in ('wompi', 'contraentrega'));

alter table public.pedidos
  drop constraint if exists pedidos_estado_pedido_check;

alter table public.pedidos
  add constraint pedidos_estado_pedido_check
  check (
    estado_pedido in (
      'pendiente_pago',
      'confirmado',
      'pagado',
      'preparando',
      'enviado',
      'entregado',
      'cancelado'
    )
  );

create or replace function public.preparar_pedido_contraentrega(p_pedido_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pedido record;
  v_linea record;
  v_controla boolean;
  v_stock integer;
  v_lineas integer := 0;
begin
  select id, metodo_pago, envio_zona, estado_pago, estado_pedido, reserva_estado
    into v_pedido
  from public.pedidos
  where id = p_pedido_id
  for update;

  if not found then
    raise exception 'El pedido no existe';
  end if;
  if v_pedido.metodo_pago <> 'contraentrega' or upper(btrim(coalesce(v_pedido.envio_zona, ''))) <> 'CALI' then
    raise exception 'La contraentrega solo está disponible en Cali';
  end if;
  if v_pedido.estado_pago = 'aprobado' or v_pedido.estado_pedido = 'entregado' then
    return jsonb_build_object('preparado', false, 'finalizado', true);
  end if;
  if v_pedido.estado_pedido = 'cancelado' then
    raise exception 'El pedido está cancelado';
  end if;

  if v_pedido.reserva_estado = 'reservado' then
    update public.pedidos
      set reserva_expira_en = null,
          estado_pedido = 'confirmado',
          proveedor_pago = 'contraentrega'
    where id = p_pedido_id;
    return jsonb_build_object('preparado', true, 'duplicado', true);
  end if;

  if v_pedido.reserva_estado = 'consumida' then
    return jsonb_build_object('preparado', false, 'finalizado', true);
  end if;

  for v_linea in
    select producto_id, variante_id, cantidad
    from public.productos_pedido
    where pedido_id = p_pedido_id
    order by producto_id, variante_id nulls first
  loop
    v_lineas := v_lineas + 1;

    if v_linea.variante_id is not null then
      select controla_stock, stock
        into v_controla, v_stock
      from public.variantes_producto
      where id = v_linea.variante_id
        and producto_id::text = v_linea.producto_id
      for update;

      if not found then raise exception 'La variante no existe'; end if;
      if v_controla then
        if v_stock < v_linea.cantidad then raise exception 'Stock insuficiente'; end if;
        update public.variantes_producto
          set stock = stock - v_linea.cantidad,
              actualizado_en = now()
        where id = v_linea.variante_id;
      end if;
    else
      select controla_stock, stock
        into v_controla, v_stock
      from public.productos
      where id::text = v_linea.producto_id
      for update;

      if not found then raise exception 'El producto no existe'; end if;
      if v_controla then
        if v_stock < v_linea.cantidad then raise exception 'Stock insuficiente'; end if;
        update public.productos
          set stock = stock - v_linea.cantidad
        where id::text = v_linea.producto_id;
      end if;
    end if;
  end loop;

  if v_lineas = 0 then raise exception 'El pedido no contiene productos'; end if;

  update public.pedidos
    set reserva_estado = 'reservado',
        reserva_expira_en = null,
        estado_pedido = 'confirmado',
        proveedor_pago = 'contraentrega'
  where id = p_pedido_id;

  return jsonb_build_object('preparado', true, 'duplicado', false);
end;
$$;

create or replace function public.confirmar_entrega_contraentrega(p_pedido_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pedido record;
  v_pago_id uuid;
  v_referencia text := 'cod:' || p_pedido_id::text;
begin
  select id, metodo_pago, envio_zona, estado_pago, estado_pedido,
         reserva_estado, total, moneda
    into v_pedido
  from public.pedidos
  where id = p_pedido_id
  for update;

  if not found then raise exception 'El pedido no existe'; end if;
  if v_pedido.metodo_pago <> 'contraentrega' or upper(btrim(coalesce(v_pedido.envio_zona, ''))) <> 'CALI' then
    raise exception 'El pedido no es una contraentrega válida de Cali';
  end if;
  if v_pedido.estado_pago = 'aprobado' and v_pedido.estado_pedido = 'entregado' then
    return jsonb_build_object('procesado', false, 'duplicado', true);
  end if;
  if v_pedido.estado_pedido <> 'enviado' then
    raise exception 'El pedido debe estar en reparto antes de confirmar el efectivo';
  end if;
  if v_pedido.reserva_estado <> 'reservado' then
    raise exception 'La reserva de inventario no está activa';
  end if;
  if v_pedido.moneda <> 'COP' then raise exception 'Moneda inválida'; end if;

  insert into public.pagos_procesados(
    pedido_id, proveedor, referencia_externa, monto, moneda
  ) values (
    p_pedido_id,
    'contraentrega',
    v_referencia,
    round(v_pedido.total * 100)::integer,
    'COP'
  )
  on conflict (proveedor, referencia_externa) do nothing
  returning id into v_pago_id;

  if v_pago_id is null then
    select id into v_pago_id
    from public.pagos_procesados
    where proveedor = 'contraentrega'
      and referencia_externa = v_referencia;
    if v_pago_id is null then raise exception 'No fue posible registrar el efectivo'; end if;
  end if;

  update public.pedidos
    set estado_pago = 'aprobado',
        estado_pedido = 'entregado',
        proveedor_pago = 'contraentrega',
        referencia_pago = v_referencia,
        reserva_estado = 'consumida',
        reserva_expira_en = null,
        pago_confirmado_en = now()
  where id = p_pedido_id;

  return jsonb_build_object('procesado', true, 'duplicado', false);
end;
$$;

create or replace function public.cancelar_pedido_contraentrega(p_pedido_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pedido record;
  v_linea record;
begin
  select id, metodo_pago, envio_zona, estado_pago, estado_pedido, reserva_estado
    into v_pedido
  from public.pedidos
  where id = p_pedido_id
  for update;

  if not found then raise exception 'El pedido no existe'; end if;
  if v_pedido.metodo_pago <> 'contraentrega' or upper(btrim(coalesce(v_pedido.envio_zona, ''))) <> 'CALI' then
    raise exception 'El pedido no es una contraentrega válida de Cali';
  end if;
  if v_pedido.estado_pedido = 'cancelado' then
    return jsonb_build_object('cancelado', false, 'duplicado', true);
  end if;
  if v_pedido.estado_pago = 'aprobado' or v_pedido.estado_pedido = 'entregado' then
    raise exception 'Un pedido ya cobrado no se puede cancelar por esta acción';
  end if;

  if v_pedido.reserva_estado = 'reservado' then
    for v_linea in
      select producto_id, variante_id, cantidad
      from public.productos_pedido
      where pedido_id = p_pedido_id
      order by producto_id, variante_id nulls first
    loop
      if v_linea.variante_id is not null then
        update public.variantes_producto
          set stock = stock + v_linea.cantidad,
              actualizado_en = now()
        where id = v_linea.variante_id
          and producto_id::text = v_linea.producto_id
          and controla_stock;
      else
        update public.productos
          set stock = stock + v_linea.cantidad
        where id::text = v_linea.producto_id
          and controla_stock;
      end if;
    end loop;
  end if;

  update public.pedidos
    set estado_pago = 'cancelado',
        estado_pedido = 'cancelado',
        proveedor_pago = 'contraentrega',
        reserva_estado = 'liberada',
        reserva_expira_en = null
  where id = p_pedido_id;

  return jsonb_build_object('cancelado', true, 'duplicado', false);
end;
$$;

revoke all on function public.preparar_pedido_contraentrega(uuid)
  from public, anon, authenticated;
revoke all on function public.confirmar_entrega_contraentrega(uuid)
  from public, anon, authenticated;
revoke all on function public.cancelar_pedido_contraentrega(uuid)
  from public, anon, authenticated;

grant execute on function public.preparar_pedido_contraentrega(uuid) to service_role;
grant execute on function public.confirmar_entrega_contraentrega(uuid) to service_role;
grant execute on function public.cancelar_pedido_contraentrega(uuid) to service_role;

commit;
