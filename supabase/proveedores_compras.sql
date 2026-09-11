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

commit;
