import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/checkout/", "/confirmacion/", "/pago/"],
    },
    sitemap: "https://senornova.com.co/sitemap.xml",
    host: "https://senornova.com.co",
  };
}
