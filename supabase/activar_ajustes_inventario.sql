begin;

create table if not exists public.ajustes_inventario (
  id bigint generated always as identity primary key,
  producto_id uuid not null references public.productos(id) on delete restrict,
  variante_id uuid references public.variantes_producto(id) on delete restrict,
  tipo text not null check (tipo in ('correccion_entrada','correccion_salida','danio','perdida','devolucion_proveedor')),
  cantidad integer not null check (cantidad > 0),
  diferencia integer not null,
  cantidad_anterior integer not null,
  cantidad_nueva integer not null,
  motivo text not null check (char_length(trim(motivo)) between 5 and 500),
  creado_en timestamptz not null default now()
);

create index if not exists ajustes_inventario_fecha_idx on public.ajustes_inventario(creado_en desc);
alter table public.ajustes_inventario enable row level security;
revoke all on public.ajustes_inventario from public, anon, authenticated;
grant all on public.ajustes_inventario to service_role;
grant usage, select on all sequences in schema public to service_role;

create or replace function public.registrar_ajuste_inventario(
  p_producto_id uuid,
  p_variante_id uuid,
  p_tipo text,
  p_cantidad integer,
  p_motivo text
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_anterior integer;
  v_nuevo integer;
  v_diferencia integer;
  v_controla boolean;
begin
  if p_tipo not in ('correccion_entrada','correccion_salida','danio','perdida','devolucion_proveedor') then raise exception 'Tipo de ajuste no permitido'; end if;
  if p_cantidad is null or p_cantidad < 1 then raise exception 'La cantidad debe ser mayor a cero'; end if;
  if char_length(trim(coalesce(p_motivo,''))) < 5 then raise exception 'Explica el motivo del ajuste'; end if;

  v_diferencia := case when p_tipo='correccion_entrada' then p_cantidad else -p_cantidad end;
  if p_variante_id is not null then
    select stock,controla_stock into v_anterior,v_controla from public.variantes_producto where id=p_variante_id and producto_id=p_producto_id for update;
    if not found then raise exception 'La variante no corresponde al producto'; end if;
    if not v_controla then raise exception 'Esta variante no controla existencias'; end if;
    v_nuevo:=v_anterior+v_diferencia;
    if v_nuevo<0 then raise exception 'El ajuste dejaría existencias negativas'; end if;
    update public.variantes_producto set stock=v_nuevo,actualizado_en=now() where id=p_variante_id;
  else
    select stock,controla_stock into v_anterior,v_controla from public.productos where id=p_producto_id for update;
    if not found then raise exception 'Producto no encontrado'; end if;
    if not v_controla then raise exception 'Este producto no controla existencias'; end if;
    v_nuevo:=v_anterior+v_diferencia;
    update public.productos set stock=v_nuevo where id=p_producto_id;
  end if;

  insert into public.ajustes_inventario(producto_id,variante_id,tipo,cantidad,diferencia,cantidad_anterior,cantidad_nueva,motivo)
  values(p_producto_id,p_variante_id,p_tipo,p_cantidad,v_diferencia,v_anterior,v_nuevo,p_motivo);
  return jsonb_build_object('ok',true,'anterior',v_anterior,'nuevo',v_nuevo,'diferencia',v_diferencia);
end $$;

revoke all on function public.registrar_ajuste_inventario(uuid,uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.registrar_ajuste_inventario(uuid,uuid,text,integer,text) to service_role;

commit;
