import { openDatabase, type SqliteDatabase } from "./sqlite";
import { ensureDatabase } from "./build";
import { autoLayout, clampLayout, type PageLayout } from "@/lib/layout";
import type {
  ArtworkRow,
  BookRow,
  CommissionRow,
  FaqRow,
  PageRow,
} from "./schema";
import type {
  Artwork,
  BookMeta,
  BookPage,
  CommissionType,
  Faq,
  PageKind,
  SiteContent,
} from "@/lib/types";
import { SITE } from "@/content/seed";

/* ------------------------------ conexão --------------------------- */

const globalForDb = globalThis as typeof globalThis & { __atelierDb?: SqliteDatabase };

function connect(): SqliteDatabase {
  const db = openDatabase(ensureDatabase());
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export const sqlite: SqliteDatabase = globalForDb.__atelierDb ?? connect();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__atelierDb = sqlite;
}

/* ------------------------------ helpers --------------------------- */

const parseArray = (raw: string | null | undefined): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
};

/* --------------------------- conteúdo do site --------------------- */

export function getSite(): SiteContent {
  const rows = sqlite.all<{ key: string; value: string }>(`SELECT key, value FROM site_meta`);
  const meta: Record<string, string> = {};
  for (const r of rows) meta[r.key] = r.value;

  const stats = parseArray(meta.stats);

  // fallback no conteúdo de src/content/seed.ts para chaves ausentes
  for (const [k, v] of Object.entries(SITE)) {
    if (typeof v === "string" && !meta[k]) meta[k] = v;
  }
  delete meta.stats;

  return { ...meta, stats: stats.length ? stats : [...SITE.stats] } as SiteContent;
}

/* ------------------------------- galeria -------------------------- */

export function getArtworks(): Artwork[] {
  const rows = sqlite.all<ArtworkRow>(`SELECT * FROM artworks ORDER BY ord`);
  return rows.map((r) => ({
    slug: r.slug,
    order: r.ord,
    title: r.title,
    medium: r.medium,
    year: r.year,
    image: r.image_path,
    imageWidth: r.image_width,
    imageHeight: r.image_height,
    span: r.span,
    shift: r.shift,
    aspect: r.aspect,
    description: r.description,
    tags: parseArray(r.tags),
    featured: r.featured === 1,
  }));
}

/* --------------------------------- FAQ ---------------------------- */

export function getFaqs(): Faq[] {
  const rows = sqlite.all<FaqRow>(`SELECT * FROM faqs ORDER BY ord`);
  return rows.map((r) => ({
    question: r.question,
    answer: r.answer,
    list: parseArray(r.items),
    footnote: r.footnote,
  }));
}

export function getCommissions(): CommissionType[] {
  const rows = sqlite.all<CommissionRow>(`SELECT * FROM commissions ORDER BY ord`);
  return rows.map((r) => ({ slug: r.slug, name: r.name, price: r.price }));
}

/* -------------------------------- livro --------------------------- */

function rowToPage(r: PageRow): BookPage {
  return {
    id: r.id,
    order: r.ord,
    slug: r.slug,
    kind: (r.kind as PageKind) ?? "art",
    title: r.title,
    type: r.type,
    description: r.description,
    poem: parseArray(r.poem),
    image: r.image_path,
    imageWidth: r.image_width,
    imageHeight: r.image_height,
    folio: r.folio,
    layoutAuto: r.layout_auto === 1,
    layout: clampLayout({
      fit: r.fit as PageLayout["fit"],
      frame: r.frame as PageLayout["frame"],
      backdrop: r.backdrop as PageLayout["backdrop"],
      mountTone: r.mount_tone as PageLayout["mountTone"],
      zoom: r.zoom,
      offsetX: r.offset_x,
      offsetY: r.offset_y,
      rotation: r.rotation,
      radius: r.radius,
      platePad: r.plate_pad,
      shadow: r.shadow === 1,
    }),
  };
}

function rowToBook(r: BookRow): BookMeta {
  return {
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle,
    author: r.author,
    publisher: r.publisher,
    edition: r.edition,
    description: r.description,
    dedication: r.dedication,
    spineLabel: r.spine_label,
    coverImage: r.cover_image,
    coverArtTitle: r.cover_art_title,
    coverLayout: clampLayout(
      (r.cover_layout ? JSON.parse(r.cover_layout) : {}) as Partial<PageLayout>,
    ),
  };
}

export function getBook(): { book: BookMeta; pages: BookPage[] } {
  const bookRow = sqlite.get<BookRow>(`SELECT * FROM books ORDER BY id LIMIT 1`);
  if (!bookRow) throw new Error("Banco sem livro — rode `npm run db:build`");

  const pageRows = sqlite.all<PageRow>(
    `SELECT * FROM pages WHERE book_id = ? ORDER BY ord`,
    [bookRow.id],
  );

  return { book: rowToBook(bookRow), pages: pageRows.map(rowToPage) };
}

export function getPageBySlug(slug: string): BookPage | null {
  const row = sqlite.get<PageRow>(`SELECT * FROM pages WHERE slug = ?`, [slug]);
  return row ? rowToPage(row) : null;
}

/* ------------------------- gravar enquadramento -------------------- */

/** Colunas de enquadramento que o /estudio e a API podem alterar. */
const LAYOUT_COLUMNS = {
  fit: "fit",
  frame: "frame",
  backdrop: "backdrop",
  mountTone: "mount_tone",
  zoom: "zoom",
  offsetX: "offset_x",
  offsetY: "offset_y",
  rotation: "rotation",
  radius: "radius",
  platePad: "plate_pad",
  shadow: "shadow",
} as const;

function writeLayout(slug: string, layout: PageLayout, auto: boolean): BookPage | null {
  const sets: string[] = [];
  const params: Record<string, string | number | null> = { slug, now: Date.now() };

  for (const [key, column] of Object.entries(LAYOUT_COLUMNS)) {
    const value = layout[key as keyof PageLayout];
    sets.push(`${column} = @${key}`);
    params[key] = typeof value === "boolean" ? (value ? 1 : 0) : (value as string | number);
  }
  sets.push(`layout_auto = @auto`);
  sets.push(`updated_at = @now`);
  params.auto = auto ? 1 : 0;

  const { changes } = sqlite.run(`UPDATE pages SET ${sets.join(", ")} WHERE slug = @slug`, params);
  return changes > 0 ? getPageBySlug(slug) : null;
}

/** Ajuste manual: marca a página como `layout_auto = 0`. */
export function savePageLayout(slug: string, patch: Partial<PageLayout>): BookPage | null {
  const current = getPageBySlug(slug);
  if (!current) return null;
  return writeLayout(slug, clampLayout({ ...current.layout, ...patch }), false);
}

/** Volta ao enquadramento calculado a partir das dimensões da imagem. */
export function resetPageLayout(slug: string): BookPage | null {
  const current = getPageBySlug(slug);
  if (!current) return null;
  const size =
    current.imageWidth && current.imageHeight
      ? { width: current.imageWidth, height: current.imageHeight }
      : null;
  return writeLayout(slug, autoLayout(size), true);
}
