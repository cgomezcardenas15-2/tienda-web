"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getMetaContentId, trackMetaEvent } from "../lib/metaPixel";

/*
|--------------------------------------------------------------------------
| PRODUCTO DEL CARRITO - NOVA
|--------------------------------------------------------------------------
|
| stock y controlaStock vienen del catálogo.
|
| IMPORTANTE:
| Estos valores sirven para mejorar la experiencia del usuario.
|
| El servidor SIEMPRE volverá a consultar Supabase antes de aceptar
| un pedido, por lo que el navegador nunca será la autoridad final.
|
*/

export type CartProduct = {
  id: string;
  varianteId?: string;
  varianteNombre?: string;
  varianteColor?: string;
  varianteTalla?: string;
  sku?: string;
  nombre: string;
  precio: number;
  precioMayorista?: number;
  cantidadMinimaMayorista?: number;
  imagen?: string;

  controlaStock?: boolean;
  stock?: number;
};

export type CartItem = CartProduct & {
  cantidad: number;
};

type CartContextType = {
  items: CartItem[];
  carritoCargado: boolean;

  cantidadTotal: number;
  subtotal: number;

  miniCarritoAbierto: boolean;
  ultimaClaveAgregada: string | null;
  avisoMiniCarrito: "agregado" | "limite";

  abrirMiniCarrito: () => void;
  cerrarMiniCarrito: () => void;

  agregarProducto: (
    producto: CartProduct
  ) => void;

  quitarProducto: (
    id: string
  ) => void;

  aumentarCantidad: (
    id: string
  ) => void;

  disminuirCantidad: (
    id: string
  ) => void;

  vaciarCarrito: () => void;
};

const CartContext =
  createContext<
    CartContextType | undefined
  >(undefined);

const STORAGE_KEY = "nova-carrito";

export function obtenerClaveCarrito(
  item: Pick<CartProduct, "id" | "varianteId">
) {
  return item.varianteId ?? item.id;
}

export function obtenerPrecioUnitario(item: Pick<CartItem, "precio" | "precioMayorista" | "cantidadMinimaMayorista" | "cantidad">) {
  return typeof item.precioMayorista === "number" &&
    typeof item.cantidadMinimaMayorista === "number" &&
    item.cantidad >= item.cantidadMinimaMayorista
    ? item.precioMayorista
    : item.precio;
}

/*
|--------------------------------------------------------------------------
| NORMALIZAR STOCK
|--------------------------------------------------------------------------
*/

function obtenerStockSeguro(
  stock: number | undefined
) {
  if (
    typeof stock !== "number" ||
    !Number.isFinite(stock)
  ) {
    return undefined;
  }

  return Math.max(
    0,
    Math.floor(stock)
  );
}

/*
|--------------------------------------------------------------------------
| CART PROVIDER
|--------------------------------------------------------------------------
*/

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] =
    useState<CartItem[]>([]);
  const itemsRef = useRef<CartItem[]>([]);

  const [
    miniCarritoAbierto,
    setMiniCarritoAbierto,
  ] = useState(false);

  const [
    ultimaClaveAgregada,
    setUltimaClaveAgregada,
  ] = useState<string | null>(null);

  const [
    avisoMiniCarrito,
    setAvisoMiniCarrito,
  ] = useState<"agregado" | "limite">("agregado");

  const [
    carritoCargado,
    setCarritoCargado,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | RECUPERAR CARRITO
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    try {
      const carritoGuardado =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      if (carritoGuardado) {
        const datos =
          JSON.parse(
            carritoGuardado
          );

        if (Array.isArray(datos)) {
          const carritoRecuperado =
            datos.filter(
              (item) =>
                item &&
                typeof item.id ===
                  "string" &&
                typeof item.nombre ===
                  "string" &&
                typeof item.precio ===
                  "number" &&
                typeof item.cantidad ===
                  "number" &&
                Number.isInteger(
                  item.cantidad
                ) &&
                item.cantidad > 0
            );

          itemsRef.current = carritoRecuperado;
          // Restaurar el estado persistido es la sincronización intencional de este efecto.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setItems(carritoRecuperado);
        }
      }
    } catch (error) {
      console.error(
        "No se pudo recuperar el carrito de NOVA.",
        error
      );
    } finally {
      setCarritoCargado(true);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | GUARDAR CARRITO
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!carritoCargado) {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch (error) {
      console.error(
        "No se pudo guardar el carrito de NOVA.",
        error
      );
    }
  }, [
    items,
    carritoCargado,
  ]);

  /*
  |--------------------------------------------------------------------------
  | AGREGAR PRODUCTO
  |--------------------------------------------------------------------------
  */

  const abrirMiniCarrito = useCallback(() => {
    setMiniCarritoAbierto(true);
  }, []);

  const cerrarMiniCarrito = useCallback(() => {
    setMiniCarritoAbierto(false);
  }, []);

  function agregarProducto(
    producto: CartProduct
  ) {
    const stockSeguro =
      obtenerStockSeguro(
        producto.stock
      );

    if (
      producto.controlaStock ===
        true &&
      stockSeguro !==
        undefined &&
      stockSeguro <= 0
    ) {
      return;
    }

    const claveProducto = obtenerClaveCarrito(producto);
    const carritoActual = itemsRef.current;
    const productoExistente = carritoActual.find(
      (item) => obtenerClaveCarrito(item) === claveProducto
    );
    const llegoAlLimite =
      producto.controlaStock === true &&
      stockSeguro !== undefined &&
      productoExistente !== undefined &&
      productoExistente.cantidad >= stockSeguro;

    setUltimaClaveAgregada(claveProducto);
    setAvisoMiniCarrito(llegoAlLimite ? "limite" : "agregado");
    abrirMiniCarrito();

    let itemAgregado: CartItem;
    let siguienteCarrito: CartItem[];

    if (productoExistente) {
      const itemActualizado: CartItem = {
        ...productoExistente,
        nombre: producto.nombre,
        precio: producto.precio,
        precioMayorista: producto.precioMayorista,
        cantidadMinimaMayorista: producto.cantidadMinimaMayorista,
        imagen: producto.imagen,
        varianteId: producto.varianteId,
        varianteNombre: producto.varianteNombre,
        varianteColor: producto.varianteColor,
        varianteTalla: producto.varianteTalla,
        sku: producto.sku,
        controlaStock: producto.controlaStock,
        stock: stockSeguro,
      };

      if (llegoAlLimite) {
        siguienteCarrito = carritoActual.map((item) =>
          obtenerClaveCarrito(item) === claveProducto ? itemActualizado : item
        );
        itemsRef.current = siguienteCarrito;
        setItems(siguienteCarrito);
        return;
      }

      itemAgregado = { ...itemActualizado, cantidad: productoExistente.cantidad + 1 };
      siguienteCarrito = carritoActual.map((item) =>
        obtenerClaveCarrito(item) === claveProducto ? itemAgregado : item
      );
    } else {
      itemAgregado = { ...producto, stock: stockSeguro, cantidad: 1 };
      siguienteCarrito = [...carritoActual, itemAgregado];
    }

    itemsRef.current = siguienteCarrito;
    setItems(siguienteCarrito);

    const contentId = getMetaContentId(producto);
    const precioUnitario = obtenerPrecioUnitario(itemAgregado);
    trackMetaEvent("AddToCart", {
      content_ids: [contentId],
      content_type: "product",
      contents: [{ id: contentId, quantity: 1, item_price: precioUnitario }],
      currency: "COP",
      value: precioUnitario,
      content_name: producto.nombre,
      num_items: 1,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | QUITAR PRODUCTO
  |--------------------------------------------------------------------------
  */

  function quitarProducto(
    id: string
  ) {
    const siguienteCarrito = itemsRef.current.filter(
      (item) => obtenerClaveCarrito(item) !== id
    );
    itemsRef.current = siguienteCarrito;
    setItems(siguienteCarrito);
  }

  /*
  |--------------------------------------------------------------------------
  | AUMENTAR CANTIDAD
  |--------------------------------------------------------------------------
  */

  function aumentarCantidad(
    id: string
  ) {
    const siguienteCarrito = itemsRef.current.map(
          (item) => {
            if (
              obtenerClaveCarrito(item) !== id
            ) {
              return item;
            }

            const stockSeguro =
              obtenerStockSeguro(
                item.stock
              );

            if (
              item.controlaStock ===
                true &&
              stockSeguro !==
                undefined &&
              item.cantidad >=
                stockSeguro
            ) {
              return item;
            }

            return {
              ...item,
              cantidad:
                item.cantidad + 1,
            };
          }
        );
    itemsRef.current = siguienteCarrito;
    setItems(siguienteCarrito);
  }

  /*
  |--------------------------------------------------------------------------
  | DISMINUIR CANTIDAD
  |--------------------------------------------------------------------------
  */

  function disminuirCantidad(
    id: string
  ) {
    const siguienteCarrito = itemsRef.current
          .map(
            (item) =>
              obtenerClaveCarrito(item) === id
                ? {
                    ...item,

                    cantidad:
                      item.cantidad -
                      1,
                  }
                : item
          )
          .filter(
            (item) =>
              item.cantidad > 0
          );
    itemsRef.current = siguienteCarrito;
    setItems(siguienteCarrito);
  }

  /*
  |--------------------------------------------------------------------------
  | VACIAR CARRITO
  |--------------------------------------------------------------------------
  */

  function vaciarCarrito() {
    itemsRef.current = [];
    setItems([]);
    setUltimaClaveAgregada(null);
  }

  /*
  |--------------------------------------------------------------------------
  | TOTALES VISUALES
  |--------------------------------------------------------------------------
  |
  | Estos valores son informativos.
  |
  | El servidor vuelve a calcular precios y totales oficiales
  | cuando procesa un pedido.
  |
  */

  const cantidadTotal =
    items.reduce(
      (total, item) =>
        total +
        item.cantidad,
      0
    );

  const subtotal =
    items.reduce(
      (total, item) =>
        total +
        obtenerPrecioUnitario(item) *
          item.cantidad,
      0
    );

  /*
  |--------------------------------------------------------------------------
  | PROVIDER
  |--------------------------------------------------------------------------
  */

  return (
    <CartContext.Provider
      value={{
        items,
        carritoCargado,

        cantidadTotal,
        subtotal,

        miniCarritoAbierto,
        ultimaClaveAgregada,
        avisoMiniCarrito,

        abrirMiniCarrito,
        cerrarMiniCarrito,

        agregarProducto,
        quitarProducto,
        aumentarCantidad,
        disminuirCantidad,
        vaciarCarrito,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
*/

export function useCart() {
  const context =
    useContext(CartContext);

  if (
    context === undefined
  ) {
    throw new Error(
      "useCart debe utilizarse dentro de CartProvider."
    );
  }

  return context;
}
