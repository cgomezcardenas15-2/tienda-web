import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

import { calcularEnvio } from "@/app/data/envios";
import { obtenerConfiguracionEnvios } from "@/app/lib/configuracionEnvios";
import { ErrorValidacionProductos, validarLineasProducto } from "@/app/lib/validarLineasProducto";

/*
|--------------------------------------------------------------------------
| API DE PEDIDOS - NOVA
|--------------------------------------------------------------------------
|
| Esta ruta se ejecuta SOLAMENTE en el servidor.
|
| SEGURIDAD:
|
| El navegador puede enviar:
|
| - ID del producto
| - cantidad
|
| Pero el servidor NO confía en:
|
| - nombre enviado por el navegador
| - precio enviado por el navegador
| - subtotal enviado por el navegador
| - costo de envío enviado por el navegador
| - descuento enviado por el navegador
| - total enviado por el navegador
|
| El servidor consulta nuevamente Supabase y calcula los valores oficiales.
|
|--------------------------------------------------------------------------
*/

type ProductoRecibido = {
  id: string | number;
  varianteId?: string;
  nombre?: string;
  precio?: number;
  cantidad: number;
};

type ProductoBaseDatos = {
  id: string;
  nombre: string;
  precio: number;
  controla_stock: boolean;
  stock: number;
  activo: boolean;
};

type ProductoValidado = {
  id: string;
  varianteId?: string;
  varianteNombre?: string;
  varianteColor?: string;
  varianteTalla?: string;
  imagen?: string;
  sku?: string;
  nombre: string;
  precio: number;
  cantidad: number;
};

/*
|--------------------------------------------------------------------------
| UUID
|--------------------------------------------------------------------------
|
| Los productos reales de NOVA utilizan UUID.
|
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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    /*
    |--------------------------------------------------------------------------
    | VALIDACIÓN INICIAL
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
            "Los datos del pedido no son válidos.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDAR PRODUCTOS RECIBIDOS
    |--------------------------------------------------------------------------
    */

    if (
      !Array.isArray(body.productos) ||
      body.productos.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El pedido debe contener al menos un producto.",
        },
        {
          status: 400,
        }
      );
    }

    const productosRecibidos: ProductoRecibido[] =
      body.productos;

    const lineasValidadas = await validarLineasProducto(productosRecibidos);

    /*
    |--------------------------------------------------------------------------
    | VALIDACIÓN BÁSICA DE PRODUCTOS
    |--------------------------------------------------------------------------
    |
    | Aquí solamente confiamos en:
    |
    | - ID
    | - cantidad
    |
    */

    const productosInvalidos =
      productosRecibidos.some((producto) => {
        const id =
          producto?.id !== undefined &&
          producto?.id !== null
            ? String(producto.id).trim()
            : "";

        const idValido =
          id !== "" && esUuidValido(id);

        const cantidadValida =
          typeof producto?.cantidad === "number" &&
          Number.isInteger(producto.cantidad) &&
          producto.cantidad > 0;

        return !idValido || !cantidadValida;
      });

    if (productosInvalidos) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Uno o más productos del pedido no son válidos.",
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
    |
    | Si alguien manipula la petición y envía el mismo producto varias veces,
    | consolidamos las cantidades.
    |
    */

    const cantidadesPorProducto =
      new Map<string, number>();

    for (const producto of productosRecibidos) {
      const id = String(producto.id).trim();

      const cantidadAnterior =
        cantidadesPorProducto.get(id) ?? 0;

      cantidadesPorProducto.set(
        id,
        cantidadAnterior + producto.cantidad
      );
    }

    const idsProductos = Array.from(
      cantidadesPorProducto.keys()
    );

    /*
    |--------------------------------------------------------------------------
    | CONSULTAR PRODUCTOS REALES EN SUPABASE
    |--------------------------------------------------------------------------
    |
    | IMPORTANTE:
    |
    | supabaseAdmin ignora RLS porque estamos en el servidor.
    |
    | Por eso comprobamos explícitamente:
    |
    | activo = true
    |
    */

    const {
      data: productosBaseDatos,
      error: errorConsultaProductos,
    } = await supabaseAdmin
      .from("productos")
      .select(
        `
          id,
          nombre,
          precio,
          controla_stock,
          stock,
          activo
        `
      )
      .in("id", idsProductos)
      .eq("activo", true);

    if (errorConsultaProductos) {
      console.error(
        "Error consultando productos reales:",
        errorConsultaProductos
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "No fue posible verificar los productos.",
        },
        {
          status: 500,
        }
      );
    }

    const productosEncontrados =
      (productosBaseDatos ??
        []) as ProductoBaseDatos[];

    /*
    |--------------------------------------------------------------------------
    | COMPROBAR EXISTENCIA
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

    for (const producto of productosEncontrados) {
      const cantidadSolicitada =
        cantidadesPorProducto.get(
          producto.id
        ) ?? 0;

      if (
        false &&
        producto.controla_stock &&
        cantidadSolicitada > producto.stock
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              `No hay suficiente stock disponible para "${producto.nombre}".`,
          },
          {
            status: 409,
          }
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | CONSTRUIR PRODUCTOS OFICIALES
    |--------------------------------------------------------------------------
    |
    | Nombre y precio salen de Supabase.
    |
    | NO del navegador.
    |
    */

    const productosValidados: ProductoValidado[] =
      lineasValidadas.map((linea) => ({
        id: linea.id,
        varianteId: linea.varianteId,
        varianteNombre: linea.varianteNombre,
        varianteColor: linea.varianteColor,
        varianteTalla: linea.varianteTalla,
        imagen: linea.imagen,
        sku: linea.sku,
        nombre: linea.nombre,
        precio: linea.precio,
        cantidad: linea.cantidad,
      }));

    /*
    |--------------------------------------------------------------------------
    | SUBTOTAL REAL
    |--------------------------------------------------------------------------
    */

    const subtotalCalculado =
      productosValidados.reduce(
        (acumulado, producto) =>
          acumulado +
          producto.precio *
            producto.cantidad,
        0
      );

    /*
    |--------------------------------------------------------------------------
    | CAMPOS PRINCIPALES DEL CLIENTE
    |--------------------------------------------------------------------------
    */

    const compradorNombre =
      body.comprador_nombre;

    const compradorTipoDocumento =
      body.comprador_tipo_documento;

    const compradorNumeroDocumento =
      body.comprador_numero_documento;

    const compradorTelefono =
      body.comprador_telefono;

    const compradorCorreo =
      body.comprador_correo;

    const entregaDepartamento =
      body.entrega_departamento;

    const entregaCiudad =
      body.entrega_ciudad;

    const entregaDireccion =
      body.entrega_direccion;

    const facturacionNombre =
      body.facturacion_nombre;

    const facturacionTipoDocumento =
      body.facturacion_tipo_documento;

    const facturacionNumeroDocumento =
      body.facturacion_numero_documento;

    const facturacionCorreo =
      body.facturacion_correo;

    const facturacionDepartamento =
      body.facturacion_departamento;

    const facturacionCiudad =
      body.facturacion_ciudad;

    const facturacionDireccion =
      body.facturacion_direccion;

    /*
    |--------------------------------------------------------------------------
    | VALIDAR CAMPOS OBLIGATORIOS
    |--------------------------------------------------------------------------
    */

    const camposObligatorios = [
      compradorNombre,
      compradorTipoDocumento,
      compradorNumeroDocumento,
      compradorTelefono,
      compradorCorreo,

      entregaDepartamento,
      entregaCiudad,
      entregaDireccion,

      facturacionNombre,
      facturacionTipoDocumento,
      facturacionNumeroDocumento,
      facturacionCorreo,
      facturacionDepartamento,
      facturacionCiudad,
      facturacionDireccion,
    ];

    const faltaCampoObligatorio =
      camposObligatorios.some(
        (campo) =>
          typeof campo !== "string" ||
          campo.trim() === ""
      );

    if (faltaCampoObligatorio) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Faltan datos obligatorios para crear el pedido.",
        },
        {
          status: 400,
        }
      );
    }

    const compradorTelefonoLimpio = compradorTelefono.replace(/\D/g, "");

    if (!/^\d{10}$/.test(compradorTelefonoLimpio)) {
      return NextResponse.json(
        {
          ok: false,
          error: "El teléfono debe tener exactamente 10 números.",
        },
        {
          status: 400,
        }
      );
    }

    const claveIdempotencia =
      typeof body.clave_idempotencia === "string"
        ? body.clave_idempotencia.trim()
        : "";

    if (!esUuidValido(claveIdempotencia)) {
      return NextResponse.json(
        { ok: false, error: "No fue posible identificar este intento de compra." },
        { status: 400 }
      );
    }

    const { data: pedidoExistente, error: errorConsultaExistente } =
      await supabaseAdmin
        .from("pedidos")
        .select("id,numero_pedido")
        .eq("clave_idempotencia", claveIdempotencia)
        .maybeSingle();

    if (errorConsultaExistente) {
      console.error("Error verificando pedido repetido:", errorConsultaExistente);
      return NextResponse.json(
        { ok: false, error: "No fue posible verificar el pedido." },
        { status: 500 }
      );
    }

    if (pedidoExistente) {
      return NextResponse.json({
        ok: true,
        repetido: true,
        pedido: pedidoExistente,
        productos: [],
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CALCULAR ENVÍO EN EL SERVIDOR
    |--------------------------------------------------------------------------
    |
    | El costo enviado por el navegador es ignorado.
    |
    */

    const configuracionEnvios = await obtenerConfiguracionEnvios();
    const resultadoEnvio =
      calcularEnvio(
        entregaDepartamento,
        entregaCiudad,
        configuracionEnvios,
        subtotalCalculado,
      );

    if (!resultadoEnvio.disponible) {
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
    | Todavía NOVA no tiene sistema oficial de cupones.
    |
    | Por seguridad:
    |
    | descuento = 0
    |
    | Cuando construyamos promociones reales, el servidor determinará
    | el descuento permitido.
    |
    */

    const descuento = 0;

    /*
    |--------------------------------------------------------------------------
    | TOTAL REAL
    |--------------------------------------------------------------------------
    */

    const totalCalculado =
      subtotalCalculado +
      costoEnvio -
      descuento;

    /*
    |--------------------------------------------------------------------------
    | CONSTRUIR PEDIDO OFICIAL
    |--------------------------------------------------------------------------
    */

    const pedido = {
      comprador_nombre:
        compradorNombre.trim(),

      comprador_tipo_documento:
        compradorTipoDocumento.trim(),

      comprador_numero_documento:
        compradorNumeroDocumento.trim(),

      comprador_razon_social:
        typeof body.comprador_razon_social ===
          "string" &&
        body.comprador_razon_social.trim() !== ""
          ? body.comprador_razon_social.trim()
          : null,

      comprador_dv:
        typeof body.comprador_dv === "string" &&
        body.comprador_dv.trim() !== ""
          ? body.comprador_dv.trim()
          : null,

      comprador_telefono:
        compradorTelefonoLimpio,

      comprador_correo:
        compradorCorreo.trim(),

      entrega_departamento:
        entregaDepartamento.trim(),

      entrega_ciudad:
        entregaCiudad.trim(),

      entrega_direccion:
        entregaDireccion.trim(),

      entrega_complemento:
        typeof body.entrega_complemento ===
          "string" &&
        body.entrega_complemento.trim() !== ""
          ? body.entrega_complemento.trim()
          : null,

      entrega_instrucciones:
        typeof body.entrega_instrucciones ===
          "string" &&
        body.entrega_instrucciones.trim() !== ""
          ? body.entrega_instrucciones.trim()
          : null,

      facturacion_nombre:
        facturacionNombre.trim(),

      facturacion_tipo_documento:
        facturacionTipoDocumento.trim(),

      facturacion_numero_documento:
        facturacionNumeroDocumento.trim(),

      facturacion_razon_social:
        typeof body.facturacion_razon_social ===
          "string" &&
        body.facturacion_razon_social.trim() !== ""
          ? body.facturacion_razon_social.trim()
          : null,

      facturacion_dv:
        typeof body.facturacion_dv === "string" &&
        body.facturacion_dv.trim() !== ""
          ? body.facturacion_dv.trim()
          : null,

      facturacion_correo:
        facturacionCorreo.trim(),

      facturacion_departamento:
        facturacionDepartamento.trim(),

      facturacion_ciudad:
        facturacionCiudad.trim(),

      facturacion_direccion:
        facturacionDireccion.trim(),

      envio_zona:
        resultadoEnvio.zona ?? "",

      envio_mensaje:
        resultadoEnvio.mensaje || null,

      subtotal:
        subtotalCalculado,

      costo_envio:
        costoEnvio,

      descuento,

      total:
        totalCalculado,

      moneda:
        "COP",

      estado_pedido:
        "pendiente_pago",

      estado_pago:
        "pendiente",

      proveedor_pago:
        null,

      referencia_pago:
        null,

      clave_idempotencia:
        claveIdempotencia,
    };

    /*
    |--------------------------------------------------------------------------
    | CREAR PEDIDO PRINCIPAL
    |--------------------------------------------------------------------------
    |
    | IMPORTANTE:
    |
    | Esta API todavía NO debe conectarse al botón real de pago.
    |
    | Cuando integremos la pasarela, revisaremos el momento exacto
    | en el que debe crearse el pedido definitivo.
    |
    */

    const {
      data: pedidoCreado,
      error: errorPedido,
    } = await supabaseAdmin
      .from("pedidos")
      .insert(pedido)
      .select()
      .single();

    if (errorPedido?.code === "23505") {
      const { data: pedidoConcurrente } = await supabaseAdmin
        .from("pedidos")
        .select("id,numero_pedido")
        .eq("clave_idempotencia", claveIdempotencia)
        .maybeSingle();

      if (pedidoConcurrente) {
        return NextResponse.json({
          ok: true,
          repetido: true,
          pedido: pedidoConcurrente,
          productos: [],
        });
      }
    }

    if (errorPedido || !pedidoCreado) {
      console.error(
        "Error al guardar el pedido:",
        errorPedido
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "No fue posible guardar el pedido.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCTOS DEL PEDIDO
    |--------------------------------------------------------------------------
    |
    | Guardamos una fotografía histórica de:
    |
    | - nombre
    | - precio
    | - cantidad
    |
    | Aunque el producto cambie en el futuro, el pedido conserva
    | exactamente lo que se compró en ese momento.
    |
    */

    const productosParaGuardar =
      productosValidados.map(
        (producto) => ({
          pedido_id:
            pedidoCreado.id,

          producto_id:
            producto.id,

          variante_id: producto.varianteId ?? null,
          variante_nombre: producto.varianteNombre ?? null,
          variante_sku: producto.sku ?? null,
          variante_color: producto.varianteColor ?? null,
          variante_talla: producto.varianteTalla ?? null,
          variante_imagen_url: producto.imagen ?? null,

          nombre:
            producto.nombre,

          precio_unitario:
            producto.precio,

          cantidad:
            producto.cantidad,
        })
      );

    /*
    |--------------------------------------------------------------------------
    | INSERTAR PRODUCTOS
    |--------------------------------------------------------------------------
    */

    const {
      data: productosGuardados,
      error: errorProductos,
    } = await supabaseAdmin
      .from("productos_pedido")
      .insert(productosParaGuardar)
      .select();

    /*
    |--------------------------------------------------------------------------
    | LIMPIEZA SI FALLAN LOS PRODUCTOS
    |--------------------------------------------------------------------------
    */

    if (errorProductos) {
      console.error(
        "Error al guardar productos:",
        errorProductos
      );

      const {
        error: errorLimpieza,
      } = await supabaseAdmin
        .from("pedidos")
        .delete()
        .eq(
          "id",
          pedidoCreado.id
        );

      if (errorLimpieza) {
        console.error(
          "ATENCIÓN: no fue posible eliminar el pedido incompleto:",
          errorLimpieza
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error:
            "No fue posible guardar los productos del pedido.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | RESPUESTA FINAL
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        ok: true,

        mensaje:
          "Pedido y productos guardados correctamente.",

        pedido:
          pedidoCreado,

        productos:
          productosGuardados,

        totales: {
          subtotal:
            subtotalCalculado,

          costo_envio:
            costoEnvio,

          descuento,

          total:
            totalCalculado,
        },
      },
      {
        status: 201,
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
      "Error en POST /api/pedidos:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Ocurrió un error procesando el pedido.",
      },
      {
        status: 500,
      }
    );
  }
}
