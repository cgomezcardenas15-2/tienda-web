"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  COOKIE_CONSENT_EVENT,
  type CookieConsent,
  getCookieConsent,
} from "../lib/cookieConsent";
import {
  META_PIXEL_ID,
  canUseMetaPixel,
  clearPendingMetaEvents,
  flushPendingMetaEvents,
} from "../lib/metaPixel";

export default function MetaPixel() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const syncConsent = (consent = getCookieConsent()) => {
      const nextEnabled = consent === "marketing" && canUseMetaPixel(pathname);
      if (!nextEnabled) clearPendingMetaEvents();
      setEnabled(nextEnabled);
    };

    syncConsent();

    const handleConsent = (event: Event) => {
      syncConsent((event as CustomEvent<CookieConsent>).detail);
    };

    window.addEventListener(COOKIE_CONSENT_EVENT, handleConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, handleConsent);
  }, [pathname]);

  useEffect(() => {
    if (!enabled || pathname.startsWith("/admin")) {
      lastTrackedPath.current = null;
      return;
    }

    if (!loaded) return;
    if (lastTrackedPath.current === null) {
      window.fbq?.("track", "PageView");
      lastTrackedPath.current = pathname;
      return;
    }
    if (lastTrackedPath.current === pathname) return;

    window.fbq?.("track", "PageView");
    lastTrackedPath.current = pathname;
  }, [enabled, loaded, pathname]);

  if (!enabled || loaded) return null;

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      onReady={() => {
        lastTrackedPath.current = pathname;
        setLoaded(true);
        flushPendingMetaEvents();
      }}
    >
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
    </Script>
  );
}
