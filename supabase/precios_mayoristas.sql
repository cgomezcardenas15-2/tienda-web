-- Precios de detal y mayorista para productos y variantes de NOVA.
-- Es seguro ejecutarlo más de una vez.

alter table public.productos
  add column if not exists venta_mayorista boolean not null default false,
  add column if not exists precio_mayorista integer,
  add column if not exists cantidad_minima_mayorista integer;

alter table public.variantes_producto
  add column if not exists precio_mayorista integer,
  add column if not exists cantidad_minima_mayorista integer;

alter table public.productos_pedido
  add column if not exists tipo_precio text not null default 'detal';

alter table public.productos_pedido drop constraint if exists productos_pedido_tipo_precio_valido;
alter table public.productos_pedido add constraint productos_pedido_tipo_precio_valido
  check (tipo_precio in ('detal', 'mayorista'));

alter table public.productos drop constraint if exists productos_precio_mayorista_valido;
alter table public.productos add constraint productos_precio_mayorista_valido check (
  (venta_mayorista = false and precio_mayorista is null and cantidad_minima_mayorista is null)
  or
  (venta_mayorista = true and precio_mayorista >= 0 and precio_mayorista < precio and cantidad_minima_mayorista >= 2)
);

alter table public.variantes_producto drop constraint if exists variantes_precio_mayorista_valido;
alter table public.variantes_producto add constraint variantes_precio_mayorista_valido check (
  (precio_mayorista is null and cantidad_minima_mayorista is null)
  or
  (precio_mayorista >= 0 and cantidad_minima_mayorista >= 2)
);

grant select, insert, update on table public.productos to service_role;
grant select, insert, update on table public.variantes_producto to service_role;
grant select, insert on table public.productos_pedido to service_role;
