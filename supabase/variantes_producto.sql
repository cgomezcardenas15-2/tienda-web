-- Variantes opcionales por producto (color, talla u otra presentación).
create table if not exists public.variantes_producto (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id) on delete cascade,
  nombre text not null,
  color text,
  talla text,
  sku text not null unique,
  precio integer,
  controla_stock boolean not null default true,
  stock integer not null default 0,
  imagen_url text,
  activo boolean not null default true,
  orden integer not null default 0,
  creado_en timestamp with time zone not null default now(),
  actualizado_en timestamp with time zone not null default now(),
  constraint variantes_producto_nombre_no_vacio check (char_length(btrim(nombre)) > 0),
  constraint variantes_producto_sku_no_vacio check (char_length(btrim(sku)) > 0),
  constraint variantes_producto_precio_valido check (precio is null or precio >= 0),
  constraint variantes_producto_stock_valido check (stock >= 0)
);

create index if not exists variantes_producto_producto_id_idx
  on public.variantes_producto(producto_id, activo, orden);

alter table public.variantes_producto enable row level security;

grant select on table public.variantes_producto to anon, authenticated;
grant all on table public.variantes_producto to service_role;

drop policy if exists "Variantes activas visibles" on public.variantes_producto;
create policy "Variantes activas visibles"
  on public.variantes_producto
  for select
  to anon, authenticated
  using (
    activo = true
    and exists (
      select 1
      from public.productos
      where productos.id = variantes_producto.producto_id
        and productos.activo = true
    )
  );

alter table public.productos_pedido
  add column if not exists variante_id uuid references public.variantes_producto(id),
  add column if not exists variante_nombre text,
  add column if not exists variante_sku text,
  add column if not exists variante_color text,
  add column if not exists variante_talla text,
  add column if not exists variante_imagen_url text;

create index if not exists productos_pedido_variante_id_idx
  on public.productos_pedido(variante_id);

-- Confirma el pago una sola vez y descuenta el inventario correcto:
-- el de la variante cuando existe, o el del producto base en caso contrario.
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
  v_linea record;
  v_lineas integer := 0;
  v_controla_stock boolean;
  v_stock integer;
begin
  if p_transaccion_id is null or btrim(p_transaccion_id) = '' then
    raise exception 'La transacción de Wompi no es válida';
  end if;

  select total, moneda, referencia_pago
    into v_total, v_moneda, v_referencia
  from public.pedidos
  where id = p_pedido_id
  for update;

  if not found then raise exception 'El pedido no existe'; end if;

  if v_referencia is distinct from p_referencia_pedido
    or round(v_total * 100)::integer <> p_monto_centavos
    or v_moneda is distinct from p_moneda
    or p_moneda <> 'COP' then
    raise exception 'Los datos del pago no coinciden con el pedido';
  end if;

  insert into public.pagos_procesados (
    pedido_id, proveedor, referencia_externa, monto, moneda
  ) values (
    p_pedido_id, 'wompi', p_transaccion_id, p_monto_centavos, p_moneda
  )
  on conflict (proveedor, referencia_externa) do nothing
  returning id into v_pago_id;

  if v_pago_id is null then
    return jsonb_build_object('procesado', false, 'duplicado', true);
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
        into v_controla_stock, v_stock
      from public.variantes_producto
      where id = v_linea.variante_id
        and producto_id::text = v_linea.producto_id
      for update;

      if not found then raise exception 'La variante del pedido no existe'; end if;

      if v_controla_stock then
        if v_stock < v_linea.cantidad then
          raise exception 'Stock insuficiente para completar el pedido';
        end if;
        update public.variantes_producto
        set stock = stock - v_linea.cantidad, actualizado_en = now()
        where id = v_linea.variante_id;
      end if;
    else
      select controla_stock, stock
        into v_controla_stock, v_stock
      from public.productos
      where id::text = v_linea.producto_id
      for update;

      if not found then raise exception 'El producto del pedido no existe'; end if;

      if v_controla_stock then
        if v_stock < v_linea.cantidad then
          raise exception 'Stock insuficiente para completar el pedido';
        end if;
        update public.productos
        set stock = stock - v_linea.cantidad
        where id::text = v_linea.producto_id;
      end if;
    end if;
  end loop;

  if v_lineas = 0 then raise exception 'El pedido no contiene productos'; end if;

  update public.pedidos
  set estado_pago = 'aprobado', estado_pedido = 'pagado'
  where id = p_pedido_id;

  return jsonb_build_object('procesado', true, 'duplicado', false);
end;
$$;

revoke all on function public.confirmar_pago_wompi(uuid, text, text, integer, text)
from public, anon, authenticated;
grant execute on function public.confirmar_pago_wompi(uuid, text, text, integer, text)
to service_role;
