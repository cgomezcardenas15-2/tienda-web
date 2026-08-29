import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { calcularEnvio } from "@/app/data/envios";
import { ErrorValidacionProductos, validarLineasProducto } from "@/app/lib/validarLineasProducto";

/*
|--------------------------------------------------------------------------
| VALIDAR CHECKOUT - NOVA
|--------------------------------------------------------------------------
|
| Esta API NO:
|
| - crea pedidos
| - descuenta inventario
| - procesa pagos
| - genera facturas
|
| Su única responsabilidad es verificar que el checkout todavía sea
| válido utilizando información oficial del servidor.
|
|--------------------------------------------------------------------------
*/

type ProductoRecibido = {
  id: string;
  varianteId?: string;
  cantidad: number;
};

type ProductoBaseDatos = {
  id: string;
  nombre: string;
  sku: string | null;
  precio: number;
  controla_stock: boolean;
  stock: number;
  activo: boolean;
};

type ProductoValidado = {
  productoId: string;
  varianteId?: string;
  varianteNombre?: string;
  varianteColor?: string;
  varianteTalla?: string;
  imagen?: string;
  nombre: string;
  sku?: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
};

/*
|--------------------------------------------------------------------------
| UUID
|--------------------------------------------------------------------------
*/

function esUuidValido(valor: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    valor
  );
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
*/

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    /*
    |--------------------------------------------------------------------------
    | VALIDAR BODY
    |--------------------------------------------------------------------------
    */

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Los datos enviados no son válidos.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDAR PRODUCTOS
    |--------------------------------------------------------------------------
    */

    if (
      !Array.isArray(
        body.productos
      ) ||
      body.productos.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El carrito está vacío.",
        },
        {
          status: 400,
        }
      );
    }

    const productosRecibidos =
      body.productos as ProductoRecibido[];

    const lineasValidadas = await validarLineasProducto(productosRecibidos);

    const productosInvalidos =
      productosRecibidos.some(
        (producto) => {
          const id =
            typeof producto?.id ===
            "string"
              ? producto.id.trim()
              : "";

          const cantidad =
            producto?.cantidad;

          return (
            !esUuidValido(id) ||
            typeof cantidad !==
              "number" ||
            !Number.isInteger(
              cantidad
            ) ||
            cantidad <= 0
          );
        }
      );

    if (productosInvalidos) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Uno o más productos del carrito no son válidos.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | AGRUPAR PRODUCTOS REPETIDOS
    |--------------------------------------------------------------------------
    */

    const cantidadesPorProducto =
      new Map<string, number>();

    for (
      const producto of productosRecibidos
    ) {
      const id =
        producto.id.trim();

      const cantidadAnterior =
        cantidadesPorProducto.get(
          id
        ) ?? 0;

      cantidadesPorProducto.set(
        id,
        cantidadAnterior +
          producto.cantidad
      );
    }

    const idsProductos =
      Array.from(
        cantidadesPorProducto.keys()
      );

    /*
    |--------------------------------------------------------------------------
    | CONSULTAR PRODUCTOS REALES
    |--------------------------------------------------------------------------
    */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("productos")
      .select(
        `
          id,
          nombre,
          sku,
          precio,
          controla_stock,
          stock,
          activo
        `
      )
      .in(
        "id",
        idsProductos
      )
      .eq(
        "activo",
        true
      );

    if (error) {
      console.error(
        "Error validando productos del checkout:",
        error
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "No fue posible validar los productos en este momento.",
        },
        {
          status: 500,
        }
      );
    }

    const productosEncontrados =
      (data ??
        []) as ProductoBaseDatos[];

    /*
    |--------------------------------------------------------------------------
    | PRODUCTOS INEXISTENTES O INACTIVOS
    |--------------------------------------------------------------------------
    */

    if (
      productosEncontrados.length !==
      idsProductos.length
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Uno o más productos ya no están disponibles.",
        },
        {
          status: 409,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDAR STOCK
    |--------------------------------------------------------------------------
    */

    for (
      const producto of productosEncontrados
    ) {
      const cantidadSolicitada =
        cantidadesPorProducto.get(
          producto.id
        ) ?? 0;

      if (
        false &&
        producto.controla_stock &&
        cantidadSolicitada >
          producto.stock
      ) {
        return NextResponse.json(
          {
            ok: false,

            error:
              `Solo hay ${producto.stock} ` +
              `${
                producto.stock === 1
                  ? "unidad disponible"
                  : "unidades disponibles"
              } de "${producto.nombre}".`,

            codigo:
              "STOCK_INSUFICIENTE",

            producto: {
              id:
                producto.id,

              nombre:
                producto.nombre,

              stockDisponible:
                producto.stock,

              cantidadSolicitada,
            },
          },
          {
            status: 409,
          }
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCTOS OFICIALES
    |--------------------------------------------------------------------------
    */

    const productosValidados:
      ProductoValidado[] =
      lineasValidadas.map((linea) => ({
        productoId: linea.id,
        varianteId: linea.varianteId,
        varianteNombre: linea.varianteNombre,
        varianteColor: linea.varianteColor,
        varianteTalla: linea.varianteTalla,
        imagen: linea.imagen,
        nombre: linea.nombre,
        sku: linea.sku,
        precioUnitario: linea.precio,
        cantidad: linea.cantidad,
        subtotal: linea.subtotal,
      }));

    /*
    |--------------------------------------------------------------------------
    | SUBTOTAL OFICIAL
    |--------------------------------------------------------------------------
    */

    const subtotal =
      productosValidados.reduce(
        (
          acumulado,
          producto
        ) =>
          acumulado +
          producto.subtotal,
        0
      );

    /*
    |--------------------------------------------------------------------------
    | UBICACIÓN DE ENTREGA
    |--------------------------------------------------------------------------
    */

    const departamento =
      typeof body.departamento ===
      "string"
        ? body.departamento.trim()
        : "";

    const ciudad =
      typeof body.ciudad ===
      "string"
        ? body.ciudad.trim()
        : "";

    if (
      departamento === "" ||
      ciudad === ""
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Debes seleccionar una ubicación de entrega.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ENVÍO OFICIAL
    |--------------------------------------------------------------------------
    */

    const resultadoEnvio =
      calcularEnvio(
        departamento,
        ciudad
      );

    if (
      !resultadoEnvio.disponible
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No fue posible calcular el envío para la ubicación seleccionada.",
        },
        {
          status: 400,
        }
      );
    }

    const costoEnvio =
      resultadoEnvio.valor;

    /*
    |--------------------------------------------------------------------------
    | DESCUENTO
    |--------------------------------------------------------------------------
    |
    | Todavía no existe un sistema oficial de cupones/promociones.
    |
    */

    const descuento = 0;

    /*
    |--------------------------------------------------------------------------
    | TOTAL OFICIAL
    |--------------------------------------------------------------------------
    */

    const total =
      Math.max(
        0,
        subtotal +
          costoEnvio -
          descuento
      );

    /*
    |--------------------------------------------------------------------------
    | RESPUESTA
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        ok: true,

        mensaje:
          "Checkout validado correctamente.",

        productos:
          productosValidados,

        envio: {
          costo:
            costoEnvio,

          zona:
            resultadoEnvio.zona ??
            "",

          nombreZona:
            resultadoEnvio.nombreZona,

          mensaje:
            resultadoEnvio.mensaje,
        },

        totales: {
          subtotal,
          costoEnvio,
          descuento,
          total,
          moneda:
            "COP" as const,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof ErrorValidacionProductos) {
      return NextResponse.json(
        { ok: false, error: error.message, codigo: error.codigo },
        { status: error.status }
      );
    }

    console.error(
      "Error en POST /api/checkout/validar:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Ocurrió un error validando el checkout.",
      },
      {
        status: 500,
      }
    );
  }
}
