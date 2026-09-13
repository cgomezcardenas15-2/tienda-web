begin;

alter table public.productos add column if not exists costo_promedio numeric(14,4) not null default 0 check (costo_promedio>=0);
alter table public.variantes_producto add column if not exists costo_promedio numeric(14,4) not null default 0 check (costo_promedio>=0);
alter table public.productos_pedido add column if not exists costo_unitario_capturado numeric(14,4) check (costo_unitario_capturado>=0);

-- Recupera un costo inicial de las compras ya recibidas y vinculadas.
with costos as (
  select pc.producto_id,pc.variante_id,sum(pc.cantidad*pc.costo_unitario)/nullif(sum(pc.cantidad),0) promedio
  from public.productos_compra pc join public.compras c on c.id=pc.compra_id
  where c.estado='recibida' and c.moneda='COP' and pc.producto_id is not null
  group by pc.producto_id,pc.variante_id
)
update public.variantes_producto v set costo_promedio=costos.promedio from costos
where costos.variante_id=v.id and costos.producto_id=v.producto_id and v.costo_promedio=0;

with costos as (
  select pc.producto_id,sum(pc.cantidad*pc.costo_unitario)/nullif(sum(pc.cantidad),0) promedio
  from public.productos_compra pc join public.compras c on c.id=pc.compra_id
  where c.estado='recibida' and c.moneda='COP' and pc.producto_id is not null and pc.variante_id is null
  group by pc.producto_id
)
update public.productos p set costo_promedio=costos.promedio from costos
where costos.producto_id=p.id and p.costo_promedio=0;

create or replace function public.recibir_compra_inventario(p_compra_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_compra record; v_linea record; v_lineas integer:=0; v_stock integer; v_costo numeric; v_costo_ingreso numeric; v_factor numeric;
begin
  select estado,moneda,subtotal,total into v_compra from public.compras where id=p_compra_id for update;
  if not found then raise exception 'La compra no existe'; end if;
  if v_compra.estado='recibida' then return jsonb_build_object('procesada',false,'duplicada',true); end if;
  if v_compra.estado<>'ordenada' then raise exception 'La compra debe estar ordenada'; end if;
  if v_compra.moneda<>'COP' then raise exception 'Configura la conversión a COP antes de recibir compras en otra moneda'; end if;
  v_factor:=case when v_compra.subtotal>0 then v_compra.total/v_compra.subtotal else 1 end;

  for v_linea in select producto_id,variante_id,cantidad,costo_unitario from public.productos_compra where compra_id=p_compra_id order by producto_id,variante_id nulls first loop
    v_lineas:=v_lineas+1;
    if v_linea.producto_id is null then raise exception 'Hay productos sin vincular'; end if;
    v_costo_ingreso:=v_linea.costo_unitario*v_factor;
    if v_linea.variante_id is not null then
      select stock,costo_promedio into v_stock,v_costo from public.variantes_producto where id=v_linea.variante_id and producto_id=v_linea.producto_id for update;
      if not found then raise exception 'La variante vinculada no existe'; end if;
      update public.variantes_producto set costo_promedio=case when stock+v_linea.cantidad=0 then v_costo_ingreso else ((stock*costo_promedio)+(v_linea.cantidad*v_costo_ingreso))/(stock+v_linea.cantidad) end,stock=stock+v_linea.cantidad,actualizado_en=now() where id=v_linea.variante_id;
    else
      select stock,costo_promedio into v_stock,v_costo from public.productos where id=v_linea.producto_id for update;
      if not found then raise exception 'El producto vinculado no existe'; end if;
      update public.productos set costo_promedio=case when stock+v_linea.cantidad=0 then v_costo_ingreso else ((stock*costo_promedio)+(v_linea.cantidad*v_costo_ingreso))/(stock+v_linea.cantidad) end,stock=stock+v_linea.cantidad where id=v_linea.producto_id;
    end if;
  end loop;
  if v_lineas=0 then raise exception 'La compra no contiene productos'; end if;
  update public.compras set estado='recibida',fecha_recepcion=current_date,actualizado_en=now() where id=p_compra_id;
  return jsonb_build_object('procesada',true,'duplicada',false);
end $$;

revoke all on function public.recibir_compra_inventario(uuid) from public,anon,authenticated;
grant execute on function public.recibir_compra_inventario(uuid) to service_role;
grant select,insert,update on public.productos,public.variantes_producto,public.productos_pedido to service_role;

commit;
