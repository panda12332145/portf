import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { imageSize } from "../lib/image-size";
import { autoLayout, clampLayout, type PageLayout } from "../lib/layout";
import { ARTWORKS, BOOK, COMMISSIONS, FAQS, PAGES, SITE } from "../content/seed";

/* ================================================================== */
/*  Banco único do projeto (SQLite)                                    */
/*  - data/atelier.sqlite  (versionado, para o site funcionar no clone) */
/*  - override: ATELIER_DB_PATH                                        */
/* ================================================================== */

export function dbPath() {
  return process.env.ATELIER_DB_PATH ?? path.join(process.cwd(), "data", "atelier.sqlite");
}

const PUBLIC_DIR = () => path.join(process.cwd(), "public");

const DDL = `
CREATE TABLE IF NOT EXISTS site_meta (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS books (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  subtitle         TEXT NOT NULL,
  author           TEXT NOT NULL,
  publisher        TEXT NOT NULL DEFAULT '',
  edition          TEXT NOT NULL DEFAULT '',
  description      TEXT NOT NULL,
  dedication       TEXT NOT NULL DEFAULT '',
  spine_label      TEXT NOT NULL DEFAULT '',
  cover_image      TEXT NOT NULL,
  cover_art_title  TEXT NOT NULL DEFAULT '',
  cover_layout     TEXT,
  created_at       INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at       INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS pages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id      INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  ord          INTEGER NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  kind         TEXT NOT NULL DEFAULT 'art',
  title        TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  poem         TEXT,
  image_path   TEXT,
  image_width  INTEGER,
  image_height INTEGER,
  folio        INTEGER,
  fit          TEXT NOT NULL DEFAULT 'contain',
  frame        TEXT NOT NULL DEFAULT 'plate',
  backdrop     TEXT NOT NULL DEFAULT 'none',
  mount_tone   TEXT NOT NULL DEFAULT 'paper',
  zoom         REAL NOT NULL DEFAULT 1,
  offset_x     REAL NOT NULL DEFAULT 0,
  offset_y     REAL NOT NULL DEFAULT 0,
  rotation     REAL NOT NULL DEFAULT 0,
  radius       REAL NOT NULL DEFAULT 8,
  plate_pad    REAL NOT NULL DEFAULT 26,
  shadow       INTEGER NOT NULL DEFAULT 1,
  layout_auto  INTEGER NOT NULL DEFAULT 1,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS artworks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT NOT NULL UNIQUE,
  ord          INTEGER NOT NULL DEFAULT 0,
  title        TEXT NOT NULL,
  medium       TEXT NOT NULL,
  year         TEXT NOT NULL,
  image_path   TEXT NOT NULL,
  image_width  INTEGER,
  image_height INTEGER,
  span         INTEGER NOT NULL DEFAULT 6,
  shift        INTEGER NOT NULL DEFAULT 0,
  aspect       TEXT NOT NULL DEFAULT '4/5',
  description  TEXT NOT NULL DEFAULT '',
  tags         TEXT,
  featured     INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS faqs (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  ord      INTEGER NOT NULL DEFAULT 0,
  question TEXT NOT NULL UNIQUE,
  answer   TEXT NOT NULL,
  items    TEXT,
  footnote TEXT
);

CREATE TABLE IF NOT EXISTS commissions (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  slug  TEXT NOT NULL UNIQUE,
  ord   INTEGER NOT NULL DEFAULT 0,
  name  TEXT NOT NULL,
  price REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pages_book ON pages(book_id, ord);
CREATE INDEX IF NOT EXISTS idx_artworks_ord ON artworks(ord);
`;

const TABLES = ["site_meta", "books", "pages", "artworks", "faqs", "commissions"];

/** Dimensões reais de um arquivo em public/ (lido do cabeçalho da imagem). */
function sizeOf(publicPath: string | null | undefined) {
  if (!publicPath) return null;
  return imageSize(path.join(PUBLIC_DIR(), publicPath.replace(/^\//, "")));
}

export interface BuildReport {
  path: string;
  seeded: boolean;
  pages: number;
  artworks: number;
  faqs: number;
  commissions: number;
  missingImages: string[];
}

/**
 * Cria o arquivo, o schema e semeia o conteúdo.
 * Idempotente: pode rodar em todo `npm run dev` / `next build`.
 *
 *  • `force = true` (npm run db:seed) → recria tudo do zero;
 *  • páginas com layout_auto = 0 mantêm os ajustes feitos no /estudio.
 */
export function buildDatabase({ force = false, quiet = false }: { force?: boolean; quiet?: boolean } = {}): BuildReport {
  const file = dbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  try {
    if (force) {
      for (const t of TABLES) sqlite.exec(`DROP TABLE IF EXISTS ${t}`);
    }
    sqlite.exec(DDL);

    const missingImages: string[] = [];
    const now = Date.now();

    /* ----------------------------- site_meta ---------------------- */
    const metaStmt = sqlite.prepare(
      `INSERT INTO site_meta (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    );
    const tx = sqlite.transaction(() => {
      for (const [key, value] of Object.entries(SITE)) {
        metaStmt.run(key, Array.isArray(value) ? JSON.stringify(value) : String(value), now);
      }

      /* ------------------------------ livro ------------------------ */
      const coverSize = sizeOf(BOOK.coverImage);
      if (!coverSize) missingImages.push(BOOK.coverImage);
      const l = clampLayout(autoLayout(coverSize));

      sqlite
        .prepare(
          `INSERT INTO books (slug, title, subtitle, author, publisher, edition, description,
                              dedication, spine_label, cover_image, cover_art_title, cover_layout, updated_at)
           VALUES (@slug, @title, @subtitle, @author, @publisher, @edition, @description,
                   @dedication, @spine, @cover, @coverTitle, @coverLayout, @now)
           ON CONFLICT(slug) DO UPDATE SET
             title = excluded.title, subtitle = excluded.subtitle, author = excluded.author,
             publisher = excluded.publisher, edition = excluded.edition,
             description = excluded.description, dedication = excluded.dedication,
             spine_label = excluded.spine_label, cover_image = excluded.cover_image,
             cover_art_title = excluded.cover_art_title, updated_at = excluded.updated_at`,
        )
        .run({
          slug: BOOK.slug,
          title: BOOK.title,
          subtitle: BOOK.subtitle,
          author: BOOK.author,
          publisher: BOOK.publisher,
          edition: BOOK.edition,
          description: BOOK.description,
          dedication: BOOK.dedication,
          spine: BOOK.spineLabel,
          cover: BOOK.coverImage,
          coverTitle: BOOK.coverArtTitle,
          coverLayout: JSON.stringify({
            fit: "cover",
            frame: "none",
            backdrop: "none",
            mountTone: coverSize && coverSize.width / coverSize.height > 1.4 ? "ink" : "paper",
            zoom: 1,
            offsetX: 0,
            offsetY: 0,
            rotation: 0,
            radius: l.radius,
            platePad: 0,
            shadow: true,
          }),
          now,
        });

      const bookId = (
        sqlite.prepare(`SELECT id FROM books WHERE slug = ?`).get(BOOK.slug) as { id: number }
      ).id;

      /* ----------------------------- páginas ----------------------- */
      const getPage = sqlite.prepare(`SELECT id, layout_auto FROM pages WHERE slug = ?`);
      const insertPage = sqlite.prepare(
        `INSERT INTO pages (book_id, ord, slug, kind, title, type, description, poem, image_path,
                            image_width, image_height, folio, fit, frame, backdrop, mount_tone,
                            zoom, offset_x, offset_y, rotation, radius, plate_pad, shadow,
                            layout_auto, updated_at)
         VALUES (@bookId, @ord, @slug, @kind, @title, @type, @description, @poem, @image,
                 @iw, @ih, @folio, @fit, @frame, @backdrop, @mountTone,
                 @zoom, @offsetX, @offsetY, @rotation, @radius, @platePad, @shadow, @auto, @now)`,
      );
      const updateEditorial = sqlite.prepare(
        `UPDATE pages SET book_id=@bookId, ord=@ord, kind=@kind, title=@title, type=@type,
                          description=@description, poem=@poem, image_path=@image,
                          image_width=@iw, image_height=@ih, folio=@folio, updated_at=@now
         WHERE slug=@slug`,
      );
      const updateLayout = sqlite.prepare(
        `UPDATE pages SET fit=@fit, frame=@frame, backdrop=@backdrop, mount_tone=@mountTone,
                          zoom=@zoom, offset_x=@offsetX, offset_y=@offsetY, rotation=@rotation,
                          radius=@radius, plate_pad=@platePad, shadow=@shadow, layout_auto=@auto,
                          updated_at=@now
         WHERE slug=@slug`,
      );

      for (const p of PAGES) {
        const size = sizeOf(p.image);
        if (p.image && !size) missingImages.push(p.image);
        const auto = p.image ? autoLayout(size) : autoLayout(null);
        const layout: PageLayout = clampLayout({ ...auto, ...(p.layout ?? {}) });
        const row = {
          bookId,
          ord: p.order,
          slug: p.slug,
          kind: p.kind,
          title: p.title,
          type: p.type,
          description: p.description,
          poem: p.poem ? JSON.stringify(p.poem) : null,
          image: p.image ?? null,
          iw: size?.width ?? null,
          ih: size?.height ?? null,
          folio: p.folio ?? null,
          fit: layout.fit,
          frame: layout.frame,
          backdrop: layout.backdrop,
          mountTone: layout.mountTone,
          zoom: layout.zoom,
          offsetX: layout.offsetX,
          offsetY: layout.offsetY,
          rotation: layout.rotation,
          radius: layout.radius,
          platePad: layout.platePad,
          shadow: layout.shadow ? 1 : 0,
          auto: 1,
          now,
        };

        const existing = getPage.get(p.slug) as { id: number; layout_auto: number } | undefined;
        if (!existing) {
          insertPage.run(row);
        } else {
          updateEditorial.run(row);
          // ajustes manuais do /estudio são preservados até "recalcular"
          if (existing.layout_auto === 1 || force) updateLayout.run(row);
        }
      }

      /* --------------------------- galeria do site ----------------- */
      const upsertArt = sqlite.prepare(
        `INSERT INTO artworks (slug, ord, title, medium, year, image_path, image_width, image_height,
                               span, shift, aspect, description, tags, featured, created_at)
         VALUES (@slug, @ord, @title, @medium, @year, @image, @iw, @ih, @span, @shift, @aspect,
                 @description, @tags, @featured, @now)
         ON CONFLICT(slug) DO UPDATE SET
           ord=excluded.ord, title=excluded.title, medium=excluded.medium, year=excluded.year,
           image_path=excluded.image_path, image_width=excluded.image_width,
           image_height=excluded.image_height, span=excluded.span, shift=excluded.shift,
           aspect=excluded.aspect, description=excluded.description, tags=excluded.tags`,
      );
      ARTWORKS.forEach((a, i) => {
        const size = sizeOf(a.image);
        if (!size) missingImages.push(a.image);
        upsertArt.run({
          slug: a.slug,
          ord: i + 1,
          title: a.title,
          medium: a.medium,
          year: a.year,
          image: a.image,
          iw: size?.width ?? null,
          ih: size?.height ?? null,
          span: a.span,
          shift: a.shift,
          aspect: a.aspect,
          description: a.description,
          tags: JSON.stringify(a.tags),
          featured: a.span >= 7 ? 1 : 0,
          now,
        });
      });

      /* ------------------------------- FAQ -------------------------- */
      sqlite.prepare(`DELETE FROM faqs`).run();
      const insFaq = sqlite.prepare(
        `INSERT INTO faqs (ord, question, answer, items, footnote) VALUES (?, ?, ?, ?, ?)`,
      );
      FAQS.forEach((f, i) =>
        insFaq.run(i + 1, f.question, f.answer, f.list ? JSON.stringify(f.list) : null, f.footnote ?? null),
      );

      /* --------------------------- comissões ------------------------ */
      const insCom = sqlite.prepare(
        `INSERT INTO commissions (slug, ord, name, price) VALUES (@slug, @ord, @name, @price)
         ON CONFLICT(slug) DO UPDATE SET ord=excluded.ord, name=excluded.name, price=excluded.price`,
      );
      COMMISSIONS.forEach((c, i) => insCom.run({ slug: c.slug, ord: i + 1, name: c.name, price: c.price }));
    });

    tx();

    const count = (t: string) => (sqlite.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n;
    const report: BuildReport = {
      path: file,
      seeded: true,
      pages: count("pages"),
      artworks: count("artworks"),
      faqs: count("faqs"),
      commissions: count("commissions"),
      missingImages,
    };
    if (!quiet) {
      console.log(
        `[db] ${file}\n     ${report.pages} páginas do livro · ${report.artworks} obras · ` +
          `${report.faqs} FAQs · ${report.commissions} estilos de comissão`,
      );
      if (missingImages.length) {
        console.warn(`[db] imagens não encontradas em public/: ${missingImages.join(", ")}`);
      }
    }
    return report;
  } finally {
    sqlite.close();
  }
}

let ensured = false;

/**
 * Chamada em toda requisição do servidor: garante que o banco existe e
 * está populado (útil em clone novo, CI ou deploy sem o arquivo .sqlite).
 */
export function ensureDatabase(): string {
  const file = dbPath();
  if (!ensured || !fs.existsSync(file)) {
    const empty =
      !fs.existsSync(file) ||
      (() => {
        try {
          const s = new Database(file, { readonly: true });
          const n = (s.prepare(`SELECT COUNT(*) AS n FROM pages`).get() as { n: number }).n;
          s.close();
          return n === 0;
        } catch {
          return true;
        }
      })();
    if (empty) buildDatabase({ quiet: true });
    ensured = true;
  }
  return file;
}
