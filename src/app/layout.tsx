import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atelier Girassol — portfólio de arte & livro ilustrado",
  description:
    "Portfólio do Atelier Girassol: ilustração, aquarela, guache e comissões abertas — com o livro ilustrado interativo “O Jardim das Horas” em 3D.",
  openGraph: {
    title: "Atelier Girassol — portfólio de arte & livro ilustrado",
    description:
      "Ilustração feita à mão desde 2019, comissões abertas e um livro ilustrado para folhear em 3D.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* fontes do projeto, servidas localmente (funcionam offline e na pré-visualização) */}
        <link rel="stylesheet" href="/fonts/fonts.css" />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='15' fill='%23170e05'/%3E%3Ccircle cx='16' cy='16' r='5' fill='%23f5b301'/%3E%3Cg fill='%23ffcb3d'%3E%3Ccircle cx='16' cy='6' r='2.6'/%3E%3Ccircle cx='25' cy='11' r='2.6'/%3E%3Ccircle cx='25' cy='21' r='2.6'/%3E%3Ccircle cx='16' cy='26' r='2.6'/%3E%3Ccircle cx='7' cy='21' r='2.6'/%3E%3Ccircle cx='7' cy='11' r='2.6'/%3E%3C/g%3E%3C/svg%3E"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
