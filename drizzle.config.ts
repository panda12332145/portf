import type { Config } from "drizzle-kit";

/**
 * Banco único do projeto: SQLite em ./data/atelier.sqlite
 * `npm run db:build` cria/atualiza o arquivo a partir de src/content + public/book.
 */
export default {
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./data/migrations",
  dbCredentials: { url: "./data/atelier.sqlite" },
} satisfies Config;
