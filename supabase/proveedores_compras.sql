begin;

create table if not exists public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo_documento text not null default 'NIT' check (tipo_documento in ('NIT', 'CC', 'CE', 'PAS', 'OTRO')),
  numero_documento text,
  persona_contacto text,
  correo text,
  telefono text,
  pais text not null default 'Colombia',
  ciudad text,
  sitio_web text,
  moneda text not null default 'COP' check (moneda in ('COP', 'USD', 'CNY', 'EUR')),
  notas text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create unique index if not exists proveedores_documento_unico
  on public.proveedores (tipo_documento, numero_documento)
  where numero_documento is not null and numero_documento <> '';

create table if not exists public.compras (
  id uuid primary key default gen_random_uuid(),
  consecutivo bigint generated always as identity unique,
  proveedor_id uuid not null references public.proveedores(id),
  factura_proveedor text,
  fecha_compra date not null default current_date,
  fecha_recepcion date,
  estado text not null default 'borrador' check (estado in ('borrador', 'ordenada', 'recibida', 'anulada')),
  moneda text not null default 'COP' check (moneda in ('COP', 'USD', 'CNY', 'EUR')),
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  impuestos numeric(14,2) not null default 0 check (impuestos >= 0),
  costo_envio numeric(14,2) not null default 0 check (costo_envio >= 0),
  otros_costos numeric(14,2) not null default 0 check (otros_costos >= 0),
  total numeric(14,2) not null default 0 check (total >= 0),
  notas text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.productos_compra (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras(id) on delete cascade,
  producto_id uuid references public.productos(id),
  variante_id uuid references public.variantes_producto(id),
  descripcion text not null,
  sku text,
  cantidad integer not null check (cantidad > 0),
  costo_unitario numeric(14,2) not null check (costo_unitario >= 0),
  subtotal numeric(14,2) generated always as (cantidad * costo_unitario) stored
);

alter table public.proveedores enable row level security;
alter table public.compras enable row level security;
alter table public.productos_compra enable row level security;

revoke all on public.proveedores from anon, authenticated;
revoke all on public.compras from anon, authenticated;
revoke all on public.productos_compra from anon, authenticated;

grant all on public.proveedores to service_role;
grant all on public.compras to service_role;
grant all on public.productos_compra to service_role;
grant usage, select on all sequences in schema public to service_role;

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

  for v_linea in
    select producto_id, variante_id, cantidad
    from public.productos_compra
    where compra_id = p_compra_id
    order by producto_id, variante_id nulls first
  loop
    v_lineas := v_lineas + 1;
    if v_linea.producto_id is null then raise exception 'Hay productos sin vincular'; end if;
    if v_linea.variante_id is not null then
      update public.variantes_producto
      set stock = stock + v_linea.cantidad, actualizado_en = now()
      where id = v_linea.variante_id and producto_id = v_linea.producto_id;
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

commit;
