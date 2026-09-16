begin;

create table if not exists public.reglas_comision_proveedor (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.proveedores(id) on delete cascade,
  producto_id uuid not null references public.productos(id) on delete cascade,
  variante_id uuid references public.variantes_producto(id) on delete cascade,
  tipo text not null check (tipo in ('porcentaje','valor_fijo')),
  valor numeric(14,4) not null check (valor >= 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint comision_porcentaje_valido check (tipo <> 'porcentaje' or valor <= 100)
);

create unique index if not exists reglas_comision_destino_unico
  on public.reglas_comision_proveedor(proveedor_id,producto_id,variante_id) nulls not distinct;

create table if not exists public.liquidaciones_comision (
  id uuid primary key default gen_random_uuid(),
  consecutivo bigint generated always as identity unique,
  proveedor_id uuid not null references public.proveedores(id) on delete restrict,
  fecha_inicio date not null,
  fecha_fin date not null,
  estado text not null default 'borrador' check (estado in ('borrador','revisada','pagada','anulada')),
  ventas_brutas numeric(14,2) not null default 0,
  devoluciones numeric(14,2) not null default 0,
  ventas_netas numeric(14,2) not null default 0,
  total_comision numeric(14,2) not null default 0,
  referencia_pago text,
  fecha_pago date,
  notas text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check(fecha_fin >= fecha_inicio)
);

create table if not exists public.lineas_liquidacion_comision (
  id uuid primary key default gen_random_uuid(),
  liquidacion_id uuid not null references public.liquidaciones_comision(id) on delete cascade,
  producto_pedido_id uuid not null references public.productos_pedido(id) on delete restrict,
  pedido_id uuid not null references public.pedidos(id) on delete restrict,
  numero_pedido text not null,
  producto_nombre text not null,
  variante_nombre text,
  cantidad_vendida integer not null,
  cantidad_devuelta integer not null default 0,
  cantidad_liquidada integer not null,
  precio_unitario numeric(14,2) not null,
  base_neta numeric(14,2) not null,
  tipo_comision text not null,
  valor_regla numeric(14,4) not null,
  valor_comision numeric(14,2) not null,
  activo_para_pago boolean not null default true
);

create table if not exists public.historial_liquidaciones_comision (
  id bigint generated always as identity primary key,
  liquidacion_id uuid not null references public.liquidaciones_comision(id) on delete cascade,
  estado_anterior text,
  estado_nuevo text not null,
  nota text,
  creado_en timestamptz not null default now()
);

create index if not exists reglas_comision_proveedor_idx on public.reglas_comision_proveedor(proveedor_id,activo);
create index if not exists liquidaciones_proveedor_fecha_idx on public.liquidaciones_comision(proveedor_id,fecha_inicio,fecha_fin);
create unique index if not exists linea_venta_liquidada_una_vez on public.lineas_liquidacion_comision(producto_pedido_id) where activo_para_pago;

alter table public.reglas_comision_proveedor enable row level security;
alter table public.liquidaciones_comision enable row level security;
alter table public.lineas_liquidacion_comision enable row level security;
alter table public.historial_liquidaciones_comision enable row level security;
revoke all on public.reglas_comision_proveedor,public.liquidaciones_comision,public.lineas_liquidacion_comision,public.historial_liquidaciones_comision from public,anon,authenticated;
grant all on public.reglas_comision_proveedor,public.liquidaciones_comision,public.lineas_liquidacion_comision,public.historial_liquidaciones_comision to service_role;
grant usage,select on all sequences in schema public to service_role;

create or replace function public.generar_liquidacion_comision(
  p_proveedor_id uuid,p_fecha_inicio date,p_fecha_fin date,p_notas text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_lineas integer;
begin
  if p_fecha_inicio is null or p_fecha_fin is null or p_fecha_fin<p_fecha_inicio then raise exception 'El periodo no es válido'; end if;
  if not exists(select 1 from public.proveedores where id=p_proveedor_id and activo) then raise exception 'El proveedor no está activo'; end if;
  if exists(select 1 from public.liquidaciones_comision where proveedor_id=p_proveedor_id and estado<>'anulada' and daterange(fecha_inicio,fecha_fin,'[]') && daterange(p_fecha_inicio,p_fecha_fin,'[]')) then raise exception 'Ya existe una liquidación que cruza este periodo'; end if;

  insert into public.liquidaciones_comision(proveedor_id,fecha_inicio,fecha_fin,notas)
  values(p_proveedor_id,p_fecha_inicio,p_fecha_fin,nullif(trim(coalesce(p_notas,'')),'')) returning id into v_id;

  insert into public.lineas_liquidacion_comision(liquidacion_id,producto_pedido_id,pedido_id,numero_pedido,producto_nombre,variante_nombre,cantidad_vendida,cantidad_devuelta,cantidad_liquidada,precio_unitario,base_neta,tipo_comision,valor_regla,valor_comision)
  select v_id,pp.id,p.id,p.numero_pedido,pp.nombre,pp.variante_nombre,pp.cantidad,
    least(pp.cantidad,coalesce(dev.cantidad,0)),greatest(pp.cantidad-coalesce(dev.cantidad,0),0),pp.precio_unitario,
    greatest(pp.cantidad-coalesce(dev.cantidad,0),0)*pp.precio_unitario,r.tipo,r.valor,
    round(case when r.tipo='porcentaje' then (greatest(pp.cantidad-coalesce(dev.cantidad,0),0)*pp.precio_unitario)*(r.valor/100) else greatest(pp.cantidad-coalesce(dev.cantidad,0),0)*r.valor end,2)
  from public.productos_pedido pp
  join public.pedidos p on p.id=pp.pedido_id
  join public.reglas_comision_proveedor r on r.proveedor_id=p_proveedor_id and r.producto_id=pp.producto_id::uuid and r.variante_id is not distinct from pp.variante_id and r.activo
  left join lateral (
    select sum(pd.cantidad)::integer cantidad from public.productos_devolucion pd join public.devoluciones d on d.id=pd.devolucion_id
    where pd.producto_pedido_id=pp.id and d.estado in ('recibida','reembolsada','cerrada')
  ) dev on true
  where p.estado_pago='aprobado' and p.creado_en::date between p_fecha_inicio and p_fecha_fin
    and greatest(pp.cantidad-coalesce(dev.cantidad,0),0)>0
    and not exists(select 1 from public.lineas_liquidacion_comision lc where lc.producto_pedido_id=pp.id and lc.activo_para_pago);

  get diagnostics v_lineas=row_count;
  if v_lineas=0 then raise exception 'No hay ventas nuevas para liquidar en este periodo'; end if;
  update public.liquidaciones_comision l set
    ventas_brutas=x.brutas,devoluciones=x.dev,ventas_netas=x.netas,total_comision=x.comision,actualizado_en=now()
  from (select liquidacion_id,sum(cantidad_vendida*precio_unitario) brutas,sum(cantidad_devuelta*precio_unitario) dev,sum(base_neta) netas,sum(valor_comision) comision from public.lineas_liquidacion_comision where liquidacion_id=v_id group by liquidacion_id) x
  where l.id=x.liquidacion_id;
  insert into public.historial_liquidaciones_comision(liquidacion_id,estado_nuevo,nota) values(v_id,'borrador','Liquidación generada automáticamente');
  return v_id;
end $$;

create or replace function public.actualizar_estado_liquidacion_comision(
  p_liquidacion_id uuid,p_estado text,p_nota text default null,p_referencia_pago text default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_actual text;
begin
  select estado into v_actual from public.liquidaciones_comision where id=p_liquidacion_id for update;
  if not found then raise exception 'La liquidación no existe'; end if;
  if not ((v_actual='borrador' and p_estado in ('revisada','anulada')) or (v_actual='revisada' and p_estado in ('pagada','anulada'))) then raise exception 'Ese cambio de estado no está permitido'; end if;
  if p_estado='pagada' and char_length(trim(coalesce(p_referencia_pago,'')))<3 then raise exception 'Registra la referencia del pago'; end if;
  update public.liquidaciones_comision set estado=p_estado,referencia_pago=case when p_estado='pagada' then trim(p_referencia_pago) else referencia_pago end,fecha_pago=case when p_estado='pagada' then current_date else fecha_pago end,actualizado_en=now() where id=p_liquidacion_id;
  if p_estado='anulada' then update public.lineas_liquidacion_comision set activo_para_pago=false where liquidacion_id=p_liquidacion_id; end if;
  insert into public.historial_liquidaciones_comision(liquidacion_id,estado_anterior,estado_nuevo,nota) values(p_liquidacion_id,v_actual,p_estado,nullif(trim(coalesce(p_nota,'')),''));
  return jsonb_build_object('ok',true,'estado',p_estado);
end $$;

revoke all on function public.generar_liquidacion_comision(uuid,date,date,text) from public,anon,authenticated;
revoke all on function public.actualizar_estado_liquidacion_comision(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.generar_liquidacion_comision(uuid,date,date,text) to service_role;
grant execute on function public.actualizar_estado_liquidacion_comision(uuid,text,text,text) to service_role;

commit;
