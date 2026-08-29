begin;

create sequence if not exists public.numero_pedido_seq start with 1 increment by 1;

alter table public.pedidos
  add column if not exists numero_pedido text;

update public.pedidos
set numero_pedido = 'NOVA-' || lpad(nextval('public.numero_pedido_seq')::text, 6, '0')
where numero_pedido is null;

alter table public.pedidos
  alter column numero_pedido set not null;

create unique index if not exists pedidos_numero_pedido_unico
  on public.pedidos (numero_pedido);

create or replace function public.asignar_numero_pedido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.numero_pedido is null or btrim(new.numero_pedido) = '' then
    new.numero_pedido := 'NOVA-' || lpad(nextval('public.numero_pedido_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists pedidos_asignar_numero on public.pedidos;
create trigger pedidos_asignar_numero
before insert on public.pedidos
for each row execute function public.asignar_numero_pedido();

grant usage, select on sequence public.numero_pedido_seq to service_role;

commit;
