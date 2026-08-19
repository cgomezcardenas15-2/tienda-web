import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";

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
    "Encuentra tecnología, hogar, bebés, maquillaje, mascotas, ferretería, piñatería y mucho más en NOVA.",
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
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}