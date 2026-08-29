"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "nova_cookie_notice_v1";

export default function CookieNotice() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(STORAGE_KEY) !== "accepted");
  }, []);

  if (!visible || pathname.startsWith("/admin")) return null;

  return (
    <aside className="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#101310]/95 p-4 text-white shadow-2xl backdrop-blur sm:flex sm:items-center sm:gap-5 sm:p-5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Tu experiencia, sin rastreo innecesario</p>
        <p className="mt-1 text-xs leading-5 text-white/55 sm:text-sm">
          NOVA usa almacenamiento esencial para conservar tu carrito y el funcionamiento del sitio. Actualmente no usamos cookies publicitarias.
        </p>
      </div>
      <div className="mt-4 flex shrink-0 items-center gap-4 sm:mt-0">
        <a href="/cookies" className="text-xs font-semibold text-white/60 hover:text-white">Ver política</a>
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(STORAGE_KEY, "accepted");
            setVisible(false);
          }}
          className="rounded-lg bg-[#82f000] px-4 py-2.5 text-xs font-bold text-black hover:bg-[#9cff35]"
        >
          Entendido
        </button>
      </div>
    </aside>
  );
}
