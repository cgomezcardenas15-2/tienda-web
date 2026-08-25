"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

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
  nombre: string;
  precio: number;
  imagen?: string;

  controlaStock?: boolean;
  stock?: number;
};

export type CartItem = CartProduct & {
  cantidad: number;
};

type CartContextType = {
  items: CartItem[];

  cantidadTotal: number;
  subtotal: number;

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

          setItems(
            carritoRecuperado
          );
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

  function agregarProducto(
    producto: CartProduct
  ) {
    setItems(
      (carritoActual) => {
        const stockSeguro =
          obtenerStockSeguro(
            producto.stock
          );

        /*
        |--------------------------------------------------------------------------
        | PRODUCTO SIN STOCK
        |--------------------------------------------------------------------------
        */

        if (
          producto.controlaStock ===
            true &&
          stockSeguro !==
            undefined &&
          stockSeguro <= 0
        ) {
          return carritoActual;
        }

        const productoExistente =
          carritoActual.find(
            (item) =>
              item.id ===
              producto.id
          );

        /*
        |--------------------------------------------------------------------------
        | PRODUCTO YA EXISTE
        |--------------------------------------------------------------------------
        */

        if (
          productoExistente
        ) {
          return carritoActual.map(
            (item) => {
              if (
                item.id !==
                producto.id
              ) {
                return item;
              }

              /*
              |--------------------------------------------------------------------------
              | ACTUALIZAR INFORMACIÓN
              |--------------------------------------------------------------------------
              |
              | Si el producto venía de un carrito antiguo,
              | actualizamos su stock y configuración con
              | la información más reciente del catálogo.
              |
              */

              const itemActualizado = {
                ...item,

                nombre:
                  producto.nombre,

                precio:
                  producto.precio,

                imagen:
                  producto.imagen,

                controlaStock:
                  producto.controlaStock,

                stock:
                  stockSeguro,
              };

              /*
              |--------------------------------------------------------------------------
              | LÍMITE DE STOCK
              |--------------------------------------------------------------------------
              */

              if (
                producto.controlaStock ===
                  true &&
                stockSeguro !==
                  undefined &&
                item.cantidad >=
                  stockSeguro
              ) {
                return itemActualizado;
              }

              return {
                ...itemActualizado,
                cantidad:
                  item.cantidad + 1,
              };
            }
          );
        }

        /*
        |--------------------------------------------------------------------------
        | PRODUCTO NUEVO
        |--------------------------------------------------------------------------
        */

        return [
          ...carritoActual,
          {
            ...producto,

            stock:
              stockSeguro,

            cantidad: 1,
          },
        ];
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | QUITAR PRODUCTO
  |--------------------------------------------------------------------------
  */

  function quitarProducto(
    id: string
  ) {
    setItems(
      (carritoActual) =>
        carritoActual.filter(
          (item) =>
            item.id !== id
        )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | AUMENTAR CANTIDAD
  |--------------------------------------------------------------------------
  */

  function aumentarCantidad(
    id: string
  ) {
    setItems(
      (carritoActual) =>
        carritoActual.map(
          (item) => {
            if (
              item.id !== id
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
        )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | DISMINUIR CANTIDAD
  |--------------------------------------------------------------------------
  */

  function disminuirCantidad(
    id: string
  ) {
    setItems(
      (carritoActual) =>
        carritoActual
          .map(
            (item) =>
              item.id === id
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
          )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | VACIAR CARRITO
  |--------------------------------------------------------------------------
  */

  function vaciarCarrito() {
    setItems([]);
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
        item.precio *
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

        cantidadTotal,
        subtotal,

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