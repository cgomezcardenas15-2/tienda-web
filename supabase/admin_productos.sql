-- Permisos exclusivos para que el servidor privado de NOVA Admin
-- pueda crear, consultar y actualizar productos.
-- No concede escritura a visitantes (anon) ni a clientes autenticados.

grant select, insert, update on table public.productos to service_role;

