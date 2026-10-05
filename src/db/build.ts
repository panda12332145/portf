import fs from "node:fs";
import path from "node:path";
import { DDL, TABLES } from "./schema";
import { openDatabase, type SqliteDatabase, type SqlValue } from "./sqlite";
import { imageSize } from "../lib/image-size";
import { autoLayout, clampLayout, type PageLayout } from "../lib/layout";
import { ARTWORKS, BOOK, COMMISSIONS, FAQS, PAGES, SITE } from "../content/seed";

/* ================================================================== */
/*  Banco único do projeto (SQLite, via node:sqlite)                   */
/*  - data/atelier.sqlite  (versionado, para o site funcionar no clone) */
/*  - override: ATELIER_DB_PATH                                        */
/* ================================================================== */

export function dbPath() {
  return process.env.ATELIER_DB_PATH ?? path.join(process.cwd(), "data", "atelier.sqlite");
}

const PUBLIC_DIR = () => path.join(process.cwd(), "public");

/** Dimensões reais de um arquivo em public/ (lido do cabeçalho da imagem). */
function sizeOf(publicPath: string | null | undefined) {
  if (!publicPath) return null;
  return imageSize(path.join(PUBLIC_DIR(), publicPath.replace(/^\//, "")));
}

const json = (v: unknown) => (v === undefined || v === null ? null : JSON.stringify(v));

export interface BuildReport {
  path: string;
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
export function buildDatabase(
  { force = false, quiet = false }: { force?: boolean; quiet?: boolean } = {},
): BuildReport {
  const file = dbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const db = openDatabase(file);
  const missingImages: string[] = [];
  const now = Date.now();

  try {
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    if (force) {
      db.pragma("foreign_keys = OFF");
      for (const t of TABLES) db.exec(`DROP TABLE IF EXISTS ${t}`);
      db.pragma("foreign_keys = ON");
    }
    db.exec(DDL);

    db.tx(() => {
      /* ----------------------------- site_meta ---------------------- */
      const upsertMeta = `
        INSERT INTO site_meta (key, value, updated_at) VALUES (@key, @value, @now)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`;
      for (const [key, value] of Object.entries(SITE)) {
        db.run(upsertMeta, {
          key,
          value: Array.isArray(value) ? JSON.stringify(value) : String(value),
          now,
        });
      }

      /* ------------------------------ livro ------------------------ */
      const coverSize = sizeOf(BOOK.coverImage);
      if (!coverSize) missingImages.push(BOOK.coverImage);
      const auto = clampLayout(autoLayout(coverSize));
      const coverLayout: PageLayout = {
        ...auto,
        fit: "cover",
        frame: "none",
        backdrop: "none",
        mountTone: coverSize && coverSize.width / coverSize.height > 1.4 ? "ink" : "paper",
        platePad: 0,
      };

      db.run(
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
        {
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
          coverLayout: JSON.stringify(coverLayout),
          now,
        },
      );

      const bookId = (db.get<{ id: number }>(`SELECT id FROM books WHERE slug = ?`, [BOOK.slug])!).id;

      /* ----------------------------- páginas ----------------------- */
      for (const p of PAGES) {
        const size = sizeOf(p.image);
        if (p.image && !size) missingImages.push(p.image);
        const layout = clampLayout({ ...autoLayout(size), ...(p.layout ?? {}) });

        const editorial = {
          bookId,
          ord: p.order,
          slug: p.slug,
          kind: p.kind,
          title: p.title,
          type: p.type,
          description: p.description,
          poem: json(p.poem),
          image: p.image ?? null,
          iw: size?.width ?? null,
          ih: size?.height ?? null,
          folio: p.folio ?? null,
          now,
        };
        const layoutCols = {
          ...editorial,
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
        };

        const existing = db.get<{ id: number; layout_auto: number }>(
          `SELECT id, layout_auto FROM pages WHERE slug = ?`,
          [p.slug],
        );

        if (!existing) {
          db.run(
            `INSERT INTO pages (book_id, ord, slug, kind, title, type, description, poem, image_path,
                                image_width, image_height, folio, fit, frame, backdrop, mount_tone,
                                zoom, offset_x, offset_y, rotation, radius, plate_pad, shadow,
                                layout_auto, updated_at)
             VALUES (@bookId, @ord, @slug, @kind, @title, @type, @description, @poem, @image,
                     @iw, @ih, @folio, @fit, @frame, @backdrop, @mountTone,
                     @zoom, @offsetX, @offsetY, @rotation, @radius, @platePad, @shadow, @auto, @now)`,
            layoutCols,
          );
        } else {
          db.run(
            `UPDATE pages SET book_id=@bookId, ord=@ord, kind=@kind, title=@title, type=@type,
                              description=@description, poem=@poem, image_path=@image,
                              image_width=@iw, image_height=@ih, folio=@folio, updated_at=@now
             WHERE slug=@slug`,
            editorial,
          );
          // ajustes manuais do /estudio são preservados até "recalcular"
          if (existing.layout_auto === 1 || force) {
            db.run(
              `UPDATE pages SET fit=@fit, frame=@frame, backdrop=@backdrop, mount_tone=@mountTone,
                                zoom=@zoom, offset_x=@offsetX, offset_y=@offsetY, rotation=@rotation,
                                radius=@radius, plate_pad=@platePad, shadow=@shadow, layout_auto=@auto,
                                updated_at=@now
               WHERE slug=@slug`,
              layoutCols,
            );
          }
        }
      }

      /* --------------------------- galeria do site ----------------- */
      ARTWORKS.forEach((a, i) => {
        const size = sizeOf(a.image);
        if (!size) missingImages.push(a.image);
        db.run(
          `INSERT INTO artworks (slug, ord, title, medium, year, image_path, image_width, image_height,
                                 span, shift, aspect, description, tags, featured, created_at)
           VALUES (@slug, @ord, @title, @medium, @year, @image, @iw, @ih, @span, @shift, @aspect,
                   @description, @tags, @featured, @now)
           ON CONFLICT(slug) DO UPDATE SET
             ord=excluded.ord, title=excluded.title, medium=excluded.medium, year=excluded.year,
             image_path=excluded.image_path, image_width=excluded.image_width,
             image_height=excluded.image_height, span=excluded.span, shift=excluded.shift,
             aspect=excluded.aspect, description=excluded.description, tags=excluded.tags`,
          {
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
            tags: json(a.tags),
            featured: a.span >= 7 ? 1 : 0,
            now,
          },
        );
      });

      /* ------------------------------- FAQ -------------------------- */
      db.run(`DELETE FROM faqs`);
      FAQS.forEach((f, i) => {
        db.run(`INSERT INTO faqs (ord, question, answer, items, footnote) VALUES (?, ?, ?, ?, ?)`, [
          i + 1,
          f.question,
          f.answer,
          json(f.list),
          f.footnote ?? null,
        ]);
      });

      /* --------------------------- comissões ------------------------ */
      COMMISSIONS.forEach((c, i) => {
        db.run(
          `INSERT INTO commissions (slug, ord, name, price) VALUES (@slug, @ord, @name, @price)
           ON CONFLICT(slug) DO UPDATE SET ord=excluded.ord, name=excluded.name, price=excluded.price`,
          { slug: c.slug, ord: i + 1, name: c.name, price: c.price },
        );
      });
    });

    const count = (t: string) => db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${t}`)!.n;
    const report: BuildReport = {
      path: file,
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
    db.close();
  }
}

let assured = false;

/**
 * Chamada em toda requisição do servidor: garante que o banco existe e
 * está populado (útil em clone novo, CI ou deploy sem o arquivo .sqlite).
 */
export function ensureDatabase(): string {
  const file = dbPath();
  if (!assured || !fs.existsSync(file)) {
    const precisaPopular = (() => {
      if (!fs.existsSync(file)) return true;
      try {
        const probe = openDatabase(file, { readOnly: true });
        const n = probe.get<{ n: number }>(`SELECT COUNT(*) AS n FROM pages`)?.n ?? 0;
        probe.close();
        return n === 0;
      } catch {
        return true;
      }
    })();
    if (precisaPopular) buildDatabase({ quiet: true });
    assured = true;
  }
  return file;
}

export type { SqliteDatabase, SqlValue };
