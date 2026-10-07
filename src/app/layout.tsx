import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import ThemeScript from "@/components/site/ThemeScript";
import { getSite } from "@/db/queries";

/* O título e a descrição da aba vêm do banco (editáveis no /admin). */
export function generateMetadata(): Metadata {
  let title = "Atelier Girassol — portfólio de arte & livro ilustrado";
  let description =
    "Portfólio do Atelier Girassol: ilustração, aquarela, guache e comissões abertas — com o livro ilustrado interativo “O Jardim das Horas” em 3D.";
  let ogTitle = title;
  let ogDescription = "Ilustração feita à mão, comissões abertas e um livro ilustrado para folhear em 3D.";

  try {
    const site = getSite();
    title = site.metaTitle || title;
    description = site.metaDescription || description;
    ogTitle = site.metaOgTitle || title;
    ogDescription = site.metaOgDescription || description;
  } catch {
    /* sem banco (na primeira instalação) usamos os textos padrão */
  }

  return {
    title,
    description,
    openGraph: { title: ogTitle, description: ogDescription, type: "website" },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // data-theme é escrito pelo script abaixo antes da pintura
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* fontes do projeto, servidas localmente (funcionam offline e na pré-visualização) */}
        <link rel="stylesheet" href="/fonts/fonts.css" />
        <ThemeScript />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='15' fill='%23170e05'/%3E%3Ccircle cx='16' cy='16' r='5' fill='%23f5b301'/%3E%3Cg fill='%23ffcb3d'%3E%3Ccircle cx='16' cy='6' r='2.6'/%3E%3Ccircle cx='25' cy='11' r='2.6'/%3E%3Ccircle cx='25' cy='21' r='2.6'/%3E%3Ccircle cx='16' cy='26' r='2.6'/%3E%3Ccircle cx='7' cy='21' r='2.6'/%3E%3Ccircle cx='7' cy='11' r='2.6'/%3E%3C/g%3E%3C/svg%3E"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
