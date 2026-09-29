import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import CookieNotice from "./components/CookieNotice";
import WhatsAppButton from "./components/WhatsAppButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://senornova.com.co"),
  title: {
    default: "Señor Nova | Tienda online en Cali",
    template: "%s | Señor Nova",
  },
  description:
    "Compra productos para el hogar, piñatería, cacharrería y motos en Señor Nova, tienda online en Cali, Colombia.",
  applicationName: "Señor Nova",
  keywords: [
    "Señor Nova",
    "NOVA",
    "tienda online Cali",
    "productos para el hogar",
    "piñatería",
    "cacharrería",
    "accesorios para motos",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "/",
    siteName: "Señor Nova",
    title: "Señor Nova | Tienda online en Cali",
    description: "Productos para el hogar, piñatería, cacharrería y motos en Cali, Colombia.",
  },
  twitter: {
    card: "summary",
    title: "Señor Nova | Tienda online en Cali",
    description: "Productos para el hogar, piñatería, cacharrería y motos en Cali, Colombia.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const datosEstructurados = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "Señor Nova",
    alternateName: "NOVA",
    url: "https://senornova.com.co",
    logo: "https://senornova.com.co/icon.png",
    description:
      "Tienda online de productos para el hogar, piñatería, cacharrería y motos en Cali, Colombia.",
    areaServed: { "@type": "Country", name: "Colombia" },
  };

  return (
    <html lang="es">
      <body
        className="min-h-full flex flex-col antialiased"
        style={{
          fontFamily: geistSans.style.fontFamily,
        }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }}
        />
        <CartProvider>
          {children}
          <WhatsAppButton />
          <CookieNotice />
        </CartProvider>
      </body>
    </html>
  );
}
