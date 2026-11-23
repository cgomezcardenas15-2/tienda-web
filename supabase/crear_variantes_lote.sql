begin;

create or replace function public.crear_variantes_lote_redistribuyendo_stock(
  p_producto_id uuid,
  p_stock_base_esperado integer,
  p_nombre text,
  p_color text,
  p_tallas jsonb,
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
  v_item jsonb;
  v_talla text;
  v_sku text;
  v_stock integer;
  v_stock_total integer := 0;
  v_stock_base_nuevo integer;
  v_tallas_normalizadas text[] := array[]::text[];
  v_skus_normalizados text[] := array[]::text[];
  v_variante jsonb;
  v_variantes jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_tallas) is distinct from 'array' then
    raise exception 'Las tallas no tienen un formato válido';
  end if;
  if jsonb_array_length(p_tallas) < 1 or jsonb_array_length(p_tallas) > 30 then
    raise exception 'Selecciona entre 1 y 30 tallas';
  end if;
  if char_length(trim(coalesce(p_nombre, ''))) = 0 or char_length(trim(coalesce(p_color, ''))) = 0 then
    raise exception 'El nombre y el color son obligatorios';
  end if;

  select id, stock, costo_promedio
  into v_producto
  from public.productos
  where id = p_producto_id
  for update;
  if not found then raise exception 'El producto no existe'; end if;
  if v_producto.stock <> p_stock_base_esperado then
    raise exception 'El inventario cambió mientras guardabas';
  end if;

  for v_item in select value from jsonb_array_elements(p_tallas)
  loop
    v_talla := trim(coalesce(v_item ->> 'talla', ''));
    v_sku := upper(trim(coalesce(v_item ->> 'sku', '')));
    if char_length(v_talla) = 0 or char_length(v_sku) = 0 then
      raise exception 'Cada talla debe tener nombre y SKU';
    end if;
    if coalesce(v_item ->> 'stock', '') !~ '^[0-9]+$' then
      raise exception 'El stock de cada talla debe ser un número entero';
    end if;
    v_stock := (v_item ->> 'stock')::integer;
    if lower(v_talla) = any(v_tallas_normalizadas) then
      raise exception 'La talla % está repetida', v_talla;
    end if;
    if v_sku = any(v_skus_normalizados) then
      raise exception 'El SKU % está repetido', v_sku;
    end if;
    v_tallas_normalizadas := array_append(v_tallas_normalizadas, lower(v_talla));
    v_skus_normalizados := array_append(v_skus_normalizados, v_sku);
    v_stock_total := v_stock_total + v_stock;
  end loop;

  if v_stock_total > v_producto.stock then
    raise exception 'Solo quedan % unidades sin clasificar', v_producto.stock;
  end if;
  if exists (
    select 1 from public.productos
    where upper(trim(sku)) = any(v_skus_normalizados)
  ) or exists (
    select 1 from public.variantes_producto
    where upper(trim(sku)) = any(v_skus_normalizados)
  ) then
    raise exception 'Uno de los SKU ya está utilizado';
  end if;
  if exists (
    select 1
    from public.variantes_producto
    where producto_id = p_producto_id
      and lower(trim(coalesce(color, ''))) = lower(trim(p_color))
      and lower(trim(coalesce(talla, ''))) = any(v_tallas_normalizadas)
  ) then
    raise exception 'Una de estas combinaciones de color y talla ya existe';
  end if;

  v_stock_base_nuevo := v_producto.stock - v_stock_total;
  update public.productos
  set stock = v_stock_base_nuevo,
      controla_stock = true
  where id = p_producto_id;

  for v_item in select value from jsonb_array_elements(p_tallas)
  loop
    insert into public.variantes_producto(
      producto_id, nombre, color, talla, sku, precio, precio_mayorista,
      cantidad_minima_mayorista, controla_stock, stock, costo_promedio,
      imagen_url, activo
    ) values (
      p_producto_id,
      trim(p_nombre),
      trim(p_color),
      trim(v_item ->> 'talla'),
      upper(trim(v_item ->> 'sku')),
      p_precio,
      p_precio_mayorista,
      p_cantidad_minima_mayorista,
      true,
      (v_item ->> 'stock')::integer,
      v_producto.costo_promedio,
      nullif(trim(coalesce(p_imagen_url, '')), ''),
      coalesce(p_activo, true)
    ) returning to_jsonb(variantes_producto.*) into v_variante;
    v_variantes := v_variantes || jsonb_build_array(v_variante);
  end loop;

  return jsonb_build_object(
    'ok', true,
    'variantes', v_variantes,
    'stock_base', v_stock_base_nuevo
  );
end $$;

revoke all on function public.crear_variantes_lote_redistribuyendo_stock(
  uuid, integer, text, text, jsonb, integer, integer, integer, text, boolean
) from public, anon, authenticated;
grant execute on function public.crear_variantes_lote_redistribuyendo_stock(
  uuid, integer, text, text, jsonb, integer, integer, integer, text, boolean
) to service_role;

commit;
