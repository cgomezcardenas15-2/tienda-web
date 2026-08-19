export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.08] bg-[#050705] text-white">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Marca */}
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/nova-symbol.png"
                alt="Símbolo de NOVA"
                className="h-10 w-10 object-contain"
              />

              <div>
                <p className="text-xl font-semibold tracking-[0.22em]">
                  NOVA
                </p>

                <p className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-[#82f000]">
                  TODO LO QUE NECESITAS
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-xs text-sm leading-6 text-white/40">
              Productos útiles para tu día a día, organizados de forma sencilla
              y con acompañamiento cuando lo necesites.
            </p>
          </div>

          {/* Categorías */}
          <div>
            <h3 className="text-sm font-semibold text-white">
              Categorías
            </h3>

            <div className="mt-5 flex flex-col gap-3 text-sm text-white/45">
              <a href="#tecnologia" className="transition hover:text-[#82f000]">
                Tecnología y accesorios
              </a>

              <a href="#hogar" className="transition hover:text-[#82f000]">
                Hogar
              </a>

              <a href="#pinateria" className="transition hover:text-[#82f000]">
                Piñatería
              </a>

              <a href="#mascotas" className="transition hover:text-[#82f000]">
                Mascotas
              </a>

              <a href="#ferreteria" className="transition hover:text-[#82f000]">
                Ferretería
              </a>
            </div>
          </div>

          {/* Ayuda */}
          <div>
            <h3 className="text-sm font-semibold text-white">
              Ayuda
            </h3>

            <div className="mt-5 flex flex-col gap-3 text-sm text-white/45">
              <a href="#" className="transition hover:text-[#82f000]">
                Guía NOVA
              </a>

              <a href="#" className="transition hover:text-[#82f000]">
                Preguntas frecuentes
              </a>

              <a href="#" className="transition hover:text-[#82f000]">
                Envíos
              </a>

              <a href="#" className="transition hover:text-[#82f000]">
                Cambios y devoluciones
              </a>

              <a href="#" className="transition hover:text-[#82f000]">
                Contacto
              </a>
            </div>
          </div>

          {/* Información */}
          <div>
            <h3 className="text-sm font-semibold text-white">
              Compra con confianza
            </h3>

            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-[#82f000]">✓</span>

                <div>
                  <p className="text-sm font-medium text-white/80">
                    Compra segura
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/35">
                    Procesos claros y acompañamiento durante tu compra.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-[#82f000]">✓</span>

                <div>
                  <p className="text-sm font-medium text-white/80">
                    Guía NOVA
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/35">
                    Si necesitas ayuda, podrás recibir orientación paso a paso.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Parte inferior */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/[0.08] pt-6 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} NOVA. Todos los derechos reservados.
          </p>

          <div className="flex flex-wrap gap-5">
            <a href="#" className="transition hover:text-white/60">
              Términos
            </a>

            <a href="#" className="transition hover:text-white/60">
              Privacidad
            </a>

            <a href="#" className="transition hover:text-white/60">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}