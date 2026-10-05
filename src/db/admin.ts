import { sqlite } from "./queries";
import { REQUEST_STATUSES, type AdminRow, type RequestRow, type SettingRow } from "./schema";
import { KNOWN_SETTING_KEYS, SECRET_SETTING_KEYS } from "@/lib/admin/spec";
import { decryptSecret, encryptSecret } from "@/lib/secrets";
import type { RequestStatus } from "./schema";

/* ==================================================================
 *  Consultas da área administrativa
 *  Conta/sessões/configurações/pedidos + CRUD genérico das tabelas
 *  de conteúdo (obras, FAQ, estilos, páginas do livro).
 * ================================================================== */

const now = () => Date.now();
const bool = (v: boolean) => (v ? 1 : 0);

/* --------------------------- configurações ------------------------ */

export function getSettings(): Record<string, string> {
  const rows = sqlite.all<SettingRow>(`SELECT * FROM settings`);
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

/** Todas as configurações, com os segredos já decifrados (só no servidor). */
export function getSettingsDecrypted(): Record<string, string> {
  const rows = sqlite.all<SettingRow>(`SELECT * FROM settings`);
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.secret === 1 ? decryptSecret(r.value) : r.value;
  return out;
}

/** Valor já decifrado (para webhook, SMTP…). */
export function getSetting(key: string, fallback = ""): string {
  const row = sqlite.get<SettingRow>(`SELECT * FROM settings WHERE key = ?`, [key]);
  if (!row) return fallback;
  return row.secret === 1 ? decryptSecret(row.value) : row.value;
}

export function getSecretSetting(key: string): string {
  return getSetting(key, "");
}

export function setSetting(key: string, value: string): void {
  const secret = SECRET_SETTING_KEYS.includes(key) ? 1 : 0;
  const stored = secret && value ? encryptSecret(value) : value;
  sqlite.run(
    `INSERT INTO settings (key, value, secret, updated_at) VALUES (@key, @value, @secret, @now)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, secret = excluded.secret,
                                    updated_at = excluded.updated_at`,
    { key, value: stored, secret, now: now() },
  );
}

/** Grava só as chaves conhecidas; devolve quantas mudaram de fato. */
export function saveSettings(patch: Record<string, unknown>): number {
  let changed = 0;
  for (const [key, raw] of Object.entries(patch)) {
    if (!SECRET_SETTING_KEYS.includes(key) && !KNOWN_SETTING_KEYS.has(key)) continue;
    const value =
      raw === null || raw === undefined ? "" : typeof raw === "boolean" ? (raw ? "1" : "0") : String(raw);
    const before = sqlite.get<SettingRow>(`SELECT value FROM settings WHERE key = ?`, [key])?.value ?? null;
    const willStore = SECRET_SETTING_KEYS.includes(key) && value ? encryptSecret(value) : value;
    if (before === willStore) continue;
    setSetting(key, value);
    changed++;
  }
  return changed;
}

/* ------------------------------ contas ---------------------------- */

export function countAdmins(): number {
  return sqlite.get<{ n: number }>(`SELECT COUNT(*) AS n FROM admins`)?.n ?? 0;
}

export function findAdminByEmail(email: string): AdminRow | null {
  return sqlite.get<AdminRow>(`SELECT * FROM admins WHERE lower(email) = lower(?)`, [email.trim()]) ?? null;
}

export function findAdminById(id: number): AdminRow | null {
  return sqlite.get<AdminRow>(`SELECT * FROM admins WHERE id = ?`, [id]) ?? null;
}

export function insertAdmin(row: {
  email: string;
  name?: string;
  password_hash: string;
  salt: string;
  params: string;
}): AdminRow {
  sqlite.run(
    `INSERT INTO admins (email, name, password_hash, salt, params) VALUES (@email, @name, @hash, @salt, @params)`,
    {
      email: row.email.trim(),
      name: row.name ?? "",
      hash: row.password_hash,
      salt: row.salt,
      params: row.params,
    },
  );
  return findAdminByEmail(row.email)!;
}

export function updateAdminProfile(id: number, patch: { email?: string; name?: string }): void {
  const sets: string[] = [`updated_at = @now`];
  const params: Record<string, string | number> = { id, now: now() };
  if (patch.email !== undefined) {
    sets.push(`email = @email`);
    params.email = patch.email.trim();
  }
  if (patch.name !== undefined) {
    sets.push(`name = @name`);
    params.name = patch.name;
  }
  sqlite.run(`UPDATE admins SET ${sets.join(", ")} WHERE id = @id`, params);
}

export function setAdminPassword(
  id: number,
  record: { password_hash: string; salt: string; params: string },
): void {
  sqlite.run(
    `UPDATE admins
        SET password_hash = @password_hash, salt = @salt, params = @params, updated_at = @now
      WHERE id = @id`,
    {
      id,
      now: now(),
      password_hash: record.password_hash,
      salt: record.salt,
      params: record.params,
    },
  );
}

export function touchAdminLogin(id: number): void {
  sqlite.run(`UPDATE admins SET last_login_at = @now WHERE id = @id`, { id, now: now() });
}

/* ----------------------------- sessões ---------------------------- */

export function insertSession(row: {
  token: string;
  admin_id: number;
  expires_at: number;
  user_agent: string | null;
}): void {
  sqlite.run(
    `INSERT INTO sessions (token, admin_id, expires_at, user_agent)
     VALUES (@token, @admin_id, @expires_at, @ua)`,
    { ...row, ua: row.user_agent ?? null },
  );
}

export function findSession(
  token: string,
): { token: string; admin_id: number; expires_at: number; email: string; name: string; id: number } | null {
  return (
    sqlite.get<{
      token: string;
      admin_id: number;
      expires_at: number;
      email: string;
      name: string;
      id: number;
    }>(
      `SELECT s.token, s.admin_id, s.expires_at, a.email, a.name, a.id
         FROM sessions s JOIN admins a ON a.id = s.admin_id
        WHERE s.token = ? AND s.expires_at > ?`,
      [token, now()],
    ) ?? null
  );
}

export function deleteSession(token: string): void {
  sqlite.run(`DELETE FROM sessions WHERE token = @token`, { token });
}

export function deleteOtherSessions(adminId: number, keepToken: string): number {
  return sqlite.run(`DELETE FROM sessions WHERE admin_id = @id AND token <> @token`, {
    id: adminId,
    token: keepToken,
  }).changes;
}

export function purgeSessions(): number {
  return sqlite.run(`DELETE FROM sessions WHERE expires_at <= ?`, [now()]).changes;
}

/* ------------------------ caixa de pedidos ------------------------ */

export interface NewRequest {
  name: string;
  email: string;
  message: string;
  styles: { slug: string; name: string; price: number }[];
  total: number;
  user_agent?: string | null;
}

export function insertRequest(input: NewRequest): number {
  sqlite.run(
    `INSERT INTO requests (name, email, message, styles, total, user_agent, created_at)
     VALUES (@name, @email, @message, @styles, @total, @ua, @now)`,
    {
      name: input.name,
      email: input.email,
      message: input.message,
      styles: JSON.stringify(input.styles),
      total: input.total,
      ua: input.user_agent ?? null,
      now: now(),
    },
  );
  return sqlite.get<{ id: number }>(`SELECT last_insert_rowid() AS id`)!.id;
}

export interface RequestView {
  id: number;
  name: string;
  email: string;
  message: string;
  styles: { slug: string; name: string; price: number }[];
  total: number;
  status: RequestStatus;
  discordOk: boolean;
  emailOk: boolean;
  error: string | null;
  createdAt: number;
}

const parseStyles = (raw: string | null): { slug: string; name: string; price: number }[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const rowToRequest = (r: RequestRow): RequestView => ({
  id: r.id,
  name: r.name,
  email: r.email,
  message: r.message,
  styles: parseStyles(r.styles),
  total: r.total,
  status: (REQUEST_STATUSES as readonly string[]).includes(r.status)
    ? (r.status as RequestStatus)
    : "novo",
  discordOk: r.discord_ok === 1,
  emailOk: r.email_ok === 1,
  error: r.error,
  createdAt: r.created_at,
});

export function listRequests(limit = 300): RequestView[] {
  return sqlite
    .all<RequestRow>(`SELECT * FROM requests ORDER BY created_at DESC LIMIT ?`, [limit])
    .map(rowToRequest);
}

export function getRequest(id: number): RequestView | null {
  const row = sqlite.get<RequestRow>(`SELECT * FROM requests WHERE id = ?`, [id]);
  return row ? rowToRequest(row) : null;
}

export function countNewRequests(): number {
  return sqlite.get<{ n: number }>(`SELECT COUNT(*) AS n FROM requests WHERE status = 'novo'`)?.n ?? 0;
}

export function updateRequestDeliveries(
  id: number,
  patch: { discord_ok?: boolean; email_ok?: boolean; error?: string | null; status?: RequestStatus },
): void {
  const sets: string[] = [];
  const params: Record<string, string | number | null> = { id };
  if (patch.discord_ok !== undefined) {
    sets.push(`discord_ok = @discord_ok`);
    params.discord_ok = bool(patch.discord_ok);
  }
  if (patch.email_ok !== undefined) {
    sets.push(`email_ok = @email_ok`);
    params.email_ok = bool(patch.email_ok);
  }
  if (patch.error !== undefined) {
    sets.push(`error = @error`);
    params.error = patch.error;
  }
  if (patch.status !== undefined) {
    sets.push(`status = @status`);
    params.status = patch.status;
  }
  if (!sets.length) return;
  sqlite.run(`UPDATE requests SET ${sets.join(", ")} WHERE id = @id`, params);
}

export function deleteRequest(id: number): boolean {
  return sqlite.run(`DELETE FROM requests WHERE id = @id`, { id }).changes > 0;
}

/* --------------------------- CRUD genérico ------------------------ */

/** Colunas gravadas pelas telas do admin, por tabela de conteúdo. */
export function getRowById<T = Record<string, unknown>>(table: string, id: number): T | null {
  return sqlite.get<T>(`SELECT * FROM ${table} WHERE id = ?`, [id]) ?? null;
}

export function listRows<T = Record<string, unknown>>(table: string, orderBy: string): T[] {
  return sqlite.all<T>(`SELECT * FROM ${table} ORDER BY ${orderBy}`);
}

export function maxOrd(table: string): number {
  return sqlite.get<{ n: number | null }>(`SELECT MAX(ord) AS n FROM ${table}`)?.n ?? 0;
}

export function insertRow(table: string, values: Record<string, unknown>): number {
  const keys = Object.keys(values);
  const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${keys
    .map((k) => `@${k}`)
    .join(", ")})`;
  sqlite.run(sql, values);
  return sqlite.get<{ id: number }>(`SELECT last_insert_rowid() AS id`)!.id;
}

export function updateRowById(table: string, id: number, values: Record<string, unknown>): boolean {
  const keys = Object.keys(values);
  if (!keys.length) return false;
  const sql = `UPDATE ${table} SET ${keys.map((k) => `${k} = @${k}`).join(", ")} WHERE id = @id`;
  return sqlite.run(sql, { ...values, id }).changes >= 0;
}

export function deleteRowById(table: string, id: number): boolean {
  return sqlite.run(`DELETE FROM ${table} WHERE id = @id`, { id }).changes > 0;
}

export function reorderRows(table: string, ids: number[]): void {
  sqlite.tx(() => {
    ids.forEach((id, i) => {
      sqlite.run(`UPDATE ${table} SET ord = @ord WHERE id = @id`, { id, ord: i + 1 });
    });
  });
}

export function slugTaken(table: string, slug: string, exceptId?: number): boolean {
  const row = sqlite.get<{ id: number }>(`SELECT id FROM ${table} WHERE slug = ?`, [slug]);
  return !!row && row.id !== exceptId;
}
