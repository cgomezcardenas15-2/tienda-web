# Meta Conversions API (Purchase)

NOVA conserva el píxel y el catálogo existentes. El servidor solo prepara y
envía `Purchase` después de que Wompi haya confirmado una transacción
`APPROVED` y se hayan validado referencia, valor y moneda `COP`.

## Variables privadas de producción

- `META_CONVERSIONS_API_TOKEN`: token de acceso de Conversions API. Debe existir
  solo en el servidor; nunca debe usar el prefijo `NEXT_PUBLIC_`.
- `META_GRAPH_API_VERSION`: opcional. Si se omite, se usa `v24.0`.

## Deduplicación y privacidad

- Navegador y servidor usan `event_id = purchase:<id-del-pedido>`.
- El servidor guarda el estado del evento en `meta_conversion_events` para que
  recargas, webhooks repetidos y reintentos no creen compras nuevas.
- El correo y el teléfono se normalizan y se envían con SHA-256.
- `_fbp` y `_fbc` solo se conservan y envían cuando el cliente autorizó la
  medición publicitaria.
- Sin consentimiento o sin token, el pago continúa normalmente y Meta se omite.

## Validación posterior a la activación

1. Configurar el token privado en Vercel.
2. Desplegar el commit verificado.
3. Usar una compra real controlada o una transacción aprobada autorizada.
4. Confirmar en Meta Events Manager que Pixel y CAPI muestran el mismo
   `event_id` y que Meta los deduplica como una sola compra.

Una respuesta HTTP correcta o `events_received: 1` confirma que Meta aceptó la
solicitud, pero el procesamiento y la deduplicación finales deben comprobarse en
Events Manager.
