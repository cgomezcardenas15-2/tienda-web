import { NextResponse } from "next/server";
import sharp from "sharp";
import { getAdminSession } from "@/app/lib/adminAuth";
import { cargarRemision, nombreArchivoRemision, textoRemision } from "@/app/lib/remisionPedido";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pesos = (valor: unknown) => `$ ${Math.round(Number(valor) || 0).toLocaleString("es-CO")}`;
const escapar = (valor: unknown) => String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c] || c);

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Acceso no autorizado." }, { status: 401 });
  const { id } = await context.params;
  const datos = await cargarRemision(id);
  if (!datos) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  const { pedido, productos } = datos;
  const nombre = textoRemision(pedido.facturacion_razon_social || pedido.facturacion_nombre || pedido.comprador_nombre);
  const filas = productos.slice(0, 8).map((producto, i) => {
    const cantidad = Number(producto.cantidad), precio = Number(producto.precio_unitario), y = 650 + i * 62;
    return `<text x="76" y="${y}" class="item bold">${escapar(producto.nombre)}${producto.variante_nombre ? ` - ${escapar(producto.variante_nombre)}` : ""}</text><text x="765" y="${y}" class="item center">${cantidad}</text><text x="940" y="${y}" class="item right">${escapar(pesos(precio))}</text><text x="1130" y="${y}" class="item right bold">${escapar(pesos(precio * cantidad))}</text><line x1="70" y1="${y + 26}" x2="1130" y2="${y + 26}" stroke="#e5e7eb"/> `;
  }).join("");
  const totalY = Math.max(1100, 700 + productos.slice(0, 8).length * 62);
  const svg = `<svg width="1200" height="1500" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="1500" fill="#fff"/><style>.t{font-family:Arial,sans-serif;fill:#111311}.muted{fill:#71717a}.bold{font-weight:700}.item{font:20px Arial,sans-serif}.right{text-anchor:end}.center{text-anchor:middle}</style>
    <rect x="70" y="65" width="58" height="58" rx="12" fill="#89f000"/><text x="99" y="104" text-anchor="middle" font-family="Arial" font-size="30" font-weight="900">N</text>
    <text x="150" y="93" class="t" font-size="34" font-weight="900" letter-spacing="8">NOVA</text><text x="150" y="116" fill="#579900" font-family="Arial" font-size="12" font-weight="700" letter-spacing="3">TODO LO QUE NECESITAS</text>
    <rect x="960" y="65" width="170" height="38" rx="19" fill="#89f000"/><text x="1045" y="90" text-anchor="middle" font-family="Arial" font-size="15" font-weight="900">REMISION</text><text x="1130" y="132" class="t right" font-size="25" font-weight="900">REM-${escapar(pedido.numero_pedido)}</text>
    <line x1="70" y1="165" x2="1130" y2="165" stroke="#d4d4d8" stroke-width="3"/>
    <rect x="70" y="210" width="660" height="190" rx="22" fill="#fafafa" stroke="#e5e7eb" stroke-width="2"/><text x="100" y="250" class="muted" font-family="Arial" font-size="14" font-weight="700">CLIENTE</text><text x="100" y="292" class="t" font-size="28" font-weight="900">${escapar(nombre)}</text><text x="100" y="330" class="muted" font-family="Arial" font-size="19">${escapar(textoRemision(pedido.comprador_tipo_documento))} ${escapar(textoRemision(pedido.comprador_numero_documento))}</text><text x="100" y="364" class="muted" font-family="Arial" font-size="19">${escapar(textoRemision(pedido.comprador_correo))}</text>
    <rect x="755" y="210" width="375" height="190" rx="22" fill="#efffd8"/><text x="785" y="250" fill="#467900" font-family="Arial" font-size="14" font-weight="700">PEDIDO</text><text x="785" y="294" class="t" font-size="28" font-weight="900">${escapar(pedido.numero_pedido)}</text><text x="785" y="342" fill="#467900" font-family="Arial" font-size="18" font-weight="800">PAGO ${escapar(textoRemision(pedido.estado_pago).toUpperCase())}</text>
    <text x="70" y="450" class="muted" font-family="Arial" font-size="14" font-weight="700">ENTREGAR EN</text><text x="70" y="490" class="t" font-size="21" font-weight="700">${escapar(textoRemision(pedido.entrega_direccion))} - ${escapar(textoRemision(pedido.entrega_ciudad))}, ${escapar(textoRemision(pedido.entrega_departamento))}</text>
    <rect x="70" y="550" width="1060" height="58" rx="12" fill="#111311"/><text x="76" y="586" fill="#fff" font-family="Arial" font-size="15" font-weight="700">PRODUCTO</text><text x="765" y="586" fill="#fff" text-anchor="middle" font-family="Arial" font-size="15" font-weight="700">CANT.</text><text x="940" y="586" fill="#fff" text-anchor="end" font-family="Arial" font-size="15" font-weight="700">UNITARIO</text><text x="1130" y="586" fill="#fff" text-anchor="end" font-family="Arial" font-size="15" font-weight="700">TOTAL</text>
    ${filas}
    <rect x="730" y="${totalY}" width="400" height="220" rx="22" fill="#f6f7f5" stroke="#e5e7eb" stroke-width="2"/><text x="765" y="${totalY + 48}" class="muted" font-family="Arial" font-size="19">Subtotal</text><text x="1095" y="${totalY + 48}" class="t right" font-size="19" font-weight="700">${escapar(pesos(pedido.subtotal))}</text><text x="765" y="${totalY + 88}" class="muted" font-family="Arial" font-size="19">Envio</text><text x="1095" y="${totalY + 88}" class="t right" font-size="19" font-weight="700">${escapar(pesos(pedido.costo_envio))}</text><line x1="765" y1="${totalY + 120}" x2="1095" y2="${totalY + 120}" stroke="#111311" stroke-width="3"/><text x="765" y="${totalY + 168}" class="t" font-size="28" font-weight="900">TOTAL</text><text x="1095" y="${totalY + 168}" fill="#579900" text-anchor="end" font-family="Arial" font-size="30" font-weight="900">${escapar(pesos(pedido.total))}</text>
    <text x="600" y="1440" text-anchor="middle" fill="#a1a1aa" font-family="Arial" font-size="12" font-weight="700" letter-spacing="3">REMISION COMERCIAL - DOCUMENTO NO FISCAL</text>
  </svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(png, { headers: { "Content-Type": "image/png", "Content-Disposition": `attachment; filename="${nombreArchivoRemision(pedido.numero_pedido, "png")}"`, "Cache-Control": "private, no-store" } });
}
