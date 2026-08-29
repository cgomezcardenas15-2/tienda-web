# Respaldo y recuperación de NOVA

## Rutina recomendada

- Antes de cambios grandes: crear un respaldo de Supabase y conservar el último despliegue estable de Vercel.
- Cada semana con ventas: exportar pedidos, productos y existencias desde Supabase en formato CSV.
- Cada mes: comprobar que los archivos exportados abren correctamente y conservar una copia fuera del computador principal.
- Antes de cambiar pagos, dominio o datos legales: generar un respaldo adicional.

## Información que debe conservarse

- Pedidos y líneas de productos.
- Productos, variantes, precios y existencias.
- Configuración de envíos.
- Estados, guías y eventos de notificación.
- Código publicado en GitHub.

## Si ocurre un problema

1. No borrar datos ni ejecutar scripts de limpieza.
2. Pausar temporalmente nuevas ventas si hay riesgo para pagos o inventario.
3. Anotar la hora, el pedido afectado y el mensaje visible, sin compartir datos personales.
4. Volver al último despliegue estable en Vercel si el problema provino del código.
5. Restaurar la base de datos solo con respaldo verificado y autorización explícita.
