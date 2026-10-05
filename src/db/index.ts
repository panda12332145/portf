import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { ensureDatabase } from "./build";

const globalForDb = globalThis as typeof globalThis & {
  __atelierSqlite?: Database.Database;
  __atelierDrizzle?: ReturnType<typeof drizzle<typeof schema>>;
};

function create(): Database.Database {
  // garante que o arquivo existe, tem o schema e está populado
  const path = ensureDatabase();
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return sqlite;
}

export const sqlite = globalForDb.__atelierSqlite ?? create();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__atelierSqlite = sqlite;
}

export const db = globalForDb.__atelierDrizzle ?? drizzle(sqlite, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__atelierDrizzle = db;
}

export { schema };
