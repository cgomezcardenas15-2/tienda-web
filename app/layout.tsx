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
  title: "NOVA | Todo lo que necesitas",
  description:
    "Encuentra productos para el hogar, mascotas y piñatería en NOVA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className="min-h-full flex flex-col antialiased"
        style={{
          fontFamily: geistSans.style.fontFamily,
        }}
      >
        <CartProvider>
          {children}
          <WhatsAppButton />
          <CookieNotice />
        </CartProvider>
      </body>
    </html>
  );
}
