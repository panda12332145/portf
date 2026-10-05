import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 é um módulo nativo: precisa ficar fora do bundle do servidor.
  serverExternalPackages: ["better-sqlite3"],
  images: { unoptimized: true },
};

export default nextConfig;
