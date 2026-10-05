/**
 * ------------------------------------------------------------------
 *  Acesso ao SQLite usando o módulo embutido do Node (node:sqlite)
 * ------------------------------------------------------------------
 *  Nada de módulos nativos: `npm install` não compila nada e funciona
 *  igual no Windows, macOS e Linux (Node 22.5+; sem flag a partir do
 *  22.13/23.4 — a flag `--experimental-sqlite` é aceita quando preciso).
 * ------------------------------------------------------------------
 */

import { DatabaseSync, type StatementSync } from "node:sqlite";

export type SqlValue = string | number | bigint | null | Uint8Array;

export interface RunResult {
  changes: number;
  lastInsertRowid: number;
}

/** Helper fino sobre o StatementSync, com cache de statements preparados. */
export class SqliteDatabase {
  readonly file: string;
  readonly readOnly: boolean;
  #db: DatabaseSync;
  #cache = new Map<string, StatementSync>();
  #namesCache = new Map<string, string[]>();

  constructor(file: string, opts: { readOnly?: boolean } = {}) {
    this.file = file;
    this.readOnly = opts.readOnly ?? false;
    this.#db = new DatabaseSync(file, { readOnly: this.readOnly });
  }

  #stmt(sql: string): StatementSync {
    let stmt = this.#cache.get(sql);
    if (!stmt) {
      stmt = this.#db.prepare(sql);
      this.#cache.set(sql, stmt);
    }
    return stmt;
  }

  /**
   * Nomes de parâmetros usados numa instrução SQL (`@nome`, `:nome`, `$nome`).
   * O node:sqlite recusa chaves vindas no objeto que não existam no SQL —
   * então filtramos aqui, o que permite reaproveitar um mesmo objeto de
   * valores entre instruções diferentes (como no seed do banco).
   */
  #names(sql: string): string[] {
    const cached = this.#namesCache.get(sql);
    if (cached) return cached;
    const names: string[] = [];
    const re = /[@:$]([A-Za-z_][A-Za-z0-9_]*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql)) !== null) {
      if (!names.includes(m[1])) names.push(m[1]);
    }
    this.#namesCache.set(sql, names);
    return names;
  }

  /** booleanos viram 0/1 e undefined vira null (exigências do node:sqlite) */
  #bind(value: unknown): SqlValue {
    if (typeof value === "boolean") return value ? 1 : 0;
    if (value === undefined) return null;
    return value as SqlValue;
  }

  /** parâmetros: array (?, ?, …) ou objeto (@nome) */
  #args(sql: string, params?: Record<string, unknown> | SqlValue[]): SqlValue[] {
    if (!params) return [];
    if (Array.isArray(params)) return params.map((v) => this.#bind(v));
    const names = this.#names(sql);
    return [Object.fromEntries(names.map((n) => [n, this.#bind(params[n])])) as unknown as SqlValue];
  }

  all<T = Record<string, unknown>>(sql: string, params?: Record<string, unknown> | SqlValue[]): T[] {
    return this.#stmt(sql).all(...this.#args(sql, params)) as T[];
  }

  get<T = Record<string, unknown>>(sql: string, params?: Record<string, unknown> | SqlValue[]): T | undefined {
    return this.#stmt(sql).get(...this.#args(sql, params)) as T | undefined;
  }

  run(sql: string, params?: Record<string, unknown> | SqlValue[]): RunResult {
    const r = this.#stmt(sql).run(...this.#args(sql, params));
    return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) };
  }

  /** SQL de várias instruções (DDL, PRAGMA…). */
  exec(sql: string) {
    this.#db.exec(sql);
  }

  pragma(statement: string) {
    this.#db.exec(`PRAGMA ${statement}`);
  }

  /** Transação explícita: BEGIN → fn() → COMMIT (ROLLBACK em erro). */
  tx<T>(fn: () => T): T {
    this.#db.exec("BEGIN");
    try {
      const out = fn();
      this.#db.exec("COMMIT");
      return out;
    } catch (err) {
      try {
        this.#db.exec("ROLLBACK");
      } catch {
        /* ignora */
      }
      throw err;
    }
  }

  close() {
    this.#cache.clear();
    this.#namesCache.clear();
    this.#db.close();
  }
}

export function openDatabase(file: string, opts: { readOnly?: boolean } = {}) {
  return new SqliteDatabase(file, opts);
}
