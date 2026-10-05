#!/usr/bin/env tsx
/**
 * Cria/atualiza o banco SQLite do site a partir de src/content/seed.ts.
 *
 *   npm run db:build    → cria o que falta, preserva ajustes do /estudio
 *   npm run db:seed     → recria tudo do zero (--force)
 *
 * Usa o SQLite embutido do Node (node:sqlite) — sem módulos nativos.
 */
import { buildDatabase, dbPath } from "../src/db/build";

const force = process.argv.includes("--force");
console.log(`[db] ${force ? "recriando" : "sincronizando"} ${dbPath()}`);
const report = buildDatabase({ force });
if (report.missingImages.length) process.exitCode = 1;
