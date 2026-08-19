"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type CartProduct = {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string;
};

export type CartItem = CartProduct & {
  cantidad: number;
};

type CartContextType = {
  items: CartItem[];
  cantidadTotal: number;
  subtotal: number;
  agregarProducto: (producto: CartProduct) => void;
  quitarProducto: (id: string) => void;
  aumentarCantidad: (id: string) => void;
  disminuirCantidad: (id: string) => void;
  vaciarCarrito: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "nova-carrito";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [carritoCargado, setCarritoCargado] = useState(false);

  /* Recuperar carrito guardado */
  useEffect(() => {
    try {
      const carritoGuardado = window.localStorage.getItem(STORAGE_KEY);

      if (carritoGuardado) {
        const datos = JSON.parse(carritoGuardado);

        if (Array.isArray(datos)) {
          setItems(datos);
        }
      }
    } catch (error) {
      console.error("No se pudo recuperar el carrito de NOVA.", error);
    } finally {
      setCarritoCargado(true);
    }
  }, []);

  /* Guardar carrito cada vez que cambie */
  useEffect(() => {
    if (!carritoCargado) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("No se pudo guardar el carrito de NOVA.", error);
    }
  }, [items, carritoCargado]);

  function agregarProducto(producto: CartProduct) {
    setItems((carritoActual) => {
      const productoExistente = carritoActual.find(
        (item) => item.id === producto.id
      );

      if (productoExistente) {
        return carritoActual.map((item) =>
          item.id === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
              }
            : item
        );
      }

      return [
        ...carritoActual,
        {
          ...producto,
          cantidad: 1,
        },
      ];
    });
  }

  function quitarProducto(id: string) {
    setItems((carritoActual) =>
      carritoActual.filter((item) => item.id !== id)
    );
  }

  function aumentarCantidad(id: string) {
    setItems((carritoActual) =>
      carritoActual.map((item) =>
        item.id === id
          ? {
              ...item,
              cantidad: item.cantidad + 1,
            }
          : item
      )
    );
  }

  function disminuirCantidad(id: string) {
    setItems((carritoActual) =>
      carritoActual
        .map((item) =>
          item.id === id
            ? {
                ...item,
                cantidad: item.cantidad - 1,
              }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  }

  function vaciarCarrito() {
    setItems([]);
  }

  const cantidadTotal = items.reduce(
    (total, item) => total + item.cantidad,
    0
  );

  const subtotal = items.reduce(
    (total, item) => total + item.precio * item.cantidad,
    0
  );

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

export function useCart() {
  const context = useContext(CartContext);

  if (context === undefined) {
    throw new Error("useCart debe utilizarse dentro de CartProvider.");
  }

  return context;
}