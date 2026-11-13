import { getMetaContentId } from "./metaContentId.ts";

import type { MetaEventParameters } from "./metaPixel";

export type MetaViewContentProduct = {
  id: string;
  sku: string | null;
  nombre: string;
  precio: number;
};

export type MetaViewContentVariant = {
  id: string;
  sku: string;
  precio: number | null;
};

export type MetaViewContent = {
  eventKey: string;
  parameters: MetaEventParameters;
};

/**
 * El feed de Meta publica cada variante como un artículo independiente.
 * Por eso un producto con variantes solo puede generar ViewContent cuando
 * conocemos la variante real que el cliente está viendo.
 */
export function buildMetaViewContent({
  producto,
  variante,
  tieneVariantes,
}: {
  producto: MetaViewContentProduct;
  variante?: MetaViewContentVariant;
  tieneVariantes: boolean;
}): MetaViewContent | null {
  if (tieneVariantes && !variante) return null;

  const contentId = getMetaContentId({
    id: variante?.id ?? producto.id,
    varianteId: variante?.id,
    sku: variante?.sku ?? producto.sku,
  });
  const precio = Number(variante?.precio ?? producto.precio);

  if (!contentId || !Number.isFinite(precio) || precio <= 0) return null;

  return {
    eventKey: `${producto.id}:${contentId}`,
    parameters: {
      content_ids: [contentId],
      content_type: "product",
      contents: [{ id: contentId, quantity: 1, item_price: precio }],
      currency: "COP",
      value: precio,
      content_name: producto.nombre,
      num_items: 1,
    },
  };
}
