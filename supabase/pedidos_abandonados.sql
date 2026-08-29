create or replace function public.liberar_reserva_pedido(p_pedido_id uuid,p_estado_final text default 'liberada')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_pedido record; v_linea record;
begin
  select id,reserva_estado,estado_pago into v_pedido from public.pedidos where id=p_pedido_id for update;
  if not found then raise exception 'El pedido no existe'; end if;
  if v_pedido.estado_pago='aprobado' or v_pedido.reserva_estado<>'reservado' then
    return jsonb_build_object('liberada',false);
  end if;
  for v_linea in select producto_id,variante_id,cantidad from public.productos_pedido
    where pedido_id=p_pedido_id order by producto_id,variante_id nulls first loop
    if v_linea.variante_id is not null then
      update public.variantes_producto set stock=stock+v_linea.cantidad,actualizado_en=now()
      where id=v_linea.variante_id and producto_id::text=v_linea.producto_id and controla_stock;
    else
      update public.productos set stock=stock+v_linea.cantidad
      where id::text=v_linea.producto_id and controla_stock;
    end if;
  end loop;
  update public.pedidos
  set reserva_estado=case when p_estado_final='vencida' then 'vencida' else 'liberada' end,
      reserva_expira_en=null,
      estado_pago=case when p_estado_final='vencida' and estado_pago in ('pendiente','procesando')
        then 'vencido' else estado_pago end
  where id=p_pedido_id;
  return jsonb_build_object('liberada',true,'estado',p_estado_final);
end $$;

revoke all on function public.liberar_reserva_pedido(uuid,text) from public,anon,authenticated;
grant execute on function public.liberar_reserva_pedido(uuid,text) to service_role;
