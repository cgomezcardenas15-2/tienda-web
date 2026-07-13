export default function Categories() {
  return (
    <section className="max-w-7xl mx-auto py-16 px-8">
      <h2 className="text-4xl font-bold text-center mb-10">
        Nuestras Categorías
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white shadow-lg rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">💻</div>
          <h3 className="text-2xl font-semibold">Tecnología</h3>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-2xl font-semibold">Piñatería</h3>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">🏠</div>
          <h3 className="text-2xl font-semibold">Hogar</h3>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">👶</div>
          <h3 className="text-2xl font-semibold">Bebés</h3>
        </div>
      </div>
    </section>
  );
}