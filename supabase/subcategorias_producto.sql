-- Subcategorías opcionales y retrocompatibles para el catálogo NOVA.
-- Los productos existentes conservan su categoría y quedan sin subcategoría.

create table if not exists public.subcategorias_producto (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.categorias_producto(id) on delete restrict,
  nombre text not null,
  slug text not null,
  descripcion text not null default '',
  activo boolean not null default true,
  orden integer not null default 0 check (orden >= 0),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (categoria_id, slug)
);

create unique index if not exists subcategorias_producto_nombre_unico_idx
  on public.subcategorias_producto (categoria_id, lower(nombre));

alter table public.productos
  add column if not exists subcategoria_id uuid
  references public.subcategorias_producto(id) on delete set null;

create index if not exists subcategorias_producto_publicas_idx
  on public.subcategorias_producto (categoria_id, activo, orden, nombre);

create index if not exists productos_catalogo_subcategoria_idx
  on public.productos (subcategoria_id, creado_en desc, id)
  where activo = true;

alter table public.subcategorias_producto enable row level security;
revoke all on public.subcategorias_producto from public, anon, authenticated;
grant select on public.subcategorias_producto to anon, authenticated;
grant all on public.subcategorias_producto to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'subcategorias_producto'
      and policyname = 'subcategorias_producto_publicas'
  ) then
    create policy subcategorias_producto_publicas
    on public.subcategorias_producto for select
    to anon, authenticated
    using (
      activo = true
      and exists (
        select 1
        from public.categorias_producto as categoria
        where categoria.id = subcategorias_producto.categoria_id
          and categoria.activo = true
      )
    );
  end if;
end;
$$;

create or replace function public.listar_productos_publicos_v2(
  p_categoria text default null,
  p_subcategoria_id uuid default null,
  p_modo text default 'destacados',
  p_desde integer default 0,
  p_limite integer default 50
)
returns table (
  producto_id uuid,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with parametros as (
    select
      nullif(private.normalizar_texto_catalogo(left(p_categoria, 120)), '') as categoria,
      p_subcategoria_id as subcategoria_id,
      case
        when p_modo in ('categoria', 'ofertas', 'destacados') then p_modo
        else 'destacados'
      end as modo,
      least(greatest(coalesce(p_desde, 0), 0), 50000) as desde,
      least(greatest(coalesce(p_limite, 50), 1), 50) as limite
  ),
  coincidencias as (
    select p.id, p.destacado, p.creado_en
    from public.productos as p
    cross join parametros
    where p.activo = true
      and exists (
        select 1
        from public.categorias_producto as c
        where c.activo = true
          and private.normalizar_texto_catalogo(c.nombre) =
              private.normalizar_texto_catalogo(p.categoria)
      )
      and (
        (parametros.modo = 'categoria'
          and parametros.categoria is not null
          and private.normalizar_texto_catalogo(p.categoria) = parametros.categoria
          and (
            parametros.subcategoria_id is null
            or exists (
              select 1
              from public.subcategorias_producto as s
              join public.categorias_producto as c on c.id = s.categoria_id
              where s.id = parametros.subcategoria_id
                and s.id = p.subcategoria_id
                and s.activo = true
                and c.activo = true
                and private.normalizar_texto_catalogo(c.nombre) = parametros.categoria
            )
          ))
        or (parametros.modo = 'ofertas' and p.en_oferta = true)
        or (parametros.modo = 'destacados' and p.destacado = true)
      )
  ),
  resultados as (
    select
      coincidencias.id,
      coincidencias.destacado,
      coincidencias.creado_en,
      count(*) over () as total_count
    from coincidencias
  )
  select resultados.id, resultados.total_count
  from resultados
  cross join parametros
  order by resultados.destacado desc, resultados.creado_en desc, resultados.id asc
  offset (select desde from parametros)
  limit (select limite from parametros);
$$;

revoke all on function public.listar_productos_publicos_v2(text, uuid, text, integer, integer)
  from public;
grant execute on function public.listar_productos_publicos_v2(text, uuid, text, integer, integer)
  to anon, authenticated;

-- Conserva la firma de la búsqueda y añade el nombre de la subcategoría al texto buscable.
create or replace function public.buscar_productos_publicos(
  p_consulta text,
  p_desde integer default 0,
  p_limite integer default 50
)
returns table (
  producto_id uuid,
  relevancia numeric,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with parametros as (
    select
      left(private.normalizar_texto_catalogo(p_consulta), 120) as consulta,
      least(greatest(coalesce(p_desde, 0), 0), 50000) as desde,
      least(greatest(coalesce(p_limite, 50), 1), 50) as limite
  ),
  tokens as (
    select left(token, 64) as token, ordinalidad
    from parametros
    cross join lateral unnest(string_to_array(consulta, ' '))
      with ordinality as t(token, ordinalidad)
    where token <> ''
      and length(token) >= 2
      and ordinalidad <= 8
  ),
  alternativas as (
    select tokens.ordinalidad, tokens.token, alternativa
    from tokens
    cross join lateral unnest(
      private.sinonimos_token_catalogo(tokens.token)
    ) as alternativa
  ),
  productos_base as (
    select
      p.id,
      private.normalizar_texto_catalogo(p.nombre) as nombre_normalizado,
      private.normalizar_texto_catalogo(
        concat_ws(
          ' ',
          p.nombre,
          p.descripcion,
          p.sku,
          p.categoria,
          p.slug,
          s.nombre,
          s.slug,
          string_agg(
            concat_ws(' ', v.nombre, v.color, v.talla, v.sku),
            ' '
            order by v.orden, v.id
          ) filter (where v.id is not null)
        )
      ) as texto_normalizado
    from public.productos as p
    left join public.subcategorias_producto as s on s.id = p.subcategoria_id
    left join public.variantes_producto as v
      on v.producto_id = p.id
     and v.activo = true
    where p.activo = true
      and exists (
        select 1
        from public.categorias_producto as c
        where c.activo = true
          and private.normalizar_texto_catalogo(c.nombre) =
              private.normalizar_texto_catalogo(p.categoria)
      )
    group by p.id, p.nombre, p.descripcion, p.sku, p.categoria, p.slug, s.nombre, s.slug
  ),
  productos_con_palabras as (
    select
      productos_base.*,
      string_to_array(productos_base.texto_normalizado, ' ') as palabras,
      string_to_array(productos_base.nombre_normalizado, ' ') as palabras_nombre
    from productos_base
  ),
  puntajes_token as (
    select
      producto.id,
      alternativa.ordinalidad,
      max(
        case
          when alternativa.alternativa = any(producto.palabras) then 30
          when length(alternativa.alternativa) >= 3
           and exists (
             select 1
             from unnest(producto.palabras) as palabra
             where left(palabra, length(alternativa.alternativa)) = alternativa.alternativa
                or (
                  length(alternativa.alternativa) >= 4
                  and length(palabra) >= 4
                  and length(alternativa.alternativa) - length(palabra) between 1 and 3
                  and left(alternativa.alternativa, length(palabra)) = palabra
                )
           ) then 22
          when length(alternativa.alternativa) >= 2
           and position(alternativa.alternativa in producto.texto_normalizado) > 0 then 15
          when length(alternativa.alternativa) between 4 and 64
           and exists (
             select 1
             from unnest(producto.palabras) as palabra
             cross join lateral (
               select case
                 when length(alternativa.alternativa) >= 7 then 2
                 else 1
               end as tolerancia
             ) as limite_error
             where length(palabra) between 1 and 64
               and abs(length(palabra) - length(alternativa.alternativa)) <= limite_error.tolerancia
               and extensions.levenshtein_less_equal(
                 alternativa.alternativa,
                 palabra,
                 limite_error.tolerancia
               ) <= limite_error.tolerancia
           ) then 10
          else 0
        end
      ) as puntos,
      max(
        case
          when alternativa.alternativa = any(producto.palabras_nombre) then 18
          else 0
        end
      ) as bono_nombre
    from productos_con_palabras as producto
    cross join alternativas as alternativa
    group by producto.id, alternativa.ordinalidad
  ),
  coincidencias as (
    select
      producto.id,
      (
        case
          when producto.nombre_normalizado = parametros.consulta then 150
          when left(producto.nombre_normalizado, length(parametros.consulta)) = parametros.consulta then 115
          when position(parametros.consulta in producto.nombre_normalizado) > 0 then 90
          when position(parametros.consulta in producto.texto_normalizado) > 0 then 70
          else 0
        end
        + sum(puntaje.puntos + puntaje.bono_nombre)
      )::numeric as relevancia
    from productos_con_palabras as producto
    cross join parametros
    join puntajes_token as puntaje on puntaje.id = producto.id
    where parametros.consulta <> ''
    group by
      producto.id,
      producto.nombre_normalizado,
      producto.texto_normalizado,
      parametros.consulta
    having
      count(*) = (select count(*) from tokens)
      and bool_and(puntaje.puntos > 0)
  ),
  resultados as (
    select
      coincidencias.id,
      coincidencias.relevancia,
      count(*) over () as total_count
    from coincidencias
  )
  select resultados.id, resultados.relevancia, resultados.total_count
  from resultados
  cross join parametros
  order by resultados.relevancia desc, resultados.id asc
  offset (select desde from parametros)
  limit (select limite from parametros);
$$;

revoke all on function public.buscar_productos_publicos(text, integer, integer)
  from public;
grant execute on function public.buscar_productos_publicos(text, integer, integer)
  to anon, authenticated;
