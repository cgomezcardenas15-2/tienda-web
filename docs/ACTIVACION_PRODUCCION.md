# Activación de NOVA en producción

Este documento separa lo que ya puede probarse de lo que solo debe hacerse cuando la tienda vaya a recibir ventas reales.

## Ya preparado

- Catálogo con productos, variantes, precios y existencias.
- Checkout validado por el servidor.
- Pago Wompi Sandbox y confirmación segura de transacciones.
- Consecutivos profesionales `NOVA-000001`.
- Panel privado de pedidos, productos, variantes, envíos y consulta pública.
- Estados operativos, transportadora, guía y enlace de seguimiento.
- Consulta segura del cliente mediante número de pedido y correo.
- Recuperación de pagos pendientes.
- Protección contra pedidos duplicados.
- Alertas de existencias bajas y agotadas.

## Hacer únicamente el día de salida

1. Confirmar razón social, NIT, dirección, correo y teléfono oficiales.
2. Conectar el dominio definitivo y comprobar HTTPS.
3. Actualizar Wompi con la empresa y sustituir todas las llaves Sandbox por producción.
4. Configurar el correo empresarial remitente y probar entrega, rebotes y spam.
5. Activar WhatsApp oficial y sus plantillas aprobadas.
6. Completar textos legales definitivos con los datos reales de la empresa.
7. Eliminar los pedidos de prueba y, con respaldo y autorización, reiniciar el consecutivo para que la primera venta sea `NOVA-000001`.
8. Revisar productos reales, fotografías, precios, stock, pesos y tarifas de envío.
9. Realizar una compra real de bajo valor de principio a fin y comprobar inventario, pedido, pago, correo, guía y devolución.
10. Guardar un respaldo final antes de anunciar públicamente la tienda.

## Regla de seguridad

Nunca copiar llaves privadas, contraseñas ni secretos a capturas, mensajes, documentos o GitHub. Deben permanecer solo en las variables seguras de Vercel y en `.env.local` para desarrollo.
