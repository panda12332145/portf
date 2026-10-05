import { randomBytes, randomUUID } from "node:crypto";
import {
  countAdmins,
  deleteOtherSessions,
  deleteSession,
  findAdminByEmail,
  findAdminById,
  findSession,
  insertAdmin,
  insertSession,
  purgeSessions,
  setAdminPassword,
  touchAdminLogin,
  updateAdminProfile,
} from "@/db/admin";
import type { AdminRow } from "@/db/schema";
import {
  ARGON2,
  checkPassword,
  generatePassword,
  hashPassword,
  passwordProblem,
  type PasswordRecord,
} from "./password";

export { ARGON2, hashPassword, passwordProblem, generatePassword };

/* ------------------------------------------------------------------
 *  Aqui ficam as partes que dependem do banco: conta, sessão e
 *  verificação. O hashing em si vive em src/lib/password.ts.
 * ------------------------------------------------------------------ */

/* ==================================================================
 *  Conta da administradora
 * ------------------------------------------------------------------
 *  • senha → Argon2id (JS puro, sem módulo nativo), sempre com salt
 *    aleatório de 16 bytes por conta e digest de 64 bytes;
 *  • sessão → token aleatório de 32 bytes, guardado no SQLite e
 *    entregue num cookie HttpOnly (revogável a qualquer momento).
 * ================================================================== */

export const SESSION_COOKIE = "atelier_sessao";
export const SESSION_DAYS = 7;

/** Verifica a senha contra o registro guardado no banco. */
export function verifyPassword(password: string, admin: AdminRow): boolean {
  return checkPassword(password, admin);
}

export const hasAdminAccount = () => countAdmins() > 0;

export function createAdminAccount(input: {
  email: string;
  password: string;
  name?: string;
}): AdminRow {
  const record = hashPassword(input.password);
  return insertAdmin({ email: input.email, name: input.name ?? "", ...record });
}

/** Confere e-mail + senha; devolve a conta ou null. */
export function authenticate(email: string, password: string): AdminRow | null {
  const admin = findAdminByEmail(email);
  if (!admin) {
    // gasta o mesmo tempo de um hash real (evita descobrir e-mails por tempo)
    hashPassword(`${password}\u0000${randomBytes(8).toString("hex")}`);
    return null;
  }
  if (!verifyPassword(password, admin)) return null;
  touchAdminLogin(admin.id);
  return admin;
}

export function changePassword(adminId: number, password: string): void {
  setAdminPassword(adminId, hashPassword(password));
}

export function updateProfile(adminId: number, patch: { email?: string; name?: string }): AdminRow {
  updateAdminProfile(adminId, patch);
  return findAdminById(adminId)!;
}

/* ------------------------------ sessões --------------------------- */

export function startSession(adminId: number, userAgent: string | null): { token: string; expiresAt: number } {
  purgeSessions();
  const token = randomUUID().replace(/-/g, "") + randomBytes(16).toString("hex");
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  insertSession({ token, admin_id: adminId, expires_at: expiresAt, user_agent: userAgent });
  return { token, expiresAt };
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  expiresAt: number;
}

export function sessionUser(token: string | undefined | null): SessionUser | null {
  if (!token) return null;
  const row = findSession(token);
  if (!row) return null;
  return { id: row.id, email: row.email, name: row.name, expiresAt: row.expires_at };
}

export function endSession(token: string | undefined | null): void {
  if (token) deleteSession(token);
}

export function endOtherSessions(adminId: number, keepToken: string): number {
  return deleteOtherSessions(adminId, keepToken);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DAYS * 24 * 60 * 60,
};
