create table if not exists public.categorias_producto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  descripcion text not null default '',
  icono text not null default '📦',
  activo boolean not null default true,
  orden integer not null default 0,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

insert into public.categorias_producto (nombre, slug, descripcion, icono, activo, orden)
values
  ('Piñatería', 'pinateria', 'Todo para celebrar momentos especiales', '🎉', true, 10),
  ('Hogar', 'hogar', 'Productos prácticos para tu día a día', '🏠', true, 20),
  ('Cacharrería', 'cacharreria', 'Artículos variados, útiles y prácticos', '🛍️', true, 30),
  ('Mascotas', 'mascotas', 'Accesorios y productos para consentir a tus mascotas', '🐾', false, 40),
  ('Motos', 'motos', 'Accesorios para cada recorrido', '🏍️', true, 50)
on conflict (slug) do update set
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  icono = excluded.icono,
  orden = excluded.orden;

alter table public.categorias_producto enable row level security;
grant select on public.categorias_producto to anon, authenticated;

drop policy if exists categorias_producto_publicas on public.categorias_producto;
create policy categorias_producto_publicas
on public.categorias_producto for select
to anon, authenticated
using (activo = true);

