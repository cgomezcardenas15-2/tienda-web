create table if not exists public.movimientos_inventario (
  id bigint generated always as identity primary key,
  producto_id uuid references public.productos(id) on delete set null,
  variante_id uuid references public.variantes_producto(id) on delete set null,
  producto_nombre text not null,
  variante_nombre text,
  sku text,
  tipo text not null,
  cantidad_anterior integer not null,
  cantidad_nueva integer not null,
  diferencia integer not null,
  creado_en timestamptz not null default now()
);

create index if not exists movimientos_inventario_fecha_idx
  on public.movimientos_inventario(creado_en desc);
create index if not exists movimientos_inventario_producto_idx
  on public.movimientos_inventario(producto_id, creado_en desc);

alter table public.movimientos_inventario enable row level security;
revoke all on table public.movimientos_inventario from public, anon, authenticated;
grant all on table public.movimientos_inventario to service_role;
grant usage, select on sequence public.movimientos_inventario_id_seq to service_role;

create or replace function public.registrar_stock_producto()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op='INSERT' then
    if new.controla_stock and new.stock<>0 then
      insert into public.movimientos_inventario(producto_id,producto_nombre,sku,tipo,cantidad_anterior,cantidad_nueva,diferencia)
      values(new.id,new.nombre,new.sku,'inventario_inicial',0,new.stock,new.stock);
    end if;
  elsif new.stock is distinct from old.stock then
    insert into public.movimientos_inventario(producto_id,producto_nombre,sku,tipo,cantidad_anterior,cantidad_nueva,diferencia)
    values(new.id,new.nombre,new.sku,case when new.stock<old.stock then 'salida' else 'entrada' end,
      old.stock,new.stock,new.stock-old.stock);
  end if;
  return new;
end $$;

create or replace function public.registrar_stock_variante()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_producto_nombre text;
begin
  select nombre into v_producto_nombre from public.productos where id=new.producto_id;
  if tg_op='INSERT' then
    if new.controla_stock and new.stock<>0 then
      insert into public.movimientos_inventario(producto_id,variante_id,producto_nombre,variante_nombre,sku,tipo,cantidad_anterior,cantidad_nueva,diferencia)
      values(new.producto_id,new.id,coalesce(v_producto_nombre,'Producto'),new.nombre,new.sku,'inventario_inicial',0,new.stock,new.stock);
    end if;
  elsif new.stock is distinct from old.stock then
    insert into public.movimientos_inventario(producto_id,variante_id,producto_nombre,variante_nombre,sku,tipo,cantidad_anterior,cantidad_nueva,diferencia)
    values(new.producto_id,new.id,coalesce(v_producto_nombre,'Producto'),new.nombre,new.sku,
      case when new.stock<old.stock then 'salida' else 'entrada' end,old.stock,new.stock,new.stock-old.stock);
  end if;
  return new;
end $$;

drop trigger if exists productos_historial_stock on public.productos;
create trigger productos_historial_stock after insert or update on public.productos
for each row execute function public.registrar_stock_producto();

drop trigger if exists variantes_historial_stock on public.variantes_producto;
create trigger variantes_historial_stock after insert or update on public.variantes_producto
for each row execute function public.registrar_stock_variante();
