import type { MetadataRoute } from "next";

/** Crawl: só o conteúdo público; o painel e as APIs ficam de fora. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/estudio", "/api/"],
      },
    ],
  };
}
