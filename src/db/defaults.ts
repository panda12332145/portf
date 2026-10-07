import { randomUUID } from "node:crypto";
import type { SqliteDatabase } from "./sqlite";
import { DEFAULT_SETTINGS, KNOWN_SETTING_KEYS } from "@/lib/admin/spec";
import { generatePassword, hashPassword, passwordProblem } from "@/lib/password";

/* ==================================================================
 *  Padrões do banco: configurações e a conta administrativa
 * ------------------------------------------------------------------
 *  Roda em todo `db:build` e também ao abrir um banco que ainda não
 *  conhece essas tabelas — sem nunca apagar nada. Fica separado de
 *  build.ts para não criar ciclo de importação com as consultas.
 * ================================================================== */

export interface DefaultsReport {
  adminEmail: string | null;
  /** preenchido só quando a conta foi criada agora, para mostrar uma vez */
  adminPassword?: string;
}

export function ensureDefaults(db: SqliteDatabase, verbose = false): DefaultsReport {
  const now = Date.now();

  const existing = new Set(db.all<{ key: string }>(`SELECT key FROM settings`).map((r) => r.key));
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (existing.has(key) || !KNOWN_SETTING_KEYS.has(key)) continue;
    db.run(`INSERT INTO settings (key, value, secret, updated_at) VALUES (@key, @value, 0, @now)`, {
      key,
      value,
      now,
    });
  }

  const total = db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM admins`)?.n ?? 0;
  if (total > 0) {
    const row = db.get<{ email: string }>(`SELECT email FROM admins ORDER BY id LIMIT 1`);
    return { adminEmail: row?.email ?? null };
  }

  const email = (process.env.ATELIER_ADMIN_EMAIL ?? "admin@ateliergirassol.art").trim();
  const name = process.env.ATELIER_ADMIN_NAME ?? "Administradora";
  let password = process.env.ATELIER_ADMIN_PASSWORD ?? "";
  let generated = false;

  if (!password || passwordProblem(password)) {
    password = generatePassword();
    generated = true;
  }

  const record = hashPassword(password);
  db.run(
    `INSERT INTO admins (email, name, password_hash, salt, params, created_at, updated_at)
     VALUES (@email, @name, @hash, @salt, @params, @now, @now)`,
    { email, name, hash: record.password_hash, salt: record.salt, params: record.params, now },
  );

  if (verbose) {
    console.log(`[db] conta administrativa criada: ${email}`);
    if (generated) {
      console.log(`     senha inicial: ${password}`);
      console.log("     troque no painel /admin → Conta (ou rode: npm run admin:pass)");
    }
  }

  return { adminEmail: email, adminPassword: generated ? password : undefined };
}

/** Token de sessão: 64 caracteres aleatórios em hexadecimal. */
export function newSessionToken(): string {
  return randomUUID().replace(/-/g, "");
}
