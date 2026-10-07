import type { NextConfig } from "next";

// Cabeçalhos de segurança para todas as respostas.
// O CSP permite apenas recursos do próprio site ( fontes e imagens
// auto-hospedadas ); 'unsafe-inline' fica só no script/estilo porque o
// Next e o tema da primeira pintura precisam deles. No dev, 'unsafe-eval'
// é liberado para o HMR do React.
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // nenhum módulo nativo: o banco usa o SQLite embutido do Node (node:sqlite),
  // então o bundler só precisa tratar os built-ins node:* (feito por padrão).
  images: { unoptimized: true },

  // sem o selo/menu de desenvolvimento do Next no canto da tela
  devIndicators: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
