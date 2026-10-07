#!/usr/bin/env tsx
/**
 * Mostra o estado do banco: livro, páginas (com enquadramento) e contagens.
 *   npm run db:inspect                     → resumo
 *   npm run db:inspect -- --sql "SELECT * FROM pages"   → SQL livre
 */
import { dbPath } from "../src/db/build";
import { openDatabase } from "../src/db/sqlite";

const argv = process.argv.slice(2);
const sqlIdx = argv.indexOf("--sql");
const db = openDatabase(dbPath(), { readOnly: !argv.includes("--write") });

try {
  if (sqlIdx >= 0) {
    const rows = db.all(argv[sqlIdx + 1]);
    console.table(rows);
  } else {
    const book = db.get<Record<string, string>>("SELECT * FROM books LIMIT 1");
    if (!book) {
      console.log("banco vazio — rode `npm run db:build`");
    } else {
      console.log(`\n📖  ${book.title} — ${book.author} (${book.edition})`);
      const pages = db.all(
        `SELECT ord, slug, kind, title, image_path, image_width AS w, image_height AS h,
                fit, frame, backdrop, zoom, offset_x AS ox, offset_y AS oy, rotation AS rot,
                layout_auto AS auto
           FROM pages ORDER BY ord`,
      );
      console.table(pages);
      for (const t of ["artworks", "faqs", "commissions"]) {
        const n = db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${t}`)!.n;
        console.log(`   ${t.padEnd(12)} ${n}`);
      }
    }
  }
} finally {
  db.close();
}
