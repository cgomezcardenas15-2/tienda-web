"use client";

import { FormEvent, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";

function formatoPesos(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

type ErroresFormulario = {
  nombre?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  telefono?: string;
  correo?: string;
  departamento?: string;
  ciudad?: string;
  direccion?: string;
};

export default function CheckoutPage() {
  const { items, subtotal } = useCart();

  const [nombre, setNombre] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");

  const [departamento, setDepartamento] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [direccion, setDireccion] = useState("");
  const [complemento, setComplemento] = useState("");
  const [instrucciones, setInstrucciones] = useState("");

  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [datosConfirmados, setDatosConfirmados] = useState(false);

  const carritoVacio = items.length === 0;

  function validarFormulario() {
    const nuevosErrores: ErroresFormulario = {};

    if (nombre.trim().length < 3) {
      nuevosErrores.nombre = "Ingresa tu nombre completo.";
    }

    if (tipoDocumento === "") {
      nuevosErrores.tipoDocumento = "Selecciona el tipo de documento.";
    }

    if (numeroDocumento.trim().length < 5) {
      nuevosErrores.numeroDocumento =
        "Ingresa un número de identificación válido.";
    }

    const telefonoLimpio = telefono.replace(/\D/g, "");

    if (telefonoLimpio.length < 7) {
      nuevosErrores.telefono = "Ingresa un teléfono válido.";
    }

    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correoValido.test(correo.trim())) {
      nuevosErrores.correo = "Ingresa un correo electrónico válido.";
    }

    if (departamento.trim() === "") {
      nuevosErrores.departamento = "Ingresa el departamento.";
    }

    if (ciudad.trim() === "") {
      nuevosErrores.ciudad = "Ingresa la ciudad o municipio.";
    }

    if (direccion.trim().length < 5) {
      nuevosErrores.direccion = "Ingresa una dirección válida.";
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  }

  function confirmarDatos(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validarFormulario()) {
      setDatosConfirmados(false);
      return;
    }

    setDatosConfirmados(true);
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#080a08] px-6 py-14 text-white lg:px-10">
        <div className="mx-auto max-w-7xl">
          {/* Encabezado */}
          <div className="mb-10">
            <span className="text-sm font-bold uppercase tracking-[0.22em] text-[#82f000]">
              Finaliza tu compra
            </span>

            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Checkout
            </h1>

            <p className="mt-3 max-w-2xl text-white/50">
              Completa tus datos de contacto, identificación y entrega para
              preparar correctamente tu pedido.
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
                Agrega al menos un producto al carrito antes de continuar con
                el proceso de compra.
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
              className="grid gap-8 lg:grid-cols-[1fr_380px]"
            >
              {/* Columna principal */}
              <section className="space-y-6">
                {/* Datos de contacto */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
                  <div className="mb-7">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#82f000]">
                      Paso 1
                    </span>

                    <h2 className="mt-2 text-2xl font-semibold">
                      Datos de contacto
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-white/40">
                      Esta información nos permitirá identificar tu compra y
                      comunicarnos contigo sobre el pedido.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Campo
                      label="Nombre completo"
                      obligatorio
                      value={nombre}
                      onChange={setNombre}
                      placeholder="Ej. Cristian Gómez"
                      error={errores.nombre}
                    />

                    <Campo
                      label="Teléfono"
                      obligatorio
                      value={telefono}
                      onChange={setTelefono}
                      placeholder="Ej. 300 000 0000"
                      type="tel"
                      error={errores.telefono}
                    />

                    <div className="sm:col-span-2">
                      <Campo
                        label="Correo electrónico"
                        obligatorio
                        value={correo}
                        onChange={setCorreo}
                        placeholder="Ej. correo@ejemplo.com"
                        type="email"
                        error={errores.correo}
                      />

                      <p className="mt-2 text-xs leading-5 text-white/30">
                        Este correo también podrá utilizarse para el envío de
                        documentos asociados a la compra cuando la facturación
                        electrónica esté habilitada.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Identificación */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
                  <div className="mb-7">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#82f000]">
                      Paso 2
                    </span>

                    <h2 className="mt-2 text-2xl font-semibold">
                      Identificación
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-white/40">
                      Estos datos quedarán preparados para identificar
                      correctamente al comprador y para la futura integración
                      del sistema de facturación.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-white/70">
                        Tipo de documento
                        <span className="ml-1 text-[#82f000]">*</span>
                      </span>

                      <select
                        value={tipoDocumento}
                        onChange={(event) =>
                          setTipoDocumento(event.target.value)
                        }
                        className={`mt-2 w-full cursor-pointer rounded-xl border bg-[#111411] px-4 py-3 text-sm text-white outline-none transition ${
                          errores.tipoDocumento
                            ? "border-red-500/70 focus:border-red-400"
                            : "border-white/10 focus:border-[#82f000]/60 focus:ring-2 focus:ring-[#82f000]/10"
                        }`}
                      >
                        <option value="">Seleccionar</option>
                        <option value="CC">Cédula de ciudadanía</option>
                        <option value="CE">Cédula de extranjería</option>
                        <option value="NIT">NIT</option>
                        <option value="PAS">Pasaporte</option>
                      </select>

                      {errores.tipoDocumento && (
                        <p className="mt-2 text-xs text-red-400">
                          {errores.tipoDocumento}
                        </p>
                      )}
                    </label>

                    <Campo
                      label="Número de identificación"
                      obligatorio
                      value={numeroDocumento}
                      onChange={setNumeroDocumento}
                      placeholder="Número de documento"
                      error={errores.numeroDocumento}
                    />
                  </div>

                  {tipoDocumento === "NIT" && (
                    <div className="mt-5 rounded-2xl border border-[#82f000]/15 bg-[#82f000]/[0.04] p-4">
                      <p className="text-sm leading-6 text-white/50">
                        Para compras empresariales podremos solicitar los datos
                        adicionales necesarios cuando conectemos el sistema
                        definitivo de facturación electrónica.
                      </p>
                    </div>
                  )}
                </div>

                {/* Entrega */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
                  <div className="mb-7">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#82f000]">
                      Paso 3
                    </span>

                    <h2 className="mt-2 text-2xl font-semibold">
                      Dirección de entrega
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-white/40">
                      Indica dónde quieres recibir tu pedido.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Campo
                      label="Departamento"
                      obligatorio
                      value={departamento}
                      onChange={setDepartamento}
                      placeholder="Ej. Valle del Cauca"
                      error={errores.departamento}
                    />

                    <Campo
                      label="Ciudad o municipio"
                      obligatorio
                      value={ciudad}
                      onChange={setCiudad}
                      placeholder="Ej. Cali"
                      error={errores.ciudad}
                    />

                    <div className="sm:col-span-2">
                      <Campo
                        label="Dirección"
                        obligatorio
                        value={direccion}
                        onChange={setDireccion}
                        placeholder="Ej. Calle 10 # 20-30"
                        error={errores.direccion}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Campo
                        label="Apartamento, casa, oficina o referencia"
                        value={complemento}
                        onChange={setComplemento}
                        placeholder="Ej. Apto 302, Torre B"
                      />
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
                          onChange={(event) =>
                            setInstrucciones(event.target.value)
                          }
                          placeholder="Ej. Llamar antes de llegar"
                          rows={4}
                          className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#82f000]/60 focus:ring-2 focus:ring-[#82f000]/10"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Pago */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#82f000]">
                    Paso 4
                  </span>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Método de pago
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/40">
                    La integración de pagos se habilitará cuando configuremos
                    el proveedor definitivo y el backend de NOVA.
                  </p>

                  <div className="mt-6 rounded-2xl border border-[#82f000]/20 bg-[#82f000]/[0.055] p-5">
                    <p className="text-sm font-semibold">
                      Pago online seguro
                    </p>

                    <p className="mt-2 text-sm leading-6 text-white/45">
                      En esta etapa estamos validando el checkout. No se
                      realizará ningún cobro.
                    </p>
                  </div>
                </div>
              </section>

              {/* Resumen */}
              <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-36">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#82f000]">
                  Resumen
                </span>

                <h2 className="mt-3 text-2xl font-semibold">
                  Tu pedido
                </h2>

                <div className="mt-6 space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 border-b border-white/[0.07] pb-4"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {item.nombre}
                        </p>

                        <p className="mt-1 text-xs text-white/35">
                          Cantidad: {item.cantidad}
                        </p>
                      </div>

                      <span className="text-sm font-semibold text-white/80">
                        {formatoPesos(item.precio * item.cantidad)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-4 border-b border-white/[0.08] pb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/45">
                      Subtotal
                    </span>

                    <span className="font-semibold">
                      {formatoPesos(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/45">
                      Envío
                    </span>

                    <span className="text-white/60">
                      Por calcular
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-end justify-between gap-4">
                  <span className="text-sm text-white/50">
                    Total provisional
                  </span>

                  <span className="text-3xl font-bold text-[#82f000]">
                    {formatoPesos(subtotal)}
                  </span>
                </div>

                <button
                  type="submit"
                  className="mt-7 w-full cursor-pointer rounded-xl bg-[#82f000] px-5 py-3.5 font-bold text-black transition hover:bg-[#9cff35]"
                >
                  Confirmar datos
                </button>

                {datosConfirmados && (
                  <div className="mt-5 rounded-xl border border-[#82f000]/25 bg-[#82f000]/10 p-4">
                    <p className="text-sm font-semibold text-[#9cff35]">
                      ✓ Datos confirmados correctamente
                    </p>

                    <p className="mt-2 text-xs leading-5 text-white/45">
                      El checkout está listo para continuar con la futura
                      integración de pago.
                    </p>
                  </div>
                )}

                <p className="mt-4 text-center text-xs leading-5 text-white/30">
                  Los campos marcados con * son obligatorios.
                </p>
              </aside>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

type CampoProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  obligatorio?: boolean;
  error?: string;
};

function Campo({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  obligatorio = false,
  error,
}: CampoProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-white/70">
        {label}

        {obligatorio && (
          <span className="ml-1 text-[#82f000]">*</span>
        )}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`mt-2 w-full rounded-xl border bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 ${
          error
            ? "border-red-500/70 focus:border-red-400"
            : "border-white/10 focus:border-[#82f000]/60 focus:ring-2 focus:ring-[#82f000]/10"
        }`}
      />

      {error && (
        <p className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}
    </label>
  );
}