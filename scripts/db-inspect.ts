#!/usr/bin/env tsx
/**
 * Mostra o estado do banco: livro, páginas (com enquadramento) e contagens.
 *   npm run db:inspect        → resumo
 *   npm run db:inspect -- --sql "SELECT * FROM pages"   → SQL livre
 */
import Database from "better-sqlite3";
import { dbPath } from "../src/db/build";

const sqlite = new Database(dbPath(), { readonly: true });
const argv = process.argv.slice(2);
const sqlIdx = argv.indexOf("--sql");

if (sqlIdx >= 0) {
  const rows = sqlite.prepare(argv[sqlIdx + 1]).all();
  console.table(rows);
} else {
  const book = sqlite.prepare("SELECT * FROM books LIMIT 1").get() as Record<string, unknown>;
  if (!book) {
    console.log("banco vazio — rode `npm run db:build`");
  } else {
    console.log(`\n📖  ${book.title} — ${book.author} (${book.edition})`);
    const pages = sqlite
      .prepare(
        `SELECT ord, slug, kind, title, image_path, image_width AS w, image_height AS h,
                fit, frame, backdrop, zoom, offset_x AS ox, offset_y AS oy, rotation AS rot,
                layout_auto AS auto
         FROM pages ORDER BY ord`,
      )
      .all() as Array<Record<string, unknown>>;
    console.table(pages);
    for (const t of ["artworks", "faqs", "commissions"]) {
      const n = (sqlite.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n;
      console.log(`   ${t.padEnd(12)} ${n}`);
    }
  }
}
sqlite.close();
