import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

const TAMANO_LOTE = 500;

type ResultadoPagina<T> = {
  data: T[] | null;
  error: PostgrestError | null;
  count?: number | null;
};

export async function consultarTodosSupabase<T>(
  consultarPagina: (desde: number, hasta: number) => PromiseLike<ResultadoPagina<T>>,
): Promise<ResultadoPagina<T>> {
  const filas: T[] = [];
  let totalEsperado: number | null = null;

  for (let desde = 0; ; desde = filas.length) {
    const resultado = await consultarPagina(desde, desde + TAMANO_LOTE - 1);
    if (resultado.error) return { data: null, error: resultado.error };

    const lote = resultado.data ?? [];
    totalEsperado ??= resultado.count ?? null;
    filas.push(...lote);

    if (
      lote.length === 0 ||
      (totalEsperado !== null && filas.length >= totalEsperado)
    ) {
      return { data: filas, error: null, count: totalEsperado };
    }
  }
}
