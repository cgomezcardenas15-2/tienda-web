export type MetaContentIdentifiable = {
  id: string;
  varianteId?: string | null;
  sku?: string | null;
};

/**
 * Meta compara los identificadores como texto exacto. Esta normalización
 * compartida evita que el feed y los eventos difieran por espacios, saltos
 * de línea o tabulaciones accidentales en un SKU.
 */
export function normalizarMetaContentId(valor: string | null | undefined) {
  return (valor ?? "").replace(/\s+/g, " ").trim();
}

export function getMetaContentId(item: MetaContentIdentifiable) {
  return (
    normalizarMetaContentId(item.sku) ||
    normalizarMetaContentId(item.varianteId) ||
    normalizarMetaContentId(item.id)
  );
}
