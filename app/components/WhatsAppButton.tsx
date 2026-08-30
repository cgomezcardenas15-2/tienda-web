"use client";

import { usePathname } from "next/navigation";

const WHATSAPP_URL =
  "https://wa.me/573105238430?text=Hola%2C%20vengo%20de%20la%20p%C3%A1gina%20de%20NOVA%20y%20necesito%20informaci%C3%B3n.";

export default function WhatsAppButton() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hablar con NOVA por WhatsApp"
      title="¿Necesitas ayuda? Escríbenos por WhatsApp"
      className="group fixed bottom-5 right-5 z-[60] flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_35px_rgba(37,211,102,0.35)] transition hover:-translate-y-1 hover:bg-[#20bd5a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#82f000] sm:h-16 sm:w-16"
    >
      <span className="pointer-events-none absolute right-[calc(100%+12px)] hidden whitespace-nowrap rounded-xl border border-white/10 bg-[#101310] px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-xl transition group-hover:opacity-100 sm:block">
        ¿Necesitas ayuda?
      </span>

      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="h-8 w-8 fill-current sm:h-9 sm:w-9"
      >
        <path d="M16.04 3C8.86 3 3.02 8.78 3.02 15.9c0 2.27.6 4.49 1.74 6.44L3 28.78l6.63-1.72a13.1 13.1 0 0 0 6.4 1.63h.01c7.18 0 13.02-5.79 13.02-12.9C29.06 8.78 23.22 3 16.04 3Zm0 23.52h-.01a10.9 10.9 0 0 1-5.56-1.52l-.4-.24-3.94 1.03 1.05-3.82-.26-.4a10.65 10.65 0 0 1-1.68-5.68c0-5.93 4.85-10.75 10.81-10.75 5.96 0 10.8 4.82 10.8 10.75 0 5.92-4.85 10.74-10.81 10.74Zm5.93-8.04c-.32-.16-1.92-.94-2.22-1.05-.3-.1-.51-.16-.73.16-.22.32-.84 1.05-1.03 1.26-.19.21-.38.24-.7.08-.33-.16-1.38-.5-2.62-1.6a9.78 9.78 0 0 1-1.82-2.25c-.19-.32-.02-.5.14-.66.15-.14.33-.37.49-.56.16-.19.22-.32.32-.53.11-.21.06-.4-.02-.56-.08-.16-.73-1.75-1-2.39-.27-.63-.54-.54-.73-.55h-.62c-.22 0-.57.08-.87.4-.3.32-1.14 1.1-1.14 2.69 0 1.58 1.16 3.11 1.32 3.32.16.21 2.28 3.46 5.52 4.85.77.33 1.37.53 1.84.68.77.24 1.47.21 2.03.13.62-.09 1.92-.78 2.19-1.53.27-.75.27-1.4.19-1.53-.08-.13-.3-.21-.62-.37Z" />
      </svg>
    </a>
  );
}
