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

/** Dica amigável quando o problema é dependência faltando. */
function hintIfMissingModule(message: string) {
  if (/cannot find module|ERR_MODULE_NOT_FOUND|MODULE_NOT_FOUND/i.test(message)) {
    console.error("");
    console.error("[db] Alguma dependência do projeto não está instalada.");
    console.error("[db] Rode:  npm install   (ou apague a pasta node_modules e tente de novo)");
    console.error("[db] Dica: o iniciar.bat / iniciar.sh já fazem isso sozinhos.");
  }
}

console.log(`[db] ${force ? "recriando" : "sincronizando"} ${dbPath()}`);

try {
  const report = buildDatabase({ force });
  if (report.missingImages.length) process.exitCode = 1;
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[db] falhou: ${message}`);
  hintIfMissingModule(message);
  process.exit(1);
}
