import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // nenhum módulo nativo: o banco usa o SQLite embutido do Node (node:sqlite),
  // então o bundler só precisa tratar os built-ins node:* (feito por padrão).
  images: { unoptimized: true },
};

export default nextConfig;
