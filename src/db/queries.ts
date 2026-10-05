import { asc, eq } from "drizzle-orm";
import { db, sqlite } from "./index";
import { artworks, books, commissions, faqs, pages, siteMeta } from "./schema";
import { autoLayout, clampLayout } from "@/lib/layout";
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

/* --------------------------- conteúdo do site --------------------- */

export function getSite(): SiteContent {
  const rows = sqlite.prepare(`SELECT key, value FROM site_meta`).all() as Array<{
    key: string;
    value: string;
  }>;
  const meta: Record<string, string> = {};
  for (const r of rows) meta[r.key] = r.value;

  const stats = (() => {
    try {
      const parsed = JSON.parse(meta.stats ?? "[]");
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  })();

  // fallback no conteúdo de src/content/seed.ts para chaves ausentes
  for (const [k, v] of Object.entries(SITE)) {
    if (typeof v === "string" && !meta[k]) meta[k] = v;
  }
  delete meta.stats;

  return { ...meta, stats: stats.length ? stats : [...SITE.stats] } as SiteContent;
}

/* ------------------------------- galeria -------------------------- */

export async function getArtworks(): Promise<Artwork[]> {
  const rows = await db.select().from(artworks).orderBy(asc(artworks.ord));
  return rows.map((r) => ({
    slug: r.slug,
    order: r.ord,
    title: r.title,
    medium: r.medium,
    year: r.year,
    image: r.imagePath,
    imageWidth: r.imageWidth,
    imageHeight: r.imageHeight,
    span: r.span,
    shift: r.shift,
    aspect: r.aspect,
    description: r.description,
    tags: r.tags ?? [],
    featured: r.featured,
  }));
}

/* --------------------------------- FAQ ---------------------------- */

export async function getFaqs(): Promise<Faq[]> {
  const rows = await db.select().from(faqs).orderBy(asc(faqs.ord));
  return rows.map((r) => ({
    question: r.question,
    answer: r.answer,
    list: r.items ?? [],
    footnote: r.footnote ?? null,
  }));
}

export async function getCommissions(): Promise<CommissionType[]> {
  const rows = await db.select().from(commissions).orderBy(asc(commissions.ord));
  return rows.map((r) => ({ slug: r.slug, name: r.name, price: r.price }));
}

/* -------------------------------- livro --------------------------- */

const asPoem = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

function rowToPage(r: typeof pages.$inferSelect): BookPage {
  return {
    id: r.id,
    order: r.ord,
    slug: r.slug,
    kind: (r.kind as PageKind) ?? "art",
    title: r.title,
    type: r.type,
    description: r.description,
    poem: asPoem(r.poem),
    image: r.imagePath,
    imageWidth: r.imageWidth,
    imageHeight: r.imageHeight,
    folio: r.folio,
    layoutAuto: r.layoutAuto,
    layout: clampLayout({
      fit: r.fit as never,
      frame: r.frame as never,
      backdrop: r.backdrop as never,
      mountTone: r.mountTone as never,
      zoom: r.zoom,
      offsetX: r.offsetX,
      offsetY: r.offsetY,
      rotation: r.rotation,
      radius: r.radius,
      platePad: r.platePad,
      shadow: r.shadow,
    }),
  };
}

export async function getBook(): Promise<{ book: BookMeta; pages: BookPage[] }> {
  const [bookRow] = await db.select().from(books).limit(1);
  if (!bookRow) throw new Error("Banco sem livro — rode `npm run db:build`");

  const pageRows = await db
    .select()
    .from(pages)
    .where(eq(pages.bookId, bookRow.id))
    .orderBy(asc(pages.ord));

  const book: BookMeta = {
    slug: bookRow.slug,
    title: bookRow.title,
    subtitle: bookRow.subtitle,
    author: bookRow.author,
    publisher: bookRow.publisher,
    edition: bookRow.edition,
    description: bookRow.description,
    dedication: bookRow.dedication,
    spineLabel: bookRow.spineLabel,
    coverImage: bookRow.coverImage,
    coverArtTitle: bookRow.coverArtTitle,
    coverLayout: clampLayout(bookRow.coverLayout as never),
  };

  return { book, pages: pageRows.map(rowToPage) };
}

export async function getPageBySlug(slug: string): Promise<BookPage | null> {
  const [row] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
  return row ? rowToPage(row) : null;
}

/**
 * Grava o enquadramento ajustado à mão (o /estudio usa esta função).
 * Depois disso a página deixa de ser recalculada automaticamente.
 */
export async function savePageLayout(
  slug: string,
  patch: Partial<BookPage["layout"]>,
): Promise<BookPage | null> {
  const current = await getPageBySlug(slug);
  if (!current) return null;

  const layout = clampLayout({ ...current.layout, ...patch });
  await db
    .update(pages)
    .set({
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
      shadow: layout.shadow,
      layoutAuto: false,
      updatedAt: new Date(),
    })
    .where(eq(pages.slug, slug));

  return getPageBySlug(slug);
}

/** Volta ao enquadramento calculado (retrato / paisagem / panorâmica). */
export async function resetPageLayout(slug: string): Promise<BookPage | null> {
  const current = await getPageBySlug(slug);
  if (!current) return null;

  const size =
    current.imageWidth && current.imageHeight
      ? { width: current.imageWidth, height: current.imageHeight }
      : null;
  const layout = autoLayout(size);

  await db
    .update(pages)
    .set({
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
      shadow: layout.shadow,
      layoutAuto: true,
      updatedAt: new Date(),
    })
    .where(eq(pages.slug, slug));

  return getPageBySlug(slug);
}
