-- NOVA solo cobra una tarifa fija dentro de Cali.
-- En el resto del país el transporte se paga al recibir.
update public.configuracion_envios
set tarifa_valle = 0,
    tarifa_nacional = 0,
    actualizado_en = now()
where id = true;

alter table public.configuracion_envios
  alter column tarifa_valle set default 0,
  alter column tarifa_nacional set default 0;
