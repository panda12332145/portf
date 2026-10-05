import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // nenhum módulo nativo: o banco usa o SQLite embutido do Node (node:sqlite),
  // então o bundler só precisa tratar os built-ins node:* (feito por padrão).
  images: { unoptimized: true },

  // sem o selo/menu de desenvolvimento do Next no canto da tela
  devIndicators: false,
};

export default nextConfig;
