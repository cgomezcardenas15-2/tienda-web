import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import CookieNotice from "./components/CookieNotice";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
          <CookieNotice />
        </CartProvider>
      </body>
    </html>
  );
}
