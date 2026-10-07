import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/* ==================================================================
 *  Cofre do projeto — AES-256-GCM
 * ------------------------------------------------------------------
 *  O que é secreto no banco (webhook do Discord, senha de SMTP…)
 *  fica cifrado com AES-256-GCM. A chave vem, nesta ordem:
 *
 *   1. variável de ambiente ATELIER_SECRET  (recomendado em produção);
 *   2. arquivo .atelier-secret na raiz do projeto (criado sozinho,
 *      iginorado pelo git) — é o caso do uso local no Windows;
 *   3. aleatória em memória (só se não der para gravar nada — os
 *      segredos precisam ser digitados de novo a cada reinício).
 *
 *  Cada valor guarda o seu próprio IV aleatório de 12 bytes, no
 *  formato  v1.<iv>.<tag>.<cifra>  (base64 url-safe).
 * ================================================================== */

const FILE = () => path.join(process.cwd(), ".atelier-secret");
const KEY_CONTEXT = "atelier-girassol/aes-256-gcm/v1";
const PREFIX = "v1";

let cachedKey: Buffer | null = null;
let volatileSecret: string | null = null;

export type SecretSource = "env" | "arquivo" | "memoria";

export function secretSource(): SecretSource {
  if (process.env.ATELIER_SECRET?.trim()) return "env";
  try {
    // já existe, ou o projeto é gravável e o arquivo nasce no primeiro uso
    if (fs.existsSync(FILE())) return "arquivo";
    fs.accessSync(process.cwd(), fs.constants.W_OK);
    return "arquivo";
  } catch {
    /* pasta somente leitura → a chave fica só na memória */
  }
  return "memoria";
}

/** De onde sai a chave de cifra. Nunca sai daqui para o navegador. */
export function serverSecret(): string {
  const fromEnv = process.env.ATELIER_SECRET?.trim();
  if (fromEnv) return fromEnv;

  const file = FILE();
  try {
    if (fs.existsSync(file)) {
      const saved = fs.readFileSync(file, "utf8").trim();
      if (saved) return saved;
    }
    const generated = randomBytes(48).toString("base64url");
    fs.writeFileSync(file, `${generated}\n`, { mode: 0o600 });
    return generated;
  } catch {
    volatileSecret ??= randomBytes(48).toString("base64url");
    return volatileSecret;
  }
}

function key(): Buffer {
  cachedKey ??= scryptSync(serverSecret(), KEY_CONTEXT, 32);
  return cachedKey;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString("base64url"), tag.toString("base64url"), body.toString("base64url")].join(
    ".",
  );
}

export function looksEncrypted(value: string): boolean {
  return value.startsWith(`${PREFIX}.`) && value.split(".").length === 4;
}

/** Decifra; devolve "" se o valor não for decifrável (chave trocada). */
export function decryptSecret(blob: string): string {
  if (!blob) return "";
  if (!looksEncrypted(blob)) return blob; // valor legado em texto puro
  try {
    const [, iv, tag, body] = blob.split(".");
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString(
      "utf8",
    );
  } catch {
    return "";
  }
}

/** Comparação de bytes em tempo constante (usada também pelas senhas). */
export function sameBytes(a: Buffer | Uint8Array, b: Buffer | Uint8Array): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
