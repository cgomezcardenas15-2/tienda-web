export default function Products() {
  const productos = [
    {
      icono: "💻",
      nombre: "Laptop Gamer",
      precio: "$2.500.000",
    },
    {
      icono: "⌨️",
      nombre: "Teclado Mecánico",
      precio: "$180.000",
    },
    {
      icono: "🖱️",
      nombre: "Mouse Gamer",
      precio: "$85.000",
    },
    {
      icono: "🎧",
      nombre: "Audífonos RGB",
      precio: "$250.000",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto py-16 px-8">
      <h2 className="text-4xl font-bold text-center mb-10">
        Productos Destacados
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {productos.map((producto, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
          >
            <div className="text-6xl mb-4">{producto.icono}</div>

            <h3 className="text-xl font-bold">
              {producto.nombre}
            </h3>

            <p className="text-blue-600 font-bold mt-2 text-lg">
              {producto.precio}
            </p>

            <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition-all">
              Agregar al carrito
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}