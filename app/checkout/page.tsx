"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { useCart } from "../context/CartContext";

import {
  obtenerDepartamentos,
  obtenerMunicipios,
} from "../data/colombia";

import { calcularEnvio } from "../data/envios";

import {
  convertirTipoDocumento,
  prepararPedido,
  type PedidoPreparado,
} from "../data/prepararPedido";

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

type ErroresFormulario = {
  nombre?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  razonSocial?: string;
  telefono?: string;
  correo?: string;

  departamento?: string;
  ciudad?: string;
  direccion?: string;

  facturacionNombre?: string;
  facturacionTipoDocumento?: string;
  facturacionNumeroDocumento?: string;
  facturacionRazonSocial?: string;
  facturacionCorreo?: string;
  facturacionDepartamento?: string;
  facturacionCiudad?: string;
  facturacionDireccion?: string;
};

type ProductoValidadoServidor = {
  productoId: string;
  nombre: string;
  sku?: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
};

type RespuestaValidacionCheckout = {
  ok: boolean;
  mensaje?: string;
  error?: string;
  codigo?: string;

  producto?: {
    id: string;
    nombre: string;
    stockDisponible: number;
    cantidadSolicitada: number;
  };

  productos?: ProductoValidadoServidor[];

  envio?: {
    costo: number;
    zona: string;
    nombreZona: string;
    mensaje: string;
  };

  totales?: {
    subtotal: number;
    costoEnvio: number;
    descuento: number;
    total: number;
    moneda: "COP";
  };
};

/*
|--------------------------------------------------------------------------
| FORMATO PESOS
|--------------------------------------------------------------------------
*/

function formatoPesos(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

/*
|--------------------------------------------------------------------------
| DÍGITO DE VERIFICACIÓN
|--------------------------------------------------------------------------
*/

function calcularDigitoVerificacion(nit: string) {
  const nitLimpio = nit.replace(/\D/g, "");

  if (nitLimpio === "") {
    return "";
  }

  const pesos = [
    71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3,
  ];

  const nitAjustado = nitLimpio.padStart(15, "0");

  let suma = 0;

  for (let i = 0; i < 15; i++) {
    suma += Number(nitAjustado[i]) * pesos[i];
  }

  const residuo = suma % 11;

  if (residuo === 0 || residuo === 1) {
    return residuo.toString();
  }

  return (11 - residuo).toString();
}

/*
|--------------------------------------------------------------------------
| CHECKOUT
|--------------------------------------------------------------------------
*/

export default function CheckoutPage() {
  const { items, subtotal } = useCart();

  /*
  |--------------------------------------------------------------------------
  | COMPRADOR
  |--------------------------------------------------------------------------
  */

  const [nombre, setNombre] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");

  /*
  |--------------------------------------------------------------------------
  | ENTREGA
  |--------------------------------------------------------------------------
  */

  const [departamento, setDepartamento] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [direccion, setDireccion] = useState("");
  const [complemento, setComplemento] = useState("");
  const [instrucciones, setInstrucciones] = useState("");

  /*
  |--------------------------------------------------------------------------
  | FACTURACIÓN
  |--------------------------------------------------------------------------
  */

  const [
    usarDatosCompradorParaFacturacion,
    setUsarDatosCompradorParaFacturacion,
  ] = useState(true);

  const [facturacionNombre, setFacturacionNombre] = useState("");

  const [
    facturacionTipoDocumento,
    setFacturacionTipoDocumento,
  ] = useState("");

  const [
    facturacionNumeroDocumento,
    setFacturacionNumeroDocumento,
  ] = useState("");

  const [
    facturacionRazonSocial,
    setFacturacionRazonSocial,
  ] = useState("");

  const [facturacionCorreo, setFacturacionCorreo] = useState("");

  const [
    facturacionDepartamento,
    setFacturacionDepartamento,
  ] = useState("");

  const [
    facturacionCiudad,
    setFacturacionCiudad,
  ] = useState("");

  const [
    facturacionDireccion,
    setFacturacionDireccion,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | ESTADO
  |--------------------------------------------------------------------------
  */

  const [errores, setErrores] =
    useState<ErroresFormulario>({});

  const [datosConfirmados, setDatosConfirmados] =
    useState(false);

  const [validandoServidor, setValidandoServidor] =
    useState(false);

  const [iniciandoPago, setIniciandoPago] =
    useState(false);

  const [errorServidor, setErrorServidor] =
    useState("");

  const iniciandoPagoRef = useRef(false);
  const pedidoPendienteRef = useRef<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | PEDIDO PREPARADO
  |--------------------------------------------------------------------------
  */

  const [
    pedidoPreparado,
    setPedidoPreparado,
  ] = useState<PedidoPreparado | null>(null);

  /*
  |--------------------------------------------------------------------------
  | VALIDACIÓN OFICIAL DEL SERVIDOR
  |--------------------------------------------------------------------------
  */

  const [
    validacionServidor,
    setValidacionServidor,
  ] = useState<RespuestaValidacionCheckout | null>(null);

  const carritoVacio = items.length === 0;

  const esEmpresa = tipoDocumento === "NIT";

  const facturacionEsEmpresa =
    facturacionTipoDocumento === "NIT";

  /*
  |--------------------------------------------------------------------------
  | INVALIDAR REVISIÓN
  |--------------------------------------------------------------------------
  */

  function invalidarRevision() {
    pedidoPendienteRef.current = null;
    setDatosConfirmados(false);
    setPedidoPreparado(null);
    setValidacionServidor(null);
    setErrorServidor("");
  }

  /*
  |--------------------------------------------------------------------------
  | DV
  |--------------------------------------------------------------------------
  */

  const digitoVerificacion = useMemo(() => {
    if (!esEmpresa) {
      return "";
    }

    return calcularDigitoVerificacion(
      numeroDocumento
    );
  }, [esEmpresa, numeroDocumento]);

  const facturacionDigitoVerificacion =
    useMemo(() => {
      if (!facturacionEsEmpresa) {
        return "";
      }

      return calcularDigitoVerificacion(
        facturacionNumeroDocumento
      );
    }, [
      facturacionEsEmpresa,
      facturacionNumeroDocumento,
    ]);

  /*
  |--------------------------------------------------------------------------
  | UBICACIONES
  |--------------------------------------------------------------------------
  */

  const departamentos = useMemo(() => {
    return obtenerDepartamentos();
  }, []);

  const municipios = useMemo(() => {
    if (departamento === "") {
      return [];
    }

    return obtenerMunicipios(departamento);
  }, [departamento]);

  const municipiosFacturacion = useMemo(() => {
    if (facturacionDepartamento === "") {
      return [];
    }

    return obtenerMunicipios(
      facturacionDepartamento
    );
  }, [facturacionDepartamento]);

  /*
  |--------------------------------------------------------------------------
  | ENVÍO PROVISIONAL DEL CLIENTE
  |--------------------------------------------------------------------------
  */

  const resultadoEnvio = useMemo(() => {
    return calcularEnvio(
      departamento,
      ciudad
    );
  }, [departamento, ciudad]);

  const valorEnvio =
    resultadoEnvio.disponible
      ? resultadoEnvio.valor
      : 0;

  /*
  |--------------------------------------------------------------------------
  | VALORES OFICIALES
  |--------------------------------------------------------------------------
  */

  const subtotalMostrado =
    validacionServidor?.totales?.subtotal ??
    subtotal;

  const valorEnvioMostrado =
    validacionServidor?.totales?.costoEnvio ??
    valorEnvio;

  const totalFinal =
    validacionServidor?.totales?.total ??
    subtotal + valorEnvio;

  /*
  |--------------------------------------------------------------------------
  | DOCUMENTO PRINCIPAL
  |--------------------------------------------------------------------------
  */

  function cambiarTipoDocumento(
    nuevoTipo: string
  ) {
    setTipoDocumento(nuevoTipo);
    setNumeroDocumento("");

    invalidarRevision();

    if (nuevoTipo !== "NIT") {
      setRazonSocial("");
    }

    setErrores((actuales) => ({
      ...actuales,
      tipoDocumento: undefined,
      numeroDocumento: undefined,
      razonSocial: undefined,
    }));
  }

  function cambiarNumeroDocumento(
    valor: string
  ) {
    let nuevoValor = valor;

    if (
      tipoDocumento === "CC" ||
      tipoDocumento === "NIT"
    ) {
      nuevoValor =
        valor.replace(/\D/g, "");
    }

    setNumeroDocumento(nuevoValor);

    invalidarRevision();

    setErrores((actuales) => ({
      ...actuales,
      numeroDocumento: undefined,
    }));
  }

  /*
  |--------------------------------------------------------------------------
  | ENTREGA
  |--------------------------------------------------------------------------
  */

  function cambiarDepartamento(
    nuevoDepartamento: string
  ) {
    setDepartamento(nuevoDepartamento);
    setCiudad("");

    invalidarRevision();

    setErrores((actuales) => ({
      ...actuales,
      departamento: undefined,
      ciudad: undefined,
    }));
  }

  function cambiarCiudad(
    nuevaCiudad: string
  ) {
    setCiudad(nuevaCiudad);

    invalidarRevision();

    setErrores((actuales) => ({
      ...actuales,
      ciudad: undefined,
    }));
  }

  /*
  |--------------------------------------------------------------------------
  | FACTURACIÓN
  |--------------------------------------------------------------------------
  */

  function cambiarModoFacturacion(
    usarMismosDatos: boolean
  ) {
    setUsarDatosCompradorParaFacturacion(
      usarMismosDatos
    );

    invalidarRevision();

    setErrores((actuales) => ({
      ...actuales,
      facturacionNombre: undefined,
      facturacionTipoDocumento: undefined,
      facturacionNumeroDocumento: undefined,
      facturacionRazonSocial: undefined,
      facturacionCorreo: undefined,
      facturacionDepartamento: undefined,
      facturacionCiudad: undefined,
      facturacionDireccion: undefined,
    }));
  }

  function cambiarFacturacionTipoDocumento(
    nuevoTipo: string
  ) {
    setFacturacionTipoDocumento(
      nuevoTipo
    );

    setFacturacionNumeroDocumento("");

    invalidarRevision();

    if (nuevoTipo !== "NIT") {
      setFacturacionRazonSocial("");
    }

    setErrores((actuales) => ({
      ...actuales,
      facturacionTipoDocumento: undefined,
      facturacionNumeroDocumento: undefined,
      facturacionRazonSocial: undefined,
    }));
  }

  function cambiarFacturacionNumeroDocumento(
    valor: string
  ) {
    let nuevoValor = valor;

    if (
      facturacionTipoDocumento === "CC" ||
      facturacionTipoDocumento === "NIT"
    ) {
      nuevoValor =
        valor.replace(/\D/g, "");
    }

    setFacturacionNumeroDocumento(
      nuevoValor
    );

    invalidarRevision();

    setErrores((actuales) => ({
      ...actuales,
      facturacionNumeroDocumento: undefined,
    }));
  }

  function cambiarFacturacionDepartamento(
    nuevoDepartamento: string
  ) {
    setFacturacionDepartamento(
      nuevoDepartamento
    );

    setFacturacionCiudad("");

    invalidarRevision();

    setErrores((actuales) => ({
      ...actuales,
      facturacionDepartamento: undefined,
      facturacionCiudad: undefined,
    }));
  }

  function cambiarFacturacionCiudad(
    nuevaCiudad: string
  ) {
    setFacturacionCiudad(nuevaCiudad);

    invalidarRevision();

    setErrores((actuales) => ({
      ...actuales,
      facturacionCiudad: undefined,
    }));
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDAR DOCUMENTO
  |--------------------------------------------------------------------------
  */

  function validarDocumento(
    tipo: string,
    numero: string
  ) {
    const documento = numero.trim();

    if (tipo === "") {
      return "Selecciona el tipo de documento.";
    }

    if (tipo === "CC") {
      const soloNumeros =
        documento.replace(/\D/g, "");

      if (soloNumeros.length < 5) {
        return "Ingresa una cédula válida.";
      }

      return "";
    }

    if (tipo === "NIT") {
      const soloNumeros =
        documento.replace(/\D/g, "");

      if (soloNumeros.length < 8) {
        return "Ingresa un NIT válido.";
      }

      if (soloNumeros.length > 15) {
        return "El NIT ingresado es demasiado largo.";
      }

      return "";
    }

    if (tipo === "CE") {
      if (documento.length < 5) {
        return "Ingresa una cédula de extranjería válida.";
      }

      return "";
    }

    if (tipo === "PAS") {
      if (documento.length < 5) {
        return "Ingresa un pasaporte válido.";
      }

      return "";
    }

    return "";
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDAR FORMULARIO
  |--------------------------------------------------------------------------
  */

  function validarFormulario() {
    const nuevosErrores:
      ErroresFormulario = {};

    if (nombre.trim().length < 3) {
      nuevosErrores.nombre =
        "Ingresa el nombre completo.";
    }

    if (tipoDocumento === "") {
      nuevosErrores.tipoDocumento =
        "Selecciona el tipo de documento.";
    }

    const errorDocumento =
      validarDocumento(
        tipoDocumento,
        numeroDocumento
      );

    if (errorDocumento !== "") {
      nuevosErrores.numeroDocumento =
        errorDocumento;
    }

    if (
      esEmpresa &&
      razonSocial.trim().length < 3
    ) {
      nuevosErrores.razonSocial =
        "Ingresa la razón social.";
    }

    const telefonoLimpio =
      telefono.replace(/\D/g, "");

    if (telefonoLimpio.length < 7) {
      nuevosErrores.telefono =
        "Ingresa un teléfono válido.";
    }

    const correoValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !correoValido.test(
        correo.trim()
      )
    ) {
      nuevosErrores.correo =
        "Ingresa un correo electrónico válido.";
    }

    if (departamento === "") {
      nuevosErrores.departamento =
        "Selecciona un departamento.";
    }

    if (ciudad === "") {
      nuevosErrores.ciudad =
        "Selecciona una ciudad o municipio.";
    }

    if (
      direccion.trim().length < 5
    ) {
      nuevosErrores.direccion =
        "Ingresa una dirección válida.";
    }

    /*
    |--------------------------------------------------------------------------
    | FACTURACIÓN DIFERENTE
    |--------------------------------------------------------------------------
    */

    if (
      !usarDatosCompradorParaFacturacion
    ) {
      if (
        facturacionNombre.trim().length <
        3
      ) {
        nuevosErrores.facturacionNombre =
          "Ingresa el nombre o contacto de facturación.";
      }

      if (
        facturacionTipoDocumento === ""
      ) {
        nuevosErrores.facturacionTipoDocumento =
          "Selecciona el tipo de documento.";
      }

      const errorDocumentoFacturacion =
        validarDocumento(
          facturacionTipoDocumento,
          facturacionNumeroDocumento
        );

      if (
        errorDocumentoFacturacion !== ""
      ) {
        nuevosErrores.facturacionNumeroDocumento =
          errorDocumentoFacturacion;
      }

      if (
        facturacionEsEmpresa &&
        facturacionRazonSocial.trim()
          .length < 3
      ) {
        nuevosErrores.facturacionRazonSocial =
          "Ingresa la razón social.";
      }

      if (
        !correoValido.test(
          facturacionCorreo.trim()
        )
      ) {
        nuevosErrores.facturacionCorreo =
          "Ingresa un correo de facturación válido.";
      }

      if (
        facturacionDepartamento === ""
      ) {
        nuevosErrores.facturacionDepartamento =
          "Selecciona un departamento.";
      }

      if (
        facturacionCiudad === ""
      ) {
        nuevosErrores.facturacionCiudad =
          "Selecciona una ciudad o municipio.";
      }

      if (
        facturacionDireccion.trim()
          .length < 5
      ) {
        nuevosErrores.facturacionDireccion =
          "Ingresa una dirección de facturación válida.";
      }
    }

    setErrores(nuevosErrores);

    return (
      Object.keys(nuevosErrores)
        .length === 0
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CONSTRUIR PEDIDO CON INFORMACIÓN OFICIAL
  |--------------------------------------------------------------------------
  */

  function construirPedidoPreparado(
    validacion: RespuestaValidacionCheckout
  ) {
    if (
      !validacion.productos ||
      !validacion.envio ||
      !validacion.totales
    ) {
      throw new Error(
        "La validación del servidor está incompleta."
      );
    }

    const productosPedido =
      validacion.productos.map(
        (producto) => ({
          productoId:
            producto.productoId,

          nombre:
            producto.nombre,

          precioUnitario:
            producto.precioUnitario,

          cantidad:
            producto.cantidad,

          subtotal:
            producto.subtotal,
        })
      );

    const tipoComprador =
      convertirTipoDocumento(
        tipoDocumento
      );

    const tipoFacturacion =
      usarDatosCompradorParaFacturacion
        ? tipoComprador
        : convertirTipoDocumento(
            facturacionTipoDocumento
          );

    const comprador = {
      nombre,

      tipoDocumento:
        tipoComprador,

      numeroDocumento,

      telefono,

      correo,

      razonSocial:
        esEmpresa
          ? razonSocial
          : undefined,

      digitoVerificacion:
        esEmpresa
          ? digitoVerificacion
          : undefined,
    };

    const entrega = {
      departamento,
      ciudad,
      direccion,

      complemento:
        complemento.trim() !== ""
          ? complemento
          : undefined,

      instrucciones:
        instrucciones.trim() !== ""
          ? instrucciones
          : undefined,
    };

    const facturacion =
      usarDatosCompradorParaFacturacion
        ? {
            mismosDatosComprador:
              true,

            nombre,

            tipoDocumento:
              tipoComprador,

            numeroDocumento,

            correo,

            razonSocial:
              esEmpresa
                ? razonSocial
                : undefined,

            digitoVerificacion:
              esEmpresa
                ? digitoVerificacion
                : undefined,

            departamento,

            ciudad,

            direccion,
          }
        : {
            mismosDatosComprador:
              false,

            nombre:
              facturacionNombre,

            tipoDocumento:
              tipoFacturacion,

            numeroDocumento:
              facturacionNumeroDocumento,

            correo:
              facturacionCorreo,

            razonSocial:
              facturacionEsEmpresa
                ? facturacionRazonSocial
                : undefined,

            digitoVerificacion:
              facturacionEsEmpresa
                ? facturacionDigitoVerificacion
                : undefined,

            departamento:
              facturacionDepartamento,

            ciudad:
              facturacionCiudad,

            direccion:
              facturacionDireccion,
          };

    const envio = {
      costo:
        validacion.envio.costo,

      zona:
        validacion.envio.zona,

      nombreZona:
        validacion.envio.nombreZona,

      mensaje:
        validacion.envio.mensaje,
    };

    return prepararPedido({
      productos:
        productosPedido,

      comprador,

      entrega,

      facturacion,

      envio,

      subtotal:
        validacion.totales.subtotal,

      costoEnvio:
        validacion.totales.costoEnvio,

      descuento:
        validacion.totales.descuento,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | CONFIRMAR Y VALIDAR CONTRA EL SERVIDOR
  |--------------------------------------------------------------------------
  */

  async function confirmarDatos(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorServidor("");
    setDatosConfirmados(false);
    setPedidoPreparado(null);
    setValidacionServidor(null);

    if (!validarFormulario()) {
      return;
    }

    if (!resultadoEnvio.disponible) {
      setErrorServidor(
        "No fue posible calcular el envío para la ubicación seleccionada."
      );
      return;
    }

    try {
      setValidandoServidor(true);

      /*
      |--------------------------------------------------------------------------
      | IMPORTANTE
      |--------------------------------------------------------------------------
      |
      | NO enviamos precios.
      | NO enviamos subtotales.
      | NO enviamos el total.
      |
      | El servidor recibe únicamente lo necesario para volver
      | a calcular la compra con información oficial.
      |
      */

      const respuesta = await fetch(
        "/api/checkout/validar",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            productos: items.map(
              (item) => ({
                id: String(item.id),
                cantidad:
                  item.cantidad,
              })
            ),

            departamento,
            ciudad,
          }),
        }
      );

      let resultado:
        RespuestaValidacionCheckout;

      try {
        resultado =
          (await respuesta.json()) as
            RespuestaValidacionCheckout;
      } catch {
        throw new Error(
          "El servidor devolvió una respuesta inválida."
        );
      }

      if (
        !respuesta.ok ||
        !resultado.ok
      ) {
        setErrorServidor(
          resultado.error ??
            "No fue posible validar el checkout."
        );

        return;
      }

      if (
        !resultado.productos ||
        !resultado.envio ||
        !resultado.totales
      ) {
        setErrorServidor(
          "El servidor no devolvió toda la información necesaria para validar el pedido."
        );

        return;
      }

      const pedido =
        construirPedidoPreparado(
          resultado
        );

      setValidacionServidor(
        resultado
      );

      setPedidoPreparado(
        pedido
      );

      setDatosConfirmados(
        true
      );
    } catch (error) {
      console.error(
        "Error validando checkout:",
        error
      );

      setErrorServidor(
        "No fue posible comunicarse con el servidor. Intenta nuevamente."
      );
    } finally {
      setValidandoServidor(
        false
      );
    }
  }

  async function continuarAlPago() {
    if (
      !pedidoPreparado ||
      !datosConfirmados ||
      iniciandoPago ||
      iniciandoPagoRef.current
    ) {
      return;
    }

    iniciandoPagoRef.current = true;
    setErrorServidor("");
    setIniciandoPago(true);

    try {
      let pedidoId = pedidoPendienteRef.current;

      if (!pedidoId) {
        const respuestaPedido = await fetch("/api/pedidos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productos: pedidoPreparado.productos.map((producto) => ({
              id: producto.productoId,
              cantidad: producto.cantidad,
            })),
            comprador_nombre: pedidoPreparado.comprador.nombre,
            comprador_tipo_documento: pedidoPreparado.comprador.tipoDocumento,
            comprador_numero_documento: pedidoPreparado.comprador.numeroDocumento,
            comprador_razon_social: pedidoPreparado.comprador.razonSocial,
            comprador_dv: pedidoPreparado.comprador.digitoVerificacion,
            comprador_telefono: pedidoPreparado.comprador.telefono,
            comprador_correo: pedidoPreparado.comprador.correo,
            entrega_departamento: pedidoPreparado.entrega.departamento,
            entrega_ciudad: pedidoPreparado.entrega.ciudad,
            entrega_direccion: pedidoPreparado.entrega.direccion,
            entrega_complemento: pedidoPreparado.entrega.complemento,
            entrega_instrucciones: pedidoPreparado.entrega.instrucciones,
            facturacion_nombre: pedidoPreparado.facturacion.nombre,
            facturacion_tipo_documento: pedidoPreparado.facturacion.tipoDocumento,
            facturacion_numero_documento: pedidoPreparado.facturacion.numeroDocumento,
            facturacion_razon_social: pedidoPreparado.facturacion.razonSocial,
            facturacion_dv: pedidoPreparado.facturacion.digitoVerificacion,
            facturacion_correo: pedidoPreparado.facturacion.correo,
            facturacion_departamento: pedidoPreparado.facturacion.departamento,
            facturacion_ciudad: pedidoPreparado.facturacion.ciudad,
            facturacion_direccion: pedidoPreparado.facturacion.direccion,
          }),
        });

        const pedido = (await respuestaPedido.json()) as {
          ok: boolean;
          error?: string;
          pedido?: { id: string };
        };

        if (!respuestaPedido.ok || !pedido.ok || !pedido.pedido?.id) {
          throw new Error(pedido.error || "No fue posible crear el pedido pendiente.");
        }

        pedidoId = pedido.pedido.id;
        pedidoPendienteRef.current = pedidoId;
      }

      const respuestaPago = await fetch("/api/pagos/wompi/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId }),
      });

      const pago = (await respuestaPago.json()) as {
        ok: boolean;
        error?: string;
        checkoutUrl?: string;
      };

      if (!respuestaPago.ok || !pago.ok || !pago.checkoutUrl) {
        throw new Error(pago.error || "No fue posible iniciar el pago.");
      }

      window.location.assign(pago.checkoutUrl);
    } catch (error) {
      iniciandoPagoRef.current = false;
      console.error("Error continuando al pago:", error);
      setErrorServidor(
        error instanceof Error ? error.message : "No fue posible continuar al pago."
      );
      setIniciandoPago(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DESCRIPCIÓN DOCUMENTO
  |--------------------------------------------------------------------------
  */

  function descripcionDocumento(
    tipo = tipoDocumento
  ) {
    if (tipo === "CC") {
      return "CC";
    }

    if (tipo === "CE") {
      return "CE";
    }

    if (tipo === "NIT") {
      return "NIT";
    }

    if (tipo === "PAS") {
      return "Pasaporte";
    }

    return "";
  }

  /*
  |--------------------------------------------------------------------------
  | RESUMEN FACTURACIÓN
  |--------------------------------------------------------------------------
  */

  const facturacionResumenNombre =
    usarDatosCompradorParaFacturacion
      ? esEmpresa
        ? razonSocial
        : nombre
      : facturacionEsEmpresa
        ? facturacionRazonSocial
        : facturacionNombre;

  const facturacionResumenDocumento =
    usarDatosCompradorParaFacturacion
      ? esEmpresa
        ? "NIT " +
          numeroDocumento +
          "-" +
          digitoVerificacion
        : descripcionDocumento() +
          " " +
          numeroDocumento
      : facturacionEsEmpresa
        ? "NIT " +
          facturacionNumeroDocumento +
          "-" +
          facturacionDigitoVerificacion
        : descripcionDocumento(
            facturacionTipoDocumento
          ) +
          " " +
          facturacionNumeroDocumento;

  const facturacionResumenCorreo =
    usarDatosCompradorParaFacturacion
      ? correo
      : facturacionCorreo;

  const facturacionResumenDireccion =
    usarDatosCompradorParaFacturacion
      ? direccion
      : facturacionDireccion;

  const facturacionResumenUbicacion =
    usarDatosCompradorParaFacturacion
      ? ciudad +
        ", " +
        departamento
      : facturacionCiudad +
        ", " +
        facturacionDepartamento;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#080a08] px-6 py-14 text-white lg:px-10">
        <div className="mx-auto max-w-7xl">
          {/* ENCABEZADO */}

          <div className="mb-10">
            <span className="text-sm font-bold uppercase tracking-[0.22em] text-[#82f000]">
              Finaliza tu compra
            </span>

            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Checkout
            </h1>

            <p className="mt-3 max-w-2xl text-white/50">
              Completa tus datos, calcula el
              envío y revisa toda la
              información antes de continuar al
              futuro proceso de pago.
            </p>
          </div>

          {carritoVacio ? (
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#82f000]/30 bg-[#82f000]/10 text-3xl">
                🛒
              </div>

              <h2 className="mt-6 text-2xl font-semibold">
                No tienes productos para comprar
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/45">
                Agrega al menos un producto al
                carrito antes de continuar.
              </p>

              <a
                href="/#productos"
                className="mt-7 inline-flex cursor-pointer rounded-xl bg-[#82f000] px-6 py-3 font-bold text-black transition hover:bg-[#9cff35]"
              >
                Ver productos
              </a>
            </section>
          ) : (
            <form
              onSubmit={confirmarDatos}
              className="grid items-start gap-8 lg:grid-cols-[1fr_380px]"
            >
              {/* IZQUIERDA */}

              <section className="space-y-6">
                {/* PASO 1 */}

                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#82f000]">
                    Paso 1
                  </span>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Datos de contacto
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/40">
                    Información para identificar
                    tu compra y mantenerte
                    informado sobre el pedido.
                  </p>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <Campo
                      label={
                        esEmpresa
                          ? "Nombre del contacto"
                          : "Nombre completo"
                      }
                      obligatorio
                      value={nombre}
                      onChange={(value) => {
                        setNombre(value);
                        invalidarRevision();
                      }}
                      placeholder={
                        esEmpresa
                          ? "Ej. Andrea Gómez"
                          : "Ej. Cristian Gómez"
                      }
                      error={errores.nombre}
                    />

                    <Campo
                      label="Teléfono"
                      obligatorio
                      value={telefono}
                      onChange={(value) => {
                        setTelefono(value);
                        invalidarRevision();
                      }}
                      placeholder="Ej. 300 000 0000"
                      type="tel"
                      error={errores.telefono}
                    />

                    <div className="sm:col-span-2">
                      <Campo
                        label="Correo electrónico"
                        obligatorio
                        value={correo}
                        onChange={(value) => {
                          setCorreo(value);
                          invalidarRevision();
                        }}
                        placeholder="Ej. correo@ejemplo.com"
                        type="email"
                        error={errores.correo}
                      />

                      <p className="mt-2 text-xs leading-5 text-white/30">
                        Este correo quedará
                        preparado para recibir la
                        confirmación del pedido y
                        los documentos asociados a
                        la compra.
                      </p>
                    </div>
                  </div>
                </div>

                {/* PASO 2 */}

                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#82f000]">
                    Paso 2
                  </span>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Identificación
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/40">
                    Selecciona el documento
                    correspondiente al comprador.
                  </p>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <SelectorDocumento
                      value={tipoDocumento}
                      onChange={cambiarTipoDocumento}
                      error={
                        errores.tipoDocumento
                      }
                    />

                    <Campo
                      label={
                        esEmpresa
                          ? "Número de NIT"
                          : "Número de identificación"
                      }
                      obligatorio
                      value={numeroDocumento}
                      onChange={
                        cambiarNumeroDocumento
                      }
                      placeholder={
                        esEmpresa
                          ? "Ej. 900123456"
                          : "Número de documento"
                      }
                      inputMode={
                        tipoDocumento === "CC" ||
                        tipoDocumento === "NIT"
                          ? "numeric"
                          : undefined
                      }
                      error={
                        errores.numeroDocumento
                      }
                    />
                  </div>

                  {esEmpresa && (
                    <div className="mt-6 border-t border-white/[0.07] pt-6">
                      <div className="mb-5">
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#82f000]">
                          Datos de empresa
                        </span>

                        <p className="mt-2 text-sm text-white/35">
                          El dígito de verificación
                          se calcula
                          automáticamente.
                        </p>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-[1fr_160px]">
                        <Campo
                          label="Razón social"
                          obligatorio
                          value={razonSocial}
                          onChange={(value) => {
                            setRazonSocial(value);
                            invalidarRevision();
                          }}
                          placeholder="Ej. Distribuidora Ejemplo S.A.S."
                          error={
                            errores.razonSocial
                          }
                        />

                        <CampoDV
                          valor={
                            digitoVerificacion
                          }
                        />
                      </div>

                      {numeroDocumento !== "" &&
                        digitoVerificacion !==
                          "" && (
                          <NitCompleto
                            numero={
                              numeroDocumento
                            }
                            dv={
                              digitoVerificacion
                            }
                          />
                        )}
                    </div>
                  )}
                </div>

                {/* PASO 3 */}

                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#82f000]">
                    Paso 3
                  </span>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Dirección de entrega
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/40">
                    Selecciona departamento y
                    ciudad. NOVA calculará una
                    tarifa provisional y el
                    servidor la verificará antes
                    de confirmar la revisión.
                  </p>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <SelectorUbicacion
                      label="Departamento"
                      value={departamento}
                      onChange={
                        cambiarDepartamento
                      }
                      opciones={departamentos.map(
                        (item) => ({
                          valor: item.nombre,
                          texto: item.nombre,
                          key:
                            item.codigo ??
                            item.nombre,
                        })
                      )}
                      placeholder="Selecciona un departamento"
                      error={
                        errores.departamento
                      }
                    />

                    <SelectorUbicacion
                      label="Ciudad o municipio"
                      value={ciudad}
                      onChange={cambiarCiudad}
                      opciones={municipios.map(
                        (item) => ({
                          valor: item.nombre,
                          texto: item.nombre,
                          key:
                            item.codigo ??
                            item.nombre,
                        })
                      )}
                      placeholder={
                        departamento === ""
                          ? "Primero selecciona un departamento"
                          : "Selecciona una ciudad o municipio"
                      }
                      disabled={
                        departamento === ""
                      }
                      error={errores.ciudad}
                    />

                    {resultadoEnvio.disponible && (
                      <div className="sm:col-span-2">
                        <div className="flex flex-col gap-4 rounded-2xl border border-[#82f000]/20 bg-[#82f000]/[0.045] p-5 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#82f000]">
                              Envío calculado
                            </p>

                            <p className="mt-2 font-semibold">
                              {
                                resultadoEnvio.nombreZona
                              }
                            </p>

                            <p className="mt-1 text-xs text-white/35">
                              {
                                resultadoEnvio.mensaje
                              }
                            </p>
                          </div>

                          <div className="shrink-0 sm:text-right">
                            <p className="text-xs text-white/35">
                              Tarifa provisional
                            </p>

                            <p className="mt-1 text-2xl font-bold text-[#82f000]">
                              {formatoPesos(
                                valorEnvio
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="sm:col-span-2">
                      <Campo
                        label="Dirección"
                        obligatorio
                        value={direccion}
                        onChange={(value) => {
                          setDireccion(value);
                          invalidarRevision();
                        }}
                        placeholder="Ej. Calle 10 # 20-30"
                        error={
                          errores.direccion
                        }
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Campo
                        label="Complemento"
                        value={complemento}
                        onChange={(value) => {
                          setComplemento(value);
                          invalidarRevision();
                        }}
                        placeholder="Ej. Apto 302, Torre B"
                      />

                      <p className="mt-2 text-xs text-white/25">
                        Opcional
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block">
                        <span className="text-sm font-medium text-white/70">
                          Instrucciones de entrega
                        </span>

                        <span className="ml-2 text-xs text-white/25">
                          Opcional
                        </span>

                        <textarea
                          value={instrucciones}
                          onChange={(event) => {
                            setInstrucciones(
                              event.target.value
                            );
                            invalidarRevision();
                          }}
                          placeholder="Ej. Llamar antes de llegar"
                          rows={4}
                          className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#82f000]/60 focus:ring-2 focus:ring-[#82f000]/10"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* PASO 4 */}

                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#82f000]">
                    Paso 4
                  </span>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Datos de facturación
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/40">
                    Define qué información se
                    utilizará posteriormente para
                    la facturación electrónica.
                  </p>

                  <label className="mt-6 flex cursor-pointer items-start gap-4 rounded-2xl border border-[#82f000]/20 bg-[#82f000]/[0.04] p-5">
                    <input
                      type="checkbox"
                      checked={
                        usarDatosCompradorParaFacturacion
                      }
                      onChange={(event) =>
                        cambiarModoFacturacion(
                          event.target.checked
                        )
                      }
                      className="mt-1 h-5 w-5 cursor-pointer accent-[#82f000]"
                    />

                    <div>
                      <p className="font-semibold">
                        Usar los mismos datos para
                        facturación
                      </p>

                      <p className="mt-1 text-sm leading-6 text-white/40">
                        Mantén esta opción activa
                        si la factura debe utilizar
                        los mismos datos del
                        comprador y la dirección
                        registrada.
                      </p>
                    </div>
                  </label>

                  {!usarDatosCompradorParaFacturacion && (
                    <div className="mt-6 border-t border-white/[0.07] pt-6">
                      <div className="mb-6">
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#82f000]">
                          Facturación diferente
                        </span>

                        <p className="mt-2 text-sm leading-6 text-white/35">
                          Completa los datos de la
                          persona o empresa a
                          nombre de quien deberá
                          emitirse la factura.
                        </p>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <Campo
                          label={
                            facturacionEsEmpresa
                              ? "Nombre del contacto"
                              : "Nombre completo"
                          }
                          obligatorio
                          value={
                            facturacionNombre
                          }
                          onChange={(value) => {
                            setFacturacionNombre(
                              value
                            );
                            invalidarRevision();
                          }}
                          placeholder="Nombre para facturación"
                          error={
                            errores.facturacionNombre
                          }
                        />

                        <Campo
                          label="Correo de facturación"
                          obligatorio
                          value={
                            facturacionCorreo
                          }
                          onChange={(value) => {
                            setFacturacionCorreo(
                              value
                            );
                            invalidarRevision();
                          }}
                          placeholder="facturacion@ejemplo.com"
                          type="email"
                          error={
                            errores.facturacionCorreo
                          }
                        />

                        <SelectorDocumento
                          value={
                            facturacionTipoDocumento
                          }
                          onChange={
                            cambiarFacturacionTipoDocumento
                          }
                          error={
                            errores.facturacionTipoDocumento
                          }
                        />

                        <Campo
                          label={
                            facturacionEsEmpresa
                              ? "Número de NIT"
                              : "Número de identificación"
                          }
                          obligatorio
                          value={
                            facturacionNumeroDocumento
                          }
                          onChange={
                            cambiarFacturacionNumeroDocumento
                          }
                          placeholder={
                            facturacionEsEmpresa
                              ? "Ej. 900123456"
                              : "Número de documento"
                          }
                          inputMode={
                            facturacionTipoDocumento ===
                              "CC" ||
                            facturacionTipoDocumento ===
                              "NIT"
                              ? "numeric"
                              : undefined
                          }
                          error={
                            errores.facturacionNumeroDocumento
                          }
                        />

                        {facturacionEsEmpresa && (
                          <>
                            <Campo
                              label="Razón social"
                              obligatorio
                              value={
                                facturacionRazonSocial
                              }
                              onChange={(value) => {
                                setFacturacionRazonSocial(
                                  value
                                );
                                invalidarRevision();
                              }}
                              placeholder="Ej. Empresa S.A.S."
                              error={
                                errores.facturacionRazonSocial
                              }
                            />

                            <CampoDV
                              valor={
                                facturacionDigitoVerificacion
                              }
                            />

                            {facturacionNumeroDocumento !==
                              "" &&
                              facturacionDigitoVerificacion !==
                                "" && (
                                <div className="sm:col-span-2">
                                  <NitCompleto
                                    numero={
                                      facturacionNumeroDocumento
                                    }
                                    dv={
                                      facturacionDigitoVerificacion
                                    }
                                  />
                                </div>
                              )}
                          </>
                        )}

                        <SelectorUbicacion
                          label="Departamento de facturación"
                          value={
                            facturacionDepartamento
                          }
                          onChange={
                            cambiarFacturacionDepartamento
                          }
                          opciones={departamentos.map(
                            (item) => ({
                              valor: item.nombre,
                              texto: item.nombre,
                              key:
                                item.codigo ??
                                item.nombre,
                            })
                          )}
                          placeholder="Selecciona un departamento"
                          error={
                            errores.facturacionDepartamento
                          }
                        />

                        <SelectorUbicacion
                          label="Ciudad o municipio"
                          value={
                            facturacionCiudad
                          }
                          onChange={
                            cambiarFacturacionCiudad
                          }
                          opciones={
                            municipiosFacturacion.map(
                              (item) => ({
                                valor: item.nombre,
                                texto: item.nombre,
                                key:
                                  item.codigo ??
                                  item.nombre,
                              })
                            )
                          }
                          placeholder={
                            facturacionDepartamento ===
                            ""
                              ? "Primero selecciona un departamento"
                              : "Selecciona una ciudad o municipio"
                          }
                          disabled={
                            facturacionDepartamento ===
                            ""
                          }
                          error={
                            errores.facturacionCiudad
                          }
                        />

                        <div className="sm:col-span-2">
                          <Campo
                            label="Dirección de facturación"
                            obligatorio
                            value={
                              facturacionDireccion
                            }
                            onChange={(value) => {
                              setFacturacionDireccion(
                                value
                              );
                              invalidarRevision();
                            }}
                            placeholder="Ej. Carrera 20 # 10-30"
                            error={
                              errores.facturacionDireccion
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                    <p className="text-xs leading-5 text-white/35">
                      La estructura queda
                      preparada para la futura
                      integración de facturación
                      electrónica.
                    </p>
                  </div>
                </div>

                {/* PASO 5 */}

                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#82f000]">
                    Paso 5
                  </span>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Pago
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/40">
                    Esta sección está preparada
                    para la futura integración de
                    la pasarela de pago real.
                  </p>

                  <div className="mt-6 flex items-start gap-4 rounded-2xl border border-[#82f000]/20 bg-[#82f000]/[0.045] p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#82f000]/10 text-[#82f000]">
                      ✓
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        Sin cobros durante el
                        desarrollo
                      </p>

                      <p className="mt-1 text-sm leading-6 text-white/40">
                        No se creará un pedido
                        definitivo hasta que un
                        proveedor de pagos real
                        confirme una transacción
                        exitosa.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* RESUMEN */}

              <aside className="h-fit lg:sticky lg:top-36">
                <div
                  className={
                    "overflow-hidden rounded-3xl border transition-all duration-500 " +
                    (datosConfirmados
                      ? "border-[#82f000]/30 bg-[#82f000]/[0.035] shadow-[0_0_60px_rgba(130,240,0,0.06)]"
                      : "border-white/10 bg-white/[0.035]")
                  }
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#82f000]">
                          Resumen
                        </span>

                        <h2 className="mt-2 text-2xl font-semibold">
                          Tu pedido
                        </h2>
                      </div>

                      {datosConfirmados && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#82f000]/30 bg-[#82f000]/10 font-bold text-[#82f000]">
                          ✓
                        </div>
                      )}
                    </div>

                    <div className="mt-6 space-y-4">
                      {validacionServidor?.productos
                        ? validacionServidor.productos.map(
                            (item) => (
                              <div
                                key={
                                  item.productoId
                                }
                                className="flex items-start justify-between gap-4 border-b border-white/[0.07] pb-4"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-medium">
                                    {
                                      item.nombre
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-white/35">
                                    Cantidad:{" "}
                                    {
                                      item.cantidad
                                    }
                                  </p>
                                </div>

                                <span className="shrink-0 text-sm font-semibold">
                                  {formatoPesos(
                                    item.subtotal
                                  )}
                                </span>
                              </div>
                            )
                          )
                        : items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start justify-between gap-4 border-b border-white/[0.07] pb-4"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium">
                                  {item.nombre}
                                </p>

                                <p className="mt-1 text-xs text-white/35">
                                  Cantidad:{" "}
                                  {item.cantidad}
                                </p>
                              </div>

                              <span className="shrink-0 text-sm font-semibold">
                                {formatoPesos(
                                  item.precio *
                                    item.cantidad
                                )}
                              </span>
                            </div>
                          ))}
                    </div>

                    <div className="mt-6 space-y-3 border-b border-white/[0.08] pb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/40">
                          Subtotal
                        </span>

                        <span className="font-semibold">
                          {formatoPesos(
                            subtotalMostrado
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/40">
                          Envío
                        </span>

                        {resultadoEnvio.disponible ? (
                          <span className="font-semibold">
                            {formatoPesos(
                              valorEnvioMostrado
                            )}
                          </span>
                        ) : (
                          <span className="text-white/35">
                            Por calcular
                          </span>
                        )}
                      </div>

                      {resultadoEnvio.disponible && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/25">
                            Zona
                          </span>

                          <span className="text-[#82f000]/70">
                            {validacionServidor
                              ?.envio
                              ?.nombreZona ??
                              resultadoEnvio.nombreZona}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex items-end justify-between gap-3">
                      <span className="text-sm text-white/50">
                        {validacionServidor
                          ? "Total validado"
                          : resultadoEnvio.disponible
                            ? "Total"
                            : "Total provisional"}
                      </span>

                      <span className="text-3xl font-bold text-[#82f000]">
                        {formatoPesos(
                          totalFinal
                        )}
                      </span>
                    </div>

                    {errorServidor && (
                      <div className="mt-5 rounded-xl border border-red-500/25 bg-red-500/[0.07] p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-400">
                          No pudimos validar el pedido
                        </p>

                        <p className="mt-2 text-sm leading-6 text-red-200/80">
                          {errorServidor}
                        </p>
                      </div>
                    )}

                    {!datosConfirmados && (
                      <>
                        <button
                          type="submit"
                          disabled={
                            validandoServidor
                          }
                          className={
                            "mt-7 w-full rounded-xl bg-[#82f000] px-5 py-3.5 font-bold text-black transition " +
                            (validandoServidor
                              ? "cursor-wait opacity-60"
                              : "cursor-pointer hover:bg-[#9cff35]")
                          }
                        >
                          {validandoServidor
                            ? "Validando pedido..."
                            : "Revisar datos"}
                        </button>

                        <p className="mt-3 text-center text-xs leading-5 text-white/25">
                          Se verificarán
                          productos, precios,
                          disponibilidad y envío
                          directamente con el
                          servidor. No se realizará
                          ningún cobro.
                        </p>
                      </>
                    )}
                  </div>

                  {/* REVISIÓN */}

                  {datosConfirmados && (
                    <div className="border-t border-[#82f000]/15 bg-black/15 p-6">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#82f000]/10 text-[#82f000]">
                          ✓
                        </div>

                        <div>
                          <p className="font-semibold">
                            Pedido validado
                          </p>

                          <p className="mt-1 text-xs leading-5 text-white/35">
                            NOVA verificó los
                            productos, precios,
                            disponibilidad y envío
                            con información del
                            servidor.
                          </p>
                        </div>
                      </div>

                      {pedidoPreparado && (
                        <div className="mt-5 rounded-xl border border-[#82f000]/15 bg-[#82f000]/[0.035] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#82f000]">
                            Pedido preparado
                          </p>

                          <p className="mt-2 text-xs leading-5 text-white/40">
                            Productos, comprador,
                            entrega, facturación,
                            envío y total fueron
                            organizados utilizando
                            los valores validados
                            por el servidor.
                          </p>
                        </div>
                      )}

                      <div className="mt-6 space-y-5">
                        {esEmpresa ? (
                          <ResumenCompacto
                            titulo="Empresa"
                            principal={
                              razonSocial
                            }
                            secundario={
                              "NIT " +
                              numeroDocumento +
                              "-" +
                              digitoVerificacion
                            }
                            detalle={
                              "Contacto: " +
                              nombre
                            }
                          />
                        ) : (
                          <ResumenCompacto
                            titulo="Comprador"
                            principal={nombre}
                            secundario={
                              descripcionDocumento() +
                              " " +
                              numeroDocumento
                            }
                          />
                        )}

                        <ResumenCompacto
                          titulo="Contacto"
                          principal={correo}
                          secundario={
                            telefono
                          }
                        />

                        <ResumenCompacto
                          titulo="Entrega"
                          principal={direccion}
                          secundario={
                            complemento.trim() !==
                            ""
                              ? complemento
                              : undefined
                          }
                          detalle={
                            ciudad +
                            ", " +
                            departamento
                          }
                        />

                        <ResumenCompacto
                          titulo="Facturación"
                          principal={
                            facturacionResumenNombre
                          }
                          secundario={
                            facturacionResumenDocumento
                          }
                          detalle={
                            facturacionResumenCorreo
                          }
                        />

                        <ResumenCompacto
                          titulo="Dirección de factura"
                          principal={
                            facturacionResumenDireccion
                          }
                          detalle={
                            facturacionResumenUbicacion
                          }
                        />

                        {validacionServidor?.envio && (
                          <ResumenCompacto
                            titulo="Envío"
                            principal={
                              validacionServidor
                                .envio
                                .nombreZona
                            }
                            secundario={
                              formatoPesos(
                                validacionServidor
                                  .envio
                                  .costo
                              )
                            }
                            detalle={
                              validacionServidor
                                .envio
                                .mensaje
                            }
                          />
                        )}

                        <ResumenCompacto
                          titulo="Total"
                          principal={
                            formatoPesos(
                              pedidoPreparado
                                ?.total ??
                                totalFinal
                            )
                          }
                        />
                      </div>

                      {instrucciones.trim() !== "" && (
                        <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#82f000]/70">
                            Instrucciones de
                            entrega
                          </p>

                          <p className="mt-2 text-xs leading-5 text-white/50">
                            {instrucciones}
                          </p>
                        </div>
                      )}

                      <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
                          Siguiente etapa
                        </p>

                        <p className="mt-2 text-xs leading-5 text-white/35">
                          La información ya fue
                          validada por el servidor,
                          pero todavía no existe un
                          pedido definitivo y no se
                          ha realizado ningún
                          cobro.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={continuarAlPago}
                        disabled={iniciandoPago || !pedidoPreparado}
                        className="mt-5 w-full cursor-pointer rounded-xl bg-[#82f000] px-5 py-3.5 font-bold text-black transition hover:bg-[#9cff35] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {iniciandoPago ? "Preparando pago seguro..." : "Continuar al pago"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          invalidarRevision();
                        }}
                        className="mt-3 w-full cursor-pointer rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/60 transition hover:border-[#82f000]/40 hover:text-[#82f000]"
                      >
                        Editar datos
                      </button>
                    </div>
                  )}
                </div>
              </aside>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

/*
|--------------------------------------------------------------------------
| CAMPO
|--------------------------------------------------------------------------
*/

type CampoProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;

  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal";

  obligatorio?: boolean;
  error?: string;
};

function Campo({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  obligatorio = false,
  error,
}: CampoProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-white/70">
        {label}

        {obligatorio && (
          <span className="ml-1 text-[#82f000]">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        className={
          "mt-2 w-full rounded-xl border bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 " +
          (error
            ? "border-red-500/70 focus:border-red-400"
            : "border-white/10 focus:border-[#82f000]/60 focus:ring-2 focus:ring-[#82f000]/10")
        }
      />

      {error && (
        <p className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}
    </label>
  );
}

/*
|--------------------------------------------------------------------------
| SELECTOR DOCUMENTO
|--------------------------------------------------------------------------
*/

type SelectorDocumentoProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

function SelectorDocumento({
  value,
  onChange,
  error,
}: SelectorDocumentoProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-white/70">
        Tipo de documento

        <span className="ml-1 text-[#82f000]">
          *
        </span>
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className={
          "mt-2 w-full cursor-pointer rounded-xl border bg-[#111411] px-4 py-3 text-sm text-white outline-none transition " +
          (error
            ? "border-red-500/70"
            : "border-white/10 focus:border-[#82f000]/60 focus:ring-2 focus:ring-[#82f000]/10")
        }
      >
        <option value="">
          Seleccionar
        </option>

        <option value="CC">
          Cédula de ciudadanía
        </option>

        <option value="CE">
          Cédula de extranjería
        </option>

        <option value="NIT">
          NIT / Empresa
        </option>

        <option value="PAS">
          Pasaporte
        </option>
      </select>

      {error && (
        <p className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}
    </label>
  );
}

/*
|--------------------------------------------------------------------------
| SELECTOR UBICACIÓN
|--------------------------------------------------------------------------
*/

type OpcionSelector = {
  valor: string;
  texto: string;
  key: string;
};

type SelectorUbicacionProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  opciones: OpcionSelector[];
  placeholder: string;
  disabled?: boolean;
  error?: string;
};

function SelectorUbicacion({
  label,
  value,
  onChange,
  opciones,
  placeholder,
  disabled = false,
  error,
}: SelectorUbicacionProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-white/70">
        {label}

        <span className="ml-1 text-[#82f000]">
          *
        </span>
      </span>

      <div className="relative mt-2">
        <select
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          disabled={disabled}
          className={
            "w-full appearance-none rounded-xl border bg-[#111411] px-4 py-3 pr-10 text-sm outline-none transition " +
            (disabled
              ? "cursor-not-allowed border-white/[0.06] text-white/25 "
              : "cursor-pointer text-white ") +
            (error
              ? "border-red-500/70"
              : !disabled
                ? "border-white/10 focus:border-[#82f000]/60 focus:ring-2 focus:ring-[#82f000]/10"
                : "")
          }
        >
          <option value="">
            {placeholder}
          </option>

          {opciones.map(
            (opcion) => (
              <option
                key={opcion.key}
                value={opcion.valor}
              >
                {opcion.texto}
              </option>
            )
          )}
        </select>

        <span
          className={
            "pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm " +
            (disabled
              ? "text-white/20"
              : "text-[#82f000]")
          }
        >
          ▼
        </span>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}
    </label>
  );
}

/*
|--------------------------------------------------------------------------
| DV
|--------------------------------------------------------------------------
*/

function CampoDV({
  valor,
}: {
  valor: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-white/70">
        Dígito de verificación
      </span>

      <div
        className={
          "mt-2 flex min-h-[46px] w-full items-center justify-between rounded-xl border px-4 py-3 text-sm " +
          (valor !== ""
            ? "border-[#82f000]/30 bg-[#82f000]/[0.06]"
            : "border-white/10 bg-black/20")
        }
      >
        <span
          className={
            valor !== ""
              ? "font-bold text-[#82f000]"
              : "text-white/25"
          }
        >
          {valor !== ""
            ? valor
            : "Automático"}
        </span>

        {valor !== "" && (
          <span className="text-[#82f000]">
            ✓
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-white/25">
        Calculado por NOVA
      </p>
    </label>
  );
}

/*
|--------------------------------------------------------------------------
| NIT COMPLETO
|--------------------------------------------------------------------------
*/

function NitCompleto({
  numero,
  dv,
}: {
  numero: string;
  dv: string;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-[#82f000]/20 bg-[#82f000]/[0.045] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#82f000]">
        NIT completo
      </p>

      <p className="mt-2 text-lg font-semibold">
        {numero}-{dv}
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| RESUMEN
|--------------------------------------------------------------------------
*/

type ResumenCompactoProps = {
  titulo: string;
  principal: string;
  secundario?: string;
  detalle?: string;
};

function ResumenCompacto({
  titulo,
  principal,
  secundario,
  detalle,
}: ResumenCompactoProps) {
  return (
    <div className="border-b border-white/[0.06] pb-4 last:border-b-0 last:pb-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#82f000]/70">
        {titulo}
      </p>

      <p className="mt-1.5 break-words text-sm font-semibold text-white/90">
        {principal}
      </p>

      {secundario && (
        <p className="mt-1 break-words text-xs text-white/45">
          {secundario}
        </p>
      )}

      {detalle && (
        <p className="mt-1 break-words text-xs font-medium text-white/30">
          {detalle}
        </p>
      )}
    </div>
  );
}
