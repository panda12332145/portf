#!/usr/bin/env tsx
/**
 * Importador da pasta do livro.
 *
 * Varre public/book/ e cadastra como páginas novas (kind = 'art') toda
 * imagem que ainda não existe no banco, com o enquadramento calculado
 * automaticamente. Depois é só ajustar no /estudio.
 *
 *   npm run db:import            → adiciona as imagens que faltam
 *   npm run db:import -- --list  → só lista o que entraria
 */
import fs from "node:fs";
import path from "node:path";
import { dbPath } from "../src/db/build";
import { openDatabase } from "../src/db/sqlite";
import { imageSize } from "../src/lib/image-size";
import { autoLayout } from "../src/lib/layout";

const LIST_ONLY = process.argv.includes("--list");
const BOOK_DIR = path.join(process.cwd(), "public", "book");
const db = openDatabase(dbPath());
db.pragma("foreign_keys = ON");

try {
  const book = db.get<{ id: number }>("SELECT id FROM books LIMIT 1");
  if (!book) {
    console.error("banco sem livro — rode `npm run db:build` primeiro");
    process.exit(1);
  }

  const known = new Set(
    db
      .all<{ image_path: string }>(
        "SELECT image_path FROM pages WHERE image_path IS NOT NULL",
      )
      .map((r) => r.image_path),
  );
  const maxOrd = db.get<{ n: number }>("SELECT COALESCE(MAX(ord), 0) AS n FROM pages")!.n;

  const files = fs
    .readdirSync(BOOK_DIR)
    .filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f))
    .sort();

  const novos = files.filter((f) => !known.has(`/book/${f}`));
  if (!novos.length) {
    console.log(`[import] nada novo em public/book/ (${files.length} imagens já cadastradas)`);
    process.exit(0);
  }

  console.log(`[import] ${novos.length} imagem(ns) nova(s) em public/book/:`);
  for (const f of novos) console.log(`   ${f}`);

  if (!LIST_ONLY) {
    novos.forEach((f, i) => {
      const size = imageSize(path.join(BOOK_DIR, f));
      const layout = autoLayout(size);
      const base = path
        .basename(f, path.extname(f))
        .replace(/[^a-z0-9]+/gi, "-")
        .toLowerCase();
      const title = base.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

      db.run(
        `INSERT INTO pages (book_id, ord, slug, kind, title, type, description, image_path,
                            image_width, image_height, fit, frame, backdrop, mount_tone, zoom,
                            offset_x, offset_y, rotation, radius, plate_pad, shadow, layout_auto, updated_at)
         VALUES (@bookId, @ord, @slug, @kind, @title, @type, @description, @image, @iw, @ih,
                 @fit, @frame, @backdrop, @mountTone, @zoom, 0, 0, 0, @radius, @platePad, 1, 1, @now)`,
        {
          bookId: book.id,
          ord: maxOrd + 1 + i,
          slug: `${base}-${Date.now().toString(36).slice(-4)}`,
          kind: "art",
          title,
          type: "Ilustração",
          description: "",
          image: `/book/${f}`,
          iw: size?.width ?? null,
          ih: size?.height ?? null,
          fit: layout.fit,
          frame: layout.frame,
          backdrop: layout.backdrop,
          mountTone: layout.mountTone,
          zoom: layout.zoom,
          radius: layout.radius,
          platePad: layout.platePad,
          now: Date.now(),
        },
      );
    });
    console.log("[import] pronto — ajuste títulos/textos e o enquadramento no /estudio");
  }
} finally {
  db.close();
}
