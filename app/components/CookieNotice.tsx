"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  COOKIE_PREFERENCES_OPEN_EVENT,
  getCookieConsent,
  saveCookieConsent,
  type CookieConsent,
} from "../lib/cookieConsent";

export default function CookieNotice() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setVisible(getCookieConsent() === null);
    });

    const openPreferences = () => setVisible(true);
    window.addEventListener(COOKIE_PREFERENCES_OPEN_EVENT, openPreferences);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(COOKIE_PREFERENCES_OPEN_EVENT, openPreferences);
    };
  }, []);

  const choose = (consent: CookieConsent) => {
    saveCookieConsent(consent);
    setVisible(false);
  };

  if (!visible || pathname.startsWith("/admin")) return null;

  return (
    <aside className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-[70] mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#101310]/95 p-4 text-white shadow-2xl backdrop-blur sm:bottom-4 sm:left-4 sm:right-4 sm:flex sm:items-center sm:gap-5 sm:p-5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Elige cómo medir tu experiencia</p>
        <p className="mt-1 text-xs leading-5 text-white/55 sm:text-sm">
          NOVA usa almacenamiento esencial para conservar tu carrito. Si aceptas la medición, Meta Pixel nos ayuda a saber si nuestra publicidad funciona. Puedes continuar solo con lo necesario.
        </p>
      </div>
      <div className="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-3 sm:mt-0 sm:justify-start">
        <a href="/cookies" className="text-xs font-semibold text-white/60 hover:text-white">Ver política</a>
        <button
          type="button"
          onClick={() => choose("essential")}
          className="rounded-lg border border-white/15 px-4 py-2.5 text-xs font-bold text-white hover:border-white/30 hover:bg-white/5"
        >
          Solo necesarias
        </button>
        <button
          type="button"
          onClick={() => choose("marketing")}
          className="rounded-lg bg-[#82f000] px-4 py-2.5 text-xs font-bold text-black hover:bg-[#9cff35]"
        >
          Aceptar medición
        </button>
      </div>
    </aside>
  );
}
