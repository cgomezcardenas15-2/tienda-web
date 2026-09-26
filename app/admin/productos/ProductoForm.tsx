"use client";


import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "./ImageUploader";


type ProductoEditable = {
  id: string;
  nombre: string;
  sku: string | null;
  descripcion: string | null;
  categoria: string;
  precio: number;
  precio_anterior: number | null;
  venta_mayorista: boolean;
  precio_mayorista: number | null;
  cantidad_minima_mayorista: number | null;
  controla_stock: boolean;
  stock: number;
  imagen_url: string | null;
  destacado: boolean;
  en_oferta: boolean;
  activo: boolean;
};


const CATEGORIAS = ["Piñatería", "Hogar", "Cacharrería", "Mascotas", "Motos"];


export default function ProductoForm({ producto }: { producto?: ProductoEditable }) {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: producto?.nombre ?? "",
    sku: producto?.sku ?? "",
    descripcion: producto?.descripcion ?? "",
    categoria: producto?.categoria ?? "Hogar",
    precio: producto ? String(producto.precio) : "",
    precio_anterior: producto?.precio_anterior === null || producto?.precio_anterior === undefined ? "" : String(producto.precio_anterior),
