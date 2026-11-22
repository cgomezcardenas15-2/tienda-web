const condiciones = [
  {
    destino: "Cali",
    titulo: "Domicilio local por pagar",
    descripcion:
      "El valor del domicilio se confirma antes del despacho y el cliente lo paga cuando recibe la mercancía.",
  },
  {
    destino: "Resto del Valle del Cauca",
    titulo: "Flete por pagar",
    descripcion:
      "El transporte no se suma al valor de los productos. El cliente lo paga al recibir, según la tarifa confirmada.",
  },
  {
    destino: "Resto de Colombia",
    titulo: "Flete por pagar",
    descripcion:
      "El transporte no se suma al valor de los productos. El cliente lo paga al recibir, según la tarifa confirmada.",
  },
];

export default function EnviosForm() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Política activa para pedidos nuevos</p>
        <h2 className="mt-2 text-xl font-black text-white">El domicilio no está incluido en el total de productos</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
          NOVA confirma el valor del domicilio antes del despacho. El cliente paga ese valor al recibir el pedido, por separado del pago de la mercancía.
        </p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {condiciones.map((condicion) => (
          <article key={condicion.destino} className="rounded-xl border border-lime-400/25 bg-black/30 p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-400">{condicion.destino}</p>
            <h3 className="mt-2 font-black text-white">{condicion.titulo}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{condicion.descripcion}</p>
          </article>
        ))}
      </div>

      <p className="mt-6 text-sm leading-6 text-zinc-500">
        Los pedidos anteriores conservan el valor y las condiciones de envío con las que fueron creados.
      </p>
    </section>
  );
}
