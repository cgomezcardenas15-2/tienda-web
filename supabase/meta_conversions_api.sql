-- Consentimiento y señales opcionales para Meta Conversions API.
-- La migración es idempotente y no altera pedidos existentes: quedan sin
-- autorización de marketing por defecto.

alter table public.pedidos
  add column if not exists meta_marketing_consent boolean not null default false,
  add column if not exists meta_fbp text,
  add column if not exists meta_fbc text;

comment on column public.pedidos.meta_marketing_consent is
  'Preferencia de medición publicitaria vigente al iniciar el pago.';
comment on column public.pedidos.meta_fbp is
  'Identificador _fbp capturado únicamente con autorización de marketing.';
comment on column public.pedidos.meta_fbc is
  'Identificador _fbc capturado únicamente con autorización de marketing.';

create table if not exists public.meta_conversion_events (
  event_id text primary key,
  pedido_id uuid not null unique references public.pedidos(id) on delete cascade,
  event_name text not null check (event_name = 'Purchase'),
  event_time bigint not null default (extract(epoch from now())::bigint),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'failed', 'delivered')),
  attempts integer not null default 0 check (attempts >= 0),
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  last_http_status integer,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meta_conversion_events enable row level security;
alter table public.meta_conversion_events
  add column if not exists event_time bigint
    not null default (extract(epoch from now())::bigint);
revoke all on table public.meta_conversion_events from public, anon, authenticated;
grant select, insert, update on table public.meta_conversion_events to service_role;

create or replace function public.claim_meta_conversion_event(
  p_event_id text,
  p_pedido_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.meta_conversion_events%rowtype;
  v_attempt integer;
  v_event_time bigint;
begin
  if not exists (
    select 1
    from public.pedidos
    where id = p_pedido_id
      and estado_pago = 'aprobado'
  ) then
    raise exception 'PEDIDO_NO_APROBADO';
  end if;

  insert into public.meta_conversion_events (
    event_id,
    pedido_id,
    event_name
  ) values (
    p_event_id,
    p_pedido_id,
    'Purchase'
  )
  on conflict (event_id) do nothing;

  select *
  into v_event
  from public.meta_conversion_events
  where event_id = p_event_id
    and pedido_id = p_pedido_id
  for update;

  if not found then
    raise exception 'EVENTO_NO_COINCIDE';
  end if;

  if v_event.status = 'delivered' then
    return jsonb_build_object('claimed', false, 'reason', 'delivered');
  end if;

  if v_event.status = 'processing'
    and v_event.last_attempt_at > now() - interval '5 minutes'
  then
    return jsonb_build_object('claimed', false, 'reason', 'processing');
  end if;

  update public.meta_conversion_events
  set status = 'processing',
      attempts = attempts + 1,
      last_attempt_at = now(),
      last_http_status = null,
      last_error = null,
      updated_at = now()
  where event_id = p_event_id
  returning attempts, event_time into v_attempt, v_event_time;

  return jsonb_build_object(
    'claimed', true,
    'reason', 'ready',
    'attempt', v_attempt,
    'event_time', v_event_time
  );
end;
$$;

drop function if exists public.complete_meta_conversion_event(
  text,
  boolean,
  integer,
  text
);

create or replace function public.complete_meta_conversion_event(
  p_event_id text,
  p_attempt integer,
  p_success boolean,
  p_http_status integer default null,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.meta_conversion_events
  set status = case when p_success then 'delivered' else 'failed' end,
      delivered_at = case when p_success then now() else delivered_at end,
      last_http_status = p_http_status,
      last_error = case
        when p_success then null
        else left(coalesce(p_error, 'Error no especificado'), 500)
      end,
      updated_at = now()
  where event_id = p_event_id
    and status = 'processing'
    and attempts = p_attempt;
end;
$$;

revoke all on function public.claim_meta_conversion_event(text, uuid)
  from public, anon, authenticated;
revoke all on function public.complete_meta_conversion_event(text, integer, boolean, integer, text)
  from public, anon, authenticated;
grant execute on function public.claim_meta_conversion_event(text, uuid)
  to service_role;
grant execute on function public.complete_meta_conversion_event(text, integer, boolean, integer, text)
  to service_role;

notify pgrst, 'reload schema';
