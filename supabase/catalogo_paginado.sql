-- Catálogo público escalable para miles de productos.
-- Las funciones devuelven únicamente identificadores de una página. La
-- aplicación consulta después el detalle y las variantes de esos productos.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create extension if not exists unaccent with schema extensions;
create extension if not exists fuzzystrmatch with schema extensions;

create or replace function private.normalizar_texto_catalogo(p_valor text)
returns text
language sql
stable
set search_path = ''
as $$
  select btrim(
    regexp_replace(
      lower(extensions.unaccent(coalesce(p_valor, ''))),
      '[^a-z0-9#]+',
      ' ',
      'g'
    )
  );
$$;

create or replace function private.sinonimos_token_catalogo(p_token text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select case p_token
    when 'bombas' then array['bombas', 'globos']
    when 'globos' then array['globos', 'bombas']
    when 'lazo' then array['lazo', 'mono']
    when 'mono' then array['mono', 'lazo']
    when 'chapa' then array['chapa', 'candado']
    when 'candado' then array['candado', 'chapa']
    when 'lampara' then array['lampara', 'linterna']
    when 'linterna' then array['linterna', 'lampara']
    when 'cortar' then array['cortar', 'tijera', 'tijeras']
    when 'tijera' then array['tijera', 'tijeras', 'cortar']
    when 'tijeras' then array['tijeras', 'tijera', 'cortar']
    when 'telefono' then array['telefono', 'celular']
    when 'celular' then array['celular', 'telefono']
    when 'motocicleta' then array['motocicleta', 'moto']
    when 'moto' then array['moto', 'motocicleta']
    when 'cosmetico' then array['cosmetico', 'maquillaje']
    when 'maquillaje' then array['maquillaje', 'cosmetico']
    else array[p_token]
  end;
$$;

revoke all on function private.normalizar_texto_catalogo(text) from public;
revoke all on function private.sinonimos_token_catalogo(text) from public;
grant execute on function private.normalizar_texto_catalogo(text)
  to anon, authenticated, service_role;
grant execute on function private.sinonimos_token_catalogo(text)
  to anon, authenticated, service_role;

create or replace function public.listar_productos_publicos(
  p_categoria text default null,
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
          and private.normalizar_texto_catalogo(p.categoria) = parametros.categoria)
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
          string_agg(
            concat_ws(' ', v.nombre, v.color, v.talla, v.sku),
            ' '
            order by v.orden, v.id
          ) filter (where v.id is not null)
        )
      ) as texto_normalizado
    from public.productos as p
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
    group by p.id, p.nombre, p.descripcion, p.sku, p.categoria, p.slug
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

revoke all on function public.listar_productos_publicos(text, text, integer, integer)
  from public;
revoke all on function public.buscar_productos_publicos(text, integer, integer)
  from public;
grant execute on function public.listar_productos_publicos(text, text, integer, integer)
  to anon, authenticated;
grant execute on function public.buscar_productos_publicos(text, integer, integer)
  to anon, authenticated;

create index if not exists productos_catalogo_categoria_idx
  on public.productos (categoria, creado_en desc, id)
  where activo = true;

create index if not exists productos_catalogo_ofertas_idx
  on public.productos (creado_en desc, id)
  where activo = true and en_oferta = true;

create index if not exists productos_catalogo_destacados_idx
  on public.productos (creado_en desc, id)
  where activo = true and destacado = true;

create index if not exists variantes_catalogo_activas_idx
  on public.variantes_producto (producto_id, orden, id)
  where activo = true;
