export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.08] bg-[#050705] text-white">
      <div className="pointer-events-none absolute -bottom-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#82f000]/[0.06] blur-[110px]" />
      <div className="relative mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr]">
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

          {/* Explorar */}
          <div>
            <h3 className="text-sm font-semibold text-white">Explorar</h3>

            <div className="mt-5 flex flex-col gap-3 text-sm text-white/45">
              <a href="/#productos" className="transition hover:text-[#82f000]">
                Todos los productos
              </a>
              <a href="/#categorias" className="transition hover:text-[#82f000]">
                Categorías
              </a>
              <a href="/categoria/pinateria" className="transition hover:text-[#82f000]">
                Piñatería
              </a>
              <a href="/categoria/hogar" className="transition hover:text-[#82f000]">
                Hogar
              </a>
              <a href="/categoria/mascotas" className="transition hover:text-[#82f000]">
                Mascotas
              </a>
              <a href="/carrito" className="transition hover:text-[#82f000]">
                Mi carrito
              </a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white">Información legal</h3>

            <div className="mt-5 flex flex-col gap-3 text-sm text-white/45">
              <a href="/terminos" className="transition hover:text-[#82f000]">
                Términos y condiciones
              </a>
              <a href="/privacidad" className="transition hover:text-[#82f000]">
                Privacidad y datos personales
              </a>
              <a href="/cookies" className="transition hover:text-[#82f000]">
                Política de cookies
              </a>
              <a href="https://www.sic.gov.co/" target="_blank" rel="noreferrer" className="transition hover:text-[#82f000]">
                Protección al consumidor ↗
              </a>
            </div>
          </div>
        </div>

        {/* Parte inferior */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/[0.08] pt-6 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} NOVA. Todos los derechos reservados.
          </p>

          <div className="flex flex-wrap gap-5">
            <a href="/terminos" className="transition hover:text-white/60">
              Términos
            </a>

            <a href="/privacidad" className="transition hover:text-white/60">
              Privacidad
            </a>

            <a href="/cookies" className="transition hover:text-white/60">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
