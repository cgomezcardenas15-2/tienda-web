begin;

create table if not exists public.categorias_gasto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

insert into public.categorias_gasto(nombre) values
  ('Transporte'),('Publicidad'),('Empaques'),('Servicios'),('Arriendo'),('Papelería'),('Mantenimiento'),('Otros')
on conflict(nombre) do nothing;

create table if not exists public.gastos (
  id uuid primary key default gen_random_uuid(),
  consecutivo bigint generated always as identity unique,
  fecha date not null default current_date,
  categoria_id uuid not null references public.categorias_gasto(id) on delete restrict,
  descripcion text not null check(char_length(trim(descripcion)) between 3 and 300),
  valor numeric(14,2) not null check(valor>0),
  medio_pago text not null check(medio_pago in ('efectivo','transferencia','tarjeta','otro')),
  comprobante text,
  recurrente boolean not null default false,
  notas text,
  estado text not null default 'registrado' check(estado in ('registrado','anulado')),
  anulado_en timestamptz,
  creado_en timestamptz not null default now()
);

create table if not exists public.cierres_diarios (
  id uuid primary key default gen_random_uuid(),
  fecha date not null unique,
  ventas_aprobadas numeric(14,2) not null default 0,
  reembolsos numeric(14,2) not null default 0,
  gastos numeric(14,2) not null default 0,
  comisiones_pagadas numeric(14,2) not null default 0,
  saldo_esperado numeric(14,2) not null default 0,
  saldo_reportado numeric(14,2) not null default 0,
  diferencia numeric(14,2) not null default 0,
  observaciones text,
  creado_en timestamptz not null default now()
);

create index if not exists gastos_fecha_idx on public.gastos(fecha desc,estado);
create index if not exists gastos_categoria_idx on public.gastos(categoria_id,fecha desc);
alter table public.categorias_gasto enable row level security;
alter table public.gastos enable row level security;
alter table public.cierres_diarios enable row level security;
revoke all on public.categorias_gasto,public.gastos,public.cierres_diarios from public,anon,authenticated;
grant all on public.categorias_gasto,public.gastos,public.cierres_diarios to service_role;
grant usage,select on all sequences in schema public to service_role;

create or replace function public.registrar_gasto_admin(
  p_fecha date,p_categoria_id uuid,p_descripcion text,p_valor numeric,p_medio_pago text,
  p_comprobante text default null,p_recurrente boolean default false,p_notas text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  if p_fecha is null or p_fecha>current_date then raise exception 'La fecha no es válida'; end if;
  if exists(select 1 from public.cierres_diarios where fecha=p_fecha) then raise exception 'Ese día ya está cerrado'; end if;
  if not exists(select 1 from public.categorias_gasto where id=p_categoria_id and activo) then raise exception 'La categoría no está disponible'; end if;
  if char_length(trim(coalesce(p_descripcion,'')))<3 or p_valor is null or p_valor<=0 then raise exception 'Revisa la descripción y el valor'; end if;
  if p_medio_pago not in ('efectivo','transferencia','tarjeta','otro') then raise exception 'El medio de pago no es válido'; end if;
  insert into public.gastos(fecha,categoria_id,descripcion,valor,medio_pago,comprobante,recurrente,notas)
  values(p_fecha,p_categoria_id,trim(p_descripcion),p_valor,p_medio_pago,nullif(trim(coalesce(p_comprobante,'')),''),p_recurrente,nullif(trim(coalesce(p_notas,'')),'')) returning id into v_id;
  return v_id;
end $$;

create or replace function public.anular_gasto_admin(p_gasto_id uuid,p_motivo text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_fecha date; v_estado text;
begin
  select fecha,estado into v_fecha,v_estado from public.gastos where id=p_gasto_id for update;
  if not found then raise exception 'El gasto no existe'; end if;
  if exists(select 1 from public.cierres_diarios where fecha=v_fecha) then raise exception 'No se puede modificar un día cerrado'; end if;
  if v_estado='anulado' then return jsonb_build_object('ok',true,'duplicado',true); end if;
  if char_length(trim(coalesce(p_motivo,'')))<5 then raise exception 'Explica el motivo de la anulación'; end if;
  update public.gastos set estado='anulado',anulado_en=now(),notas=concat_ws(E'\n',notas,'ANULADO: '||trim(p_motivo)) where id=p_gasto_id;
  return jsonb_build_object('ok',true,'duplicado',false);
end $$;

create or replace function public.generar_cierre_diario_admin(p_fecha date,p_saldo_reportado numeric,p_observaciones text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_ventas numeric:=0;v_reembolsos numeric:=0;v_gastos numeric:=0;v_comisiones numeric:=0;v_esperado numeric:=0;
begin
  if p_fecha is null or p_fecha>current_date then raise exception 'La fecha no es válida'; end if;
  if p_saldo_reportado is null then raise exception 'Escribe el saldo reportado'; end if;
  if exists(select 1 from public.cierres_diarios where fecha=p_fecha) then raise exception 'Ese día ya fue cerrado'; end if;
  select coalesce(sum(total),0) into v_ventas from public.pedidos where estado_pago='aprobado' and creado_en::date=p_fecha;
  select coalesce(sum(d.valor_reembolso),0) into v_reembolsos from public.devoluciones d where exists(select 1 from public.historial_devoluciones h where h.devolucion_id=d.id and h.estado_nuevo='reembolsada' and h.creado_en::date=p_fecha);
  select coalesce(sum(valor),0) into v_gastos from public.gastos where fecha=p_fecha and estado='registrado';
  select coalesce(sum(total_comision),0) into v_comisiones from public.liquidaciones_comision where estado='pagada' and fecha_pago=p_fecha;
  v_esperado:=v_ventas-v_reembolsos-v_gastos-v_comisiones;
  insert into public.cierres_diarios(fecha,ventas_aprobadas,reembolsos,gastos,comisiones_pagadas,saldo_esperado,saldo_reportado,diferencia,observaciones)
  values(p_fecha,v_ventas,v_reembolsos,v_gastos,v_comisiones,v_esperado,p_saldo_reportado,p_saldo_reportado-v_esperado,nullif(trim(coalesce(p_observaciones,'')),'')) returning id into v_id;
  return v_id;
end $$;

revoke all on function public.registrar_gasto_admin(date,uuid,text,numeric,text,text,boolean,text) from public,anon,authenticated;
revoke all on function public.anular_gasto_admin(uuid,text) from public,anon,authenticated;
revoke all on function public.generar_cierre_diario_admin(date,numeric,text) from public,anon,authenticated;
grant execute on function public.registrar_gasto_admin(date,uuid,text,numeric,text,text,boolean,text) to service_role;
grant execute on function public.anular_gasto_admin(uuid,text) to service_role;
grant execute on function public.generar_cierre_diario_admin(date,numeric,text) to service_role;

commit;
