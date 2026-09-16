import { requireAdmin } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { AnularGasto, CierreForm, GastoForm } from "./CajaForms";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const date = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTime = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function bogotaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function CajaPage() {
  await requireAdmin();
  const supabase = supabaseAdmin;
  const today = bogotaDate();
  const monthStart = `${today.slice(0, 7)}-01`;

  const [categoriesResult, expensesResult, closuresResult, monthResult, todayResult] =
    await Promise.all([
      supabase
        .from("categorias_gasto")
        .select("id,nombre")
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("gastos")
        .select(
          "id,fecha,descripcion,valor,medio_pago,comprobante,recurrente,estado,creado_en,categorias_gasto(nombre)",
        )
        .order("fecha", { ascending: false })
        .order("creado_en", { ascending: false })
        .limit(80),
      supabase
        .from("cierres_diarios")
        .select(
          "id,fecha,ventas_aprobadas,reembolsos,gastos,comisiones_pagadas,saldo_esperado,saldo_reportado,diferencia,observaciones,creado_en",
        )
        .order("fecha", { ascending: false })
        .limit(40),
      supabase
        .from("gastos")
        .select("valor")
        .eq("estado", "registrado")
        .gte("fecha", monthStart)
        .lte("fecha", today),
      supabase
        .from("gastos")
        .select("valor")
        .eq("estado", "registrado")
        .eq("fecha", today),
    ]);

  const moduleError =
    categoriesResult.error ||
    expensesResult.error ||
    closuresResult.error ||
    monthResult.error ||
    todayResult.error;

  const categories = (categoriesResult.data ?? []) as { id: string; nombre: string }[];
  const expenses = (expensesResult.data ?? []) as Array<Record<string, any>>;
  const closures = (closuresResult.data ?? []) as Array<Record<string, any>>;
  const monthRows = (monthResult.data ?? []) as { valor: number | string | null }[];
  const todayRows = (todayResult.data ?? []) as { valor: number | string | null }[];
  const monthTotal = monthRows.reduce(
    (sum, row) => sum + Number(row.valor || 0),
    0,
  );
  const todayTotal = todayRows.reduce(
    (sum, row) => sum + Number(row.valor || 0),
    0,
  );
  const todayClosed = closures.some((closure) => closure.fecha === today);

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[.24em] text-lime-400">CONTROL FINANCIERO</p>
            <h1 className="mt-2 text-3xl font-black">Caja, gastos y cierres</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Registra las salidas de dinero y confirma al final del día que la
              caja coincide.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="/api/admin/exportar/gastos" download className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold hover:border-lime-400">Descargar gastos Excel</a>
            <a href="/api/admin/exportar/cierres" download className="rounded-xl border border-lime-400/40 px-4 py-2 text-sm font-bold text-lime-300 hover:bg-lime-400/10">Descargar cierres Excel</a>
            <span className={`rounded-full px-4 py-2 text-xs font-black uppercase ${todayClosed ? "bg-lime-950 text-lime-300" : "bg-amber-950 text-amber-300"}`}>
              {todayClosed ? "Día cerrado" : "Cierre pendiente"}
            </span>
          </div>
        </div>

        {moduleError ? (
          <div className="mt-7 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 text-amber-200">
            <strong>Falta activar el módulo de caja.</strong>
            <p className="mt-1 text-sm">
              Ejecuta el archivo activar_gastos_cierres.sql en Supabase y luego
              actualiza esta página.
            </p>
          </div>
        ) : null}

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <span className="text-sm text-zinc-400">Gastos de hoy</span>
            <strong className="mt-2 block text-3xl">{money.format(todayTotal)}</strong>
          </article>
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <span className="text-sm text-zinc-400">Gastos del mes</span>
            <strong className="mt-2 block text-3xl">{money.format(monthTotal)}</strong>
          </article>
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <span className="text-sm text-zinc-400">Cierres registrados</span>
            <strong className="mt-2 block text-3xl">{closures.length}</strong>
          </article>
        </div>

        {!moduleError ? (
          <div className="mt-7 grid items-start gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[.2em] text-lime-400">NUEVO MOVIMIENTO</p>
                <h2 className="mt-2 text-xl font-black">Registrar gasto</h2>
                <p className="mt-1 text-sm text-zinc-400">Deja soporte de cada salida de dinero del negocio.</p>
              </div>
              <GastoForm categorias={categories} />
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[.2em] text-lime-400">FIN DEL DÍA</p>
                <h2 className="mt-2 text-xl font-black">Realizar cierre</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  El sistema calcula ventas, devoluciones, gastos y comisiones.
                </p>
              </div>
              <CierreForm />
            </section>
          </div>
        ) : null}

        <section className="mt-7 overflow-hidden rounded-2xl border border-zinc-800">
          <div className="bg-zinc-900 px-6 py-5">
            <h2 className="text-xl font-black">Gastos recientes</h2>
            <p className="mt-1 text-sm text-zinc-400">Movimientos operativos registrados en la caja.</p>
          </div>
          {expenses.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead>
                  <tr className="bg-zinc-950 text-xs uppercase text-zinc-500">
                    <th>Fecha</th>
                    <th>Categoría y concepto</th>
                    <th>Pago</th>
                    <th>Valor</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => {
                    const relation = expense.categorias_gasto as
                      | { nombre?: string }
                      | { nombre?: string }[]
                      | null;
                    const category = Array.isArray(relation)
                      ? relation[0]?.nombre
                      : relation?.nombre;
                    return (
                      <tr key={expense.id} className="border-t border-zinc-800">
                        <td>{date.format(new Date(`${expense.fecha}T12:00:00`))}</td>
                        <td>
                          <strong className="block">{category || "Sin categoría"}</strong>
                          <small className="block text-zinc-400">{expense.descripcion}</small>
                          {expense.comprobante ? (
                            <small className="block text-zinc-500">Soporte: {expense.comprobante}</small>
                          ) : null}
                        </td>
                        <td>
                          {expense.medio_pago || "No indicado"}
                          {expense.recurrente ? <small className="block text-zinc-500">Recurrente</small> : null}
                        </td>
                        <td>{money.format(Number(expense.valor || 0))}</td>
                        <td>
                          <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${expense.estado === "registrado" ? "bg-lime-950 text-lime-300" : "bg-red-950 text-red-300"}`}>
                            {expense.estado === "registrado" ? "Registrado" : "Anulado"}
                          </span>
                        </td>
                        <td>
                          {expense.estado === "registrado" ? (
                            <AnularGasto id={expense.id} />
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-7 text-zinc-400">Todavía no hay gastos registrados.</p>
          )}
        </section>

        <section className="mt-7 overflow-hidden rounded-2xl border border-zinc-800">
          <div className="bg-zinc-900 px-6 py-5">
            <h2 className="text-xl font-black">Historial de cierres</h2>
            <p className="mt-1 text-sm text-zinc-400">Cada cierre conserva la fotografía financiera de ese día.</p>
          </div>
          {closures.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="bg-zinc-950 text-xs uppercase text-zinc-500">
                    <th>Fecha</th>
                    <th>Ventas</th>
                    <th>Descuentos</th>
                    <th>Esperado</th>
                    <th>Reportado</th>
                    <th>Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {closures.map((closure) => {
                    const difference = Number(closure.diferencia || 0);
                    return (
                      <tr key={closure.id} className="border-t border-zinc-800">
                        <td>
                          <strong className="block">
                            {date.format(new Date(`${closure.fecha}T12:00:00`))}
                          </strong>
                          <small className="block text-zinc-500">{dateTime.format(new Date(closure.creado_en))}</small>
                        </td>
                        <td>{money.format(Number(closure.ventas_aprobadas || 0))}</td>
                        <td>
                          <small className="block text-zinc-400">
                            Reembolsos: {money.format(Number(closure.reembolsos || 0))}
                          </small>
                          <small className="block text-zinc-400">Gastos: {money.format(Number(closure.gastos || 0))}</small>
                          <small className="block text-zinc-400">
                            Comisiones: {money.format(Number(closure.comisiones_pagadas || 0))}
                          </small>
                        </td>
                        <td>{money.format(Number(closure.saldo_esperado || 0))}</td>
                        <td>{money.format(Number(closure.saldo_reportado || 0))}</td>
                        <td>
                          <strong
                            className={
                              difference === 0
                                ? "text-lime-300"
                                : difference < 0
                                  ? "text-red-300"
                                  : "text-amber-300"
                            }
                          >
                            {money.format(difference)}
                          </strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-7 text-zinc-400">Todavía no hay cierres registrados.</p>
          )}
        </section>
      </section>
    </main>
  );
}
