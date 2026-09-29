import type { MetadataRoute } from "next";

const DOMINIO = "https://senornova.com.co";

export default function sitemap(): MetadataRoute.Sitemap {
  const rutas = [
    "",
    "/categoria/pinateria",
    "/categoria/hogar",
    "/categoria/cacharreria",
    "/categoria/motos",
    "/lo-quiero",
    "/buscar",
    "/consultar-pedido",
    "/terminos",
    "/privacidad",
    "/cookies",
  ];

  return rutas.map((ruta, indice) => ({
    url: `${DOMINIO}${ruta}`,
    lastModified: new Date(),
    changeFrequency: indice === 0 ? "daily" : "weekly",
    priority: indice === 0 ? 1 : ruta.startsWith("/categoria/") ? 0.8 : 0.5,
  }));
}
