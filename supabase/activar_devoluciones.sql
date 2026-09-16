begin;

create sequence if not exists public.devoluciones_numero_seq;

create table if not exists public.devoluciones (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete restrict,
  numero text not null unique,
  tipo text not null check (tipo in ('devolucion','garantia','reembolso')),
  estado text not null default 'solicitada' check (estado in ('solicitada','aprobada','rechazada','recibida','reembolsada','cerrada')),
  motivo text not null check (char_length(trim(motivo)) between 5 and 500),
  detalle text,
  valor_reembolso numeric(14,2) not null default 0 check (valor_reembolso >= 0),
  metodo_reembolso text,
  referencia_reembolso text,
  inventario_reintegrado_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.productos_devolucion (
  id bigint generated always as identity primary key,
  devolucion_id uuid not null references public.devoluciones(id) on delete cascade,
  producto_pedido_id uuid not null references public.productos_pedido(id) on delete restrict,
  producto_id uuid not null references public.productos(id) on delete restrict,
  variante_id uuid references public.variantes_producto(id) on delete restrict,
  nombre text not null,
  variante_nombre text,
  cantidad integer not null check (cantidad > 0),
  condicion text not null default 'sin_revisar' check (condicion in ('sin_revisar','nuevo','abierto','usado','danado','defectuoso')),
  reintegrar_inventario boolean not null default false,
  creado_en timestamptz not null default now(),
  unique(devolucion_id, producto_pedido_id)
);

create table if not exists public.historial_devoluciones (
  id bigint generated always as identity primary key,
  devolucion_id uuid not null references public.devoluciones(id) on delete cascade,
  estado_anterior text,
  estado_nuevo text not null,
  nota text,
  creado_en timestamptz not null default now()
);

create index if not exists devoluciones_pedido_idx on public.devoluciones(pedido_id, creado_en desc);
create index if not exists devoluciones_estado_idx on public.devoluciones(estado, creado_en desc);
create index if not exists historial_devoluciones_caso_idx on public.historial_devoluciones(devolucion_id, creado_en desc);

alter table public.devoluciones enable row level security;
alter table public.productos_devolucion enable row level security;
alter table public.historial_devoluciones enable row level security;
revoke all on public.devoluciones, public.productos_devolucion, public.historial_devoluciones from public, anon, authenticated;
grant all on public.devoluciones, public.productos_devolucion, public.historial_devoluciones to service_role;
grant usage, select on all sequences in schema public to service_role;

create or replace function public.registrar_devolucion_admin(
  p_pedido_id uuid, p_tipo text, p_motivo text, p_detalle text,
  p_valor_reembolso numeric, p_lineas jsonb
) returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_id uuid;
  v_numero text;
  v_linea jsonb;
  v_producto record;
  v_cantidad integer;
  v_previamente integer;
begin
  if p_tipo not in ('devolucion','garantia','reembolso') then raise exception 'Tipo de caso no permitido'; end if;
  if char_length(trim(coalesce(p_motivo,''))) < 5 then raise exception 'Explica el motivo del caso'; end if;
  if p_valor_reembolso is null or p_valor_reembolso < 0 then raise exception 'El valor no es válido'; end if;
  if not exists(select 1 from public.pedidos where id=p_pedido_id) then raise exception 'El pedido no existe'; end if;
  if p_lineas is null or jsonb_array_length(p_lineas)=0 then raise exception 'Selecciona al menos un producto'; end if;

  v_numero := 'DEV-' || to_char(current_date,'YYYY') || '-' || lpad(nextval('public.devoluciones_numero_seq')::text,5,'0');
  insert into public.devoluciones(pedido_id,numero,tipo,motivo,detalle,valor_reembolso)
  values(p_pedido_id,v_numero,p_tipo,trim(p_motivo),nullif(trim(coalesce(p_detalle,'')),''),p_valor_reembolso)
  returning id into v_id;

  for v_linea in select * from jsonb_array_elements(p_lineas) loop
    v_cantidad := (v_linea->>'cantidad')::integer;
    select pp.id,pp.producto_id::uuid producto_id,pp.variante_id,pp.nombre,pp.variante_nombre,pp.cantidad
      into v_producto from public.productos_pedido pp
      where pp.id=(v_linea->>'producto_pedido_id')::uuid and pp.pedido_id=p_pedido_id;
    if not found then raise exception 'Uno de los productos no pertenece al pedido'; end if;
    select coalesce(sum(pd.cantidad),0) into v_previamente
      from public.productos_devolucion pd join public.devoluciones d on d.id=pd.devolucion_id
      where pd.producto_pedido_id=v_producto.id and d.estado<>'rechazada';
    if v_cantidad<1 or v_cantidad+v_previamente>v_producto.cantidad then raise exception 'La cantidad supera lo comprado o ya gestionado'; end if;
    insert into public.productos_devolucion(devolucion_id,producto_pedido_id,producto_id,variante_id,nombre,variante_nombre,cantidad)
    values(v_id,v_producto.id,v_producto.producto_id,v_producto.variante_id,v_producto.nombre,v_producto.variante_nombre,v_cantidad);
  end loop;
  insert into public.historial_devoluciones(devolucion_id,estado_nuevo,nota) values(v_id,'solicitada','Caso creado desde el administrador');
  return v_id;
end $$;

create or replace function public.actualizar_devolucion_admin(
  p_devolucion_id uuid, p_estado text, p_nota text,
  p_metodo_reembolso text default null, p_referencia_reembolso text default null,
  p_reintegrar_inventario boolean default false
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_actual text;
  v_reintegrado timestamptz;
  v_linea record;
  v_transicion boolean;
begin
  select estado,inventario_reintegrado_en into v_actual,v_reintegrado from public.devoluciones where id=p_devolucion_id for update;
  if not found then raise exception 'El caso no existe'; end if;
  v_transicion := (v_actual='solicitada' and p_estado in ('aprobada','rechazada')) or
    (v_actual='aprobada' and p_estado in ('recibida','reembolsada','cerrada')) or
    (v_actual='recibida' and p_estado in ('reembolsada','cerrada')) or
    (v_actual='reembolsada' and p_estado='cerrada');
  if not v_transicion then raise exception 'Ese cambio de estado no está permitido'; end if;
  if p_estado='reembolsada' and char_length(trim(coalesce(p_metodo_reembolso,'')))<3 then raise exception 'Indica el medio del reembolso'; end if;

  if p_reintegrar_inventario and p_estado in ('recibida','cerrada') and v_reintegrado is null then
    for v_linea in select * from public.productos_devolucion where devolucion_id=p_devolucion_id loop
      if v_linea.variante_id is not null then
        update public.variantes_producto set stock=stock+v_linea.cantidad,actualizado_en=now() where id=v_linea.variante_id and producto_id=v_linea.producto_id;
      else
        update public.productos set stock=stock+v_linea.cantidad where id=v_linea.producto_id;
      end if;
      update public.productos_devolucion set reintegrar_inventario=true where id=v_linea.id;
    end loop;
    v_reintegrado:=now();
  end if;

  update public.devoluciones set estado=p_estado,metodo_reembolso=coalesce(nullif(trim(coalesce(p_metodo_reembolso,'')),''),metodo_reembolso),
    referencia_reembolso=coalesce(nullif(trim(coalesce(p_referencia_reembolso,'')),''),referencia_reembolso),inventario_reintegrado_en=v_reintegrado,actualizado_en=now()
    where id=p_devolucion_id;
  insert into public.historial_devoluciones(devolucion_id,estado_anterior,estado_nuevo,nota)
    values(p_devolucion_id,v_actual,p_estado,nullif(trim(coalesce(p_nota,'')),''));
  return jsonb_build_object('ok',true,'estado',p_estado,'inventario_reintegrado',v_reintegrado is not null);
end $$;

revoke all on function public.registrar_devolucion_admin(uuid,text,text,text,numeric,jsonb) from public,anon,authenticated;
revoke all on function public.actualizar_devolucion_admin(uuid,text,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.registrar_devolucion_admin(uuid,text,text,text,numeric,jsonb) to service_role;
grant execute on function public.actualizar_devolucion_admin(uuid,text,text,text,text,boolean) to service_role;

commit;
