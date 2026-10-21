begin;

-- Segunda barrera de idempotencia. Si Wompi crea otra transacción para un
-- pedido que ya tiene un pago registrado, la inserción se ignora y la función
-- de confirmación termina antes de volver a consumir inventario.
create or replace function public.bloquear_pago_wompi_duplicado_pedido()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.proveedor = 'wompi' and exists (
    select 1
    from public.pagos_procesados
    where pedido_id = new.pedido_id
      and proveedor = 'wompi'
  ) then
    return null;
  end if;

  return new;
end;
$$;

drop trigger if exists pagos_procesados_un_wompi_por_pedido
  on public.pagos_procesados;

create trigger pagos_procesados_un_wompi_por_pedido
before insert on public.pagos_procesados
for each row
execute function public.bloquear_pago_wompi_duplicado_pedido();

commit;
