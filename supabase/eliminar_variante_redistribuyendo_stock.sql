begin;

create or replace function public.eliminar_variante_redistribuyendo_stock(
  p_variante_id uuid,
  p_stock_esperado integer
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_variante record;
  v_producto record;
  v_stock_base_nuevo integer;
  v_costo_base_nuevo numeric(14,4);
begin
  select id, producto_id, nombre, stock, costo_promedio
    into v_variante
  from public.variantes_producto
  where id = p_variante_id
  for update;

  if not found then
    raise exception 'La opción del producto no existe';
  end if;

  if v_variante.stock <> p_stock_esperado then
    raise exception 'El inventario cambió mientras eliminabas';
  end if;

  select id, stock, costo_promedio
    into v_producto
  from public.productos
  where id = v_variante.producto_id
  for update;

  if not found then
    raise exception 'El producto no existe';
  end if;

  v_stock_base_nuevo := v_producto.stock + v_variante.stock;
  v_costo_base_nuevo := v_producto.costo_promedio;

  if v_stock_base_nuevo > 0 and v_variante.stock > 0 then
    v_costo_base_nuevo := round(
      ((v_producto.stock * v_producto.costo_promedio)
        + (v_variante.stock * v_variante.costo_promedio))
      / v_stock_base_nuevo,
      4
    );
  end if;

  update public.productos
  set stock = v_stock_base_nuevo,
      controla_stock = true,
      costo_promedio = v_costo_base_nuevo
  where id = v_variante.producto_id;

  begin
    delete from public.variantes_producto
    where id = p_variante_id;
  exception
    when foreign_key_violation then
      raise exception using
        errcode = '23503',
        message = 'Esta opción tiene historial y no se puede borrar. Desactiva "Mostrar esta opción en la tienda" para retirarla sin alterar pedidos anteriores.';
  end;

  return jsonb_build_object(
    'ok', true,
    'id', p_variante_id,
    'stock_devuelto', v_variante.stock,
    'stock_base', v_stock_base_nuevo
  );
end $$;

revoke all on function public.eliminar_variante_redistribuyendo_stock(uuid, integer)
from public, anon, authenticated;
grant execute on function public.eliminar_variante_redistribuyendo_stock(uuid, integer)
to service_role;

commit;
