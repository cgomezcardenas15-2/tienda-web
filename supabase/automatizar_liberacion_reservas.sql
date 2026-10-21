begin;

-- Ejecuta la limpieza aunque nadie tenga abierto el administrador.
create extension if not exists pg_cron with schema extensions;

do $$
declare
  v_job_id bigint;
begin
  for v_job_id in
    select jobid
    from cron.job
    where jobname = 'nova-liberar-reservas-vencidas'
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'nova-liberar-reservas-vencidas',
    '*/5 * * * *',
    'select public.liberar_reservas_vencidas();'
  );
end;
$$;

commit;

-- Comprobación esperada: una fila con active = true.
select jobid, jobname, schedule, active
from cron.job
where jobname = 'nova-liberar-reservas-vencidas';
