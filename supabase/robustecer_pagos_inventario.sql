begin;

create or replace function public.confirmar_pago_wompi(
  p_pedido_id uuid,
  p_transaccion_id text,
  p_referencia_pedido text,
  p_monto_centavos integer,
  p_moneda text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_pago_id uuid; v_total numeric; v_moneda text; v_referencia text;
  v_reserva text; v_estado_pago text; v_linea record; v_lineas integer:=0;
  v_controla boolean; v_stock integer;
begin
  if p_transaccion_id is null or btrim(p_transaccion_id)='' then
    raise exception 'Transacción inválida';
  end if;

  select total,moneda,referencia_pago,reserva_estado,estado_pago
    into v_total,v_moneda,v_referencia,v_reserva,v_estado_pago
  from public.pedidos where id=p_pedido_id for update;
  if not found then raise exception 'El pedido no existe'; end if;

  if v_referencia is distinct from p_referencia_pedido
    or round(v_total*100)::integer<>p_monto_centavos
    or v_moneda is distinct from p_moneda or p_moneda<>'COP' then
    raise exception 'El pago no coincide';
  end if;

  if v_estado_pago='aprobado' then
    return jsonb_build_object('procesado',false,'duplicado',true,'pedido_aprobado',true);
  end if;

  insert into public.pagos_procesados(pedido_id,proveedor,referencia_externa,monto,moneda)
  values(p_pedido_id,'wompi',p_transaccion_id,p_monto_centavos,p_moneda)
  on conflict do nothing returning id into v_pago_id;
  if v_pago_id is null then
    return jsonb_build_object('procesado',false,'duplicado',true);
  end if;

  for v_linea in
    select producto_id,variante_id,cantidad from public.productos_pedido
    where pedido_id=p_pedido_id order by producto_id,variante_id nulls first
  loop
    v_lineas:=v_lineas+1;
    if v_reserva<>'reservado' then
      if v_linea.variante_id is not null then
        select controla_stock,stock into v_controla,v_stock
        from public.variantes_producto
        where id=v_linea.variante_id and producto_id::text=v_linea.producto_id for update;
        if not found then raise exception 'La variante no existe'; end if;
        if v_controla then
          if v_stock<v_linea.cantidad then raise exception 'Stock insuficiente'; end if;
          update public.variantes_producto set stock=stock-v_linea.cantidad,actualizado_en=now()
          where id=v_linea.variante_id;
        end if;
      else
        select controla_stock,stock into v_controla,v_stock from public.productos
        where id::text=v_linea.producto_id for update;
        if not found then raise exception 'El producto no existe'; end if;
        if v_controla then
          if v_stock<v_linea.cantidad then raise exception 'Stock insuficiente'; end if;
          update public.productos set stock=stock-v_linea.cantidad where id::text=v_linea.producto_id;
        end if;
      end if;
    end if;
  end loop;

  if v_lineas=0 then raise exception 'Pedido sin productos'; end if;
  update public.pedidos set estado_pago='aprobado',estado_pedido='pagado',
    reserva_estado='consumida',reserva_expira_en=null where id=p_pedido_id;
  return jsonb_build_object('procesado',true,'duplicado',false);
end $$;

revoke all on function public.confirmar_pago_wompi(uuid,text,text,integer,text)
  from public,anon,authenticated;
grant execute on function public.confirmar_pago_wompi(uuid,text,text,integer,text)
  to service_role;

commit;
