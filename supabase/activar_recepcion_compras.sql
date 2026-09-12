create or replace function public.recibir_compra_inventario(p_compra_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estado text;
  v_linea record;
  v_lineas integer := 0;
begin
  select estado into v_estado from public.compras where id = p_compra_id for update;
  if not found then raise exception 'La compra no existe'; end if;
  if v_estado = 'recibida' then return jsonb_build_object('procesada', false, 'duplicada', true); end if;
  if v_estado <> 'ordenada' then raise exception 'La compra debe estar ordenada'; end if;
  for v_linea in select producto_id, variante_id, cantidad from public.productos_compra where compra_id = p_compra_id order by producto_id, variante_id nulls first loop
    v_lineas := v_lineas + 1;
    if v_linea.producto_id is null then raise exception 'Hay productos sin vincular'; end if;
    if v_linea.variante_id is not null then
      update public.variantes_producto set stock = stock + v_linea.cantidad, actualizado_en = now() where id = v_linea.variante_id and producto_id = v_linea.producto_id;
      if not found then raise exception 'La variante vinculada no existe'; end if;
    else
      update public.productos set stock = stock + v_linea.cantidad where id = v_linea.producto_id;
      if not found then raise exception 'El producto vinculado no existe'; end if;
    end if;
  end loop;
  if v_lineas = 0 then raise exception 'La compra no contiene productos'; end if;
  update public.compras set estado = 'recibida', fecha_recepcion = current_date, actualizado_en = now() where id = p_compra_id;
  return jsonb_build_object('procesada', true, 'duplicada', false);
end;
$$;

revoke all on function public.recibir_compra_inventario(uuid) from public, anon, authenticated;
grant execute on function public.recibir_compra_inventario(uuid) to service_role;
