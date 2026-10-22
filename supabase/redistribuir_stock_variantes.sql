begin;

-- Estas columnas ya existen cuando está activo el módulo de costos. Se incluyen
-- aquí para que la redistribución conserve también el valor del inventario.
alter table public.productos
  add column if not exists costo_promedio numeric(14,4) not null default 0 check (costo_promedio >= 0);
alter table public.variantes_producto
  add column if not exists costo_promedio numeric(14,4) not null default 0 check (costo_promedio >= 0);

create or replace function public.guardar_variante_redistribuyendo_stock(
  p_producto_id uuid,
  p_variante_id uuid,
  p_stock_esperado integer,
  p_stock_objetivo integer,
  p_nombre text,
  p_color text,
  p_talla text,
  p_sku text,
  p_precio integer,
  p_precio_mayorista integer,
  p_cantidad_minima_mayorista integer,
  p_imagen_url text,
  p_activo boolean
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_producto record;
  v_variante record;
  v_stock_anterior integer := 0;
  v_diferencia integer;
  v_stock_base_nuevo integer;
  v_costo_base_nuevo numeric(14,4);
  v_costo_variante_nuevo numeric(14,4);
  v_resultado jsonb;
begin
  if p_stock_objetivo is null or p_stock_objetivo < 0 then
    raise exception 'La cantidad del color no puede ser negativa';
  end if;
  if char_length(trim(coalesce(p_nombre, ''))) = 0 or char_length(trim(coalesce(p_sku, ''))) = 0 then
    raise exception 'El nombre y el SKU son obligatorios';
  end if;
  select id, stock, costo_promedio
  into v_producto
  from public.productos
  where id = p_producto_id
  for update;
  if not found then raise exception 'El producto no existe'; end if;

  if p_variante_id is null then
    v_stock_anterior := 0;
    v_costo_variante_nuevo := v_producto.costo_promedio;
  else
    select id, producto_id, stock, costo_promedio, sku
    into v_variante
    from public.variantes_producto
    where id = p_variante_id and producto_id = p_producto_id
    for update;
    if not found then raise exception 'La opción de color no existe'; end if;
    if v_variante.stock <> p_stock_esperado then
      raise exception 'El inventario cambió mientras guardabas';
    end if;
    v_stock_anterior := v_variante.stock;
    v_costo_variante_nuevo := v_variante.costo_promedio;
  end if;

  if p_variante_id is null then
    if exists(select 1 from public.productos where upper(sku) = upper(trim(p_sku))) then
      raise exception 'Ese SKU ya está utilizado por un producto';
    end if;
  elsif upper(trim(p_sku)) <> upper(v_variante.sku)
        and exists(select 1 from public.productos where upper(sku) = upper(trim(p_sku))) then
      raise exception 'Ese SKU ya está utilizado por un producto';
  end if;

  v_diferencia := p_stock_objetivo - v_stock_anterior;
  if v_diferencia > v_producto.stock then
    raise exception 'Solo quedan % unidades sin color', v_producto.stock;
  end if;

  v_stock_base_nuevo := v_producto.stock - v_diferencia;
  v_costo_base_nuevo := v_producto.costo_promedio;

  if v_diferencia > 0 and p_stock_objetivo > 0 then
    v_costo_variante_nuevo := round(
      ((v_stock_anterior * v_costo_variante_nuevo) + (v_diferencia * v_producto.costo_promedio))
      / p_stock_objetivo,
      4
    );
  elsif v_diferencia < 0 and v_stock_base_nuevo > 0 then
    v_costo_base_nuevo := round(
      ((v_producto.stock * v_producto.costo_promedio) + ((-v_diferencia) * v_costo_variante_nuevo))
      / v_stock_base_nuevo,
      4
    );
  end if;

  update public.productos
  set stock = v_stock_base_nuevo,
      controla_stock = true,
      costo_promedio = v_costo_base_nuevo
  where id = p_producto_id;

  if p_variante_id is null then
    insert into public.variantes_producto(
      producto_id, nombre, color, talla, sku, precio, precio_mayorista,
      cantidad_minima_mayorista, controla_stock, stock, costo_promedio,
      imagen_url, activo
    ) values (
      p_producto_id, trim(p_nombre), nullif(trim(coalesce(p_color, '')), ''),
      nullif(trim(coalesce(p_talla, '')), ''), upper(trim(p_sku)), p_precio,
      p_precio_mayorista, p_cantidad_minima_mayorista, true,
      p_stock_objetivo, v_costo_variante_nuevo,
      nullif(trim(coalesce(p_imagen_url, '')), ''), coalesce(p_activo, true)
    ) returning to_jsonb(variantes_producto.*) into v_resultado;
  else
    update public.variantes_producto
    set nombre = trim(p_nombre),
        color = nullif(trim(coalesce(p_color, '')), ''),
        talla = nullif(trim(coalesce(p_talla, '')), ''),
        sku = upper(trim(p_sku)),
        precio = p_precio,
        precio_mayorista = p_precio_mayorista,
        cantidad_minima_mayorista = p_cantidad_minima_mayorista,
        controla_stock = true,
        stock = p_stock_objetivo,
        costo_promedio = v_costo_variante_nuevo,
        imagen_url = nullif(trim(coalesce(p_imagen_url, '')), ''),
        activo = coalesce(p_activo, true),
        actualizado_en = now()
    where id = p_variante_id
    returning to_jsonb(variantes_producto.*) into v_resultado;
  end if;

  return jsonb_build_object(
    'ok', true,
    'variante', v_resultado,
    'stock_base', v_stock_base_nuevo
  );
end $$;

revoke all on function public.guardar_variante_redistribuyendo_stock(
  uuid, uuid, integer, integer, text, text, text, text, integer, integer, integer, text, boolean
) from public, anon, authenticated;
grant execute on function public.guardar_variante_redistribuyendo_stock(
  uuid, uuid, integer, integer, text, text, text, text, integer, integer, integer, text, boolean
) to service_role;

commit;
