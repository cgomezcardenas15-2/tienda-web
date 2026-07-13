export default function Navbar() {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">

        <h1 className="text-2xl font-bold text-blue-600">
          🚀 Tienda Cristian
        </h1>

        <div className="flex gap-8">
          <a href="#">Inicio</a>
          <a href="#">Productos</a>
          <a href="#">Contacto</a>
          <a href="#">🛒 Carrito</a>
        </div>

      </div>
    </nav>
  );
}