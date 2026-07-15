import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/ar/checkout",
          "/en/checkout",
          "/ar/cart",
          "/en/cart",
          "/ar/style-guide",
          "/en/style-guide",
          "/ar/admin",
          "/en/admin",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
