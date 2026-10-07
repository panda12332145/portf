import { randomBytes } from "node:crypto";
import { argon2id } from "@noble/hashes/argon2.js";
import { sameBytes } from "./secrets";

/* ==================================================================
 *  Senhas — Argon2id em JavaScript puro (@noble/hashes)
 * ------------------------------------------------------------------
 *  Nada de módulo nativo: a mesma instalação funciona no Windows,
 *  sem compilador. Cada conta tem o seu próprio salt aleatório de
 *  16 bytes e o hash guardado é de 64 bytes.
 * ================================================================== */

export const ARGON2 = { t: 2, m: 19456, p: 1, dkLen: 64 } as const;
export type Argon2Params = typeof ARGON2;

export interface PasswordRecord {
  password_hash: string;
  salt: string;
  params: string;
}

export function hashPassword(password: string): PasswordRecord {
  const salt = randomBytes(16);
  const digest = argon2id(password, salt, ARGON2);
  return {
    password_hash: Buffer.from(digest).toString("hex"),
    salt: salt.toString("base64"),
    params: JSON.stringify(ARGON2),
  };
}

export function parseParams(raw: string): Argon2Params {
  try {
    const parsed = JSON.parse(raw) as Partial<Argon2Params>;
    return {
      t: parsed.t ?? ARGON2.t,
      m: parsed.m ?? ARGON2.m,
      p: parsed.p ?? ARGON2.p,
      dkLen: parsed.dkLen ?? ARGON2.dkLen,
    };
  } catch {
    return { ...ARGON2 };
  }
}

/** Confere a senha em tempo constante. */
export function checkPassword(
  password: string,
  record: { password_hash: string; salt: string; params: string },
): boolean {
  try {
    const expected = Buffer.from(record.password_hash, "hex");
    const digest = argon2id(password, Buffer.from(record.salt, "base64"), parseParams(record.params));
    return sameBytes(Buffer.from(digest), expected);
  } catch {
    return false;
  }
}

/** Regras mínimas de senha (mostradas no painel). */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "A senha precisa de pelo menos 8 caracteres.";
  if (!/[a-zA-Z]/.test(password)) return "A senha precisa ter ao menos uma letra.";
  if (!/[0-9]/.test(password)) return "A senha precisa ter ao menos um número.";
  return null;
}

/** Senha inicial legível (letras + números), usada ao criar a conta. */
export function generatePassword(): string {
  return `${randomBytes(6).toString("base64url")}${Math.floor(10 + Math.random() * 89)}`;
}

/** Quanto tempo (ms) o hash leva — aparece no painel, em Conta. */
export function measureHash(password = "medida-de-tempo"): number {
  const t0 = Date.now();
  hashPassword(password);
  return Date.now() - t0;
}
