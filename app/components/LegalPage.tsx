import Footer from "./Footer";

type LegalSection = { title: string; paragraphs?: string[]; items?: string[] };

export default function LegalPage({ eyebrow, title, intro, sections }: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-screen bg-[#080a08] text-white">
      <header className="border-b border-white/10 bg-[#050705]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <a href="/" className="flex items-center gap-3" aria-label="Volver al inicio de NOVA">
            <img src="/nova-symbol.png" alt="" className="h-9 w-9 object-contain" />
            <span className="font-black tracking-[0.22em]">NOVA</span>
          </a>
          <a href="/" className="text-sm font-semibold text-[#82f000] hover:text-[#9cff35]">← Volver a la tienda</a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
        <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#82f000]">{eyebrow}</span>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-white/55">{intro}</p>

        <div className="mt-10 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-5 text-sm leading-6 text-amber-100/80">
          <strong className="text-amber-200">Documento en preparación.</strong>{" "}
          NOVA continúa en modo de pruebas. Antes de habilitar ventas reales se incorporarán la razón social o nombre del responsable, NIT, dirección, teléfono y correo oficial, y se realizará la revisión legal final.
        </div>

        <div className="mt-12 grid gap-5">
          {sections.map((section, index) => (
            <section key={section.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="mt-1 text-xs font-semibold text-[#82f000]/70">{String(index + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                  {section.paragraphs?.map((paragraph) => <p key={paragraph} className="mt-4 text-sm leading-7 text-white/50">{paragraph}</p>)}
                  {section.items && (
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-white/50">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-3"><span className="text-[#82f000]">•</span><span>{item}</span></li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
