import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

const now = () => new Date();

/** Textos gerais do site (chave → valor), editáveis sem tocar em código. */
export const siteMeta = sqliteTable("site_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(now),
});

/** O livro ilustrado — metadados da obra. */
export const books = sqliteTable("books", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  author: text("author").notNull(),
  publisher: text("publisher").notNull().default(""),
  edition: text("edition").notNull().default(""),
  description: text("description").notNull(),
  dedication: text("dedication").notNull().default(""),
  spineLabel: text("spine_label").notNull().default(""),
  coverImage: text("cover_image").notNull(),
  coverArtTitle: text("cover_art_title").notNull().default(""),
  coverLayout: text("cover_layout", { mode: "json" }).$type<Record<string, number | string>>(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

/**
 * Páginas do miolo, na ordem de leitura (frente e verso de cada folha).
 * `layout*` guarda os ajustes de enquadramento da imagem na página —
 * calculados automaticamente no build e ajustáveis pelo /estudio.
 */
export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bookId: integer("book_id").notNull(),
  ord: integer("ord").notNull(),
  slug: text("slug").notNull().unique(),

  kind: text("kind").notNull().default("art"), // title | art | interlude | finale
  title: text("title").notNull(),
  type: text("type").notNull().default(""),
  description: text("description").notNull().default(""),
  poem: text("poem", { mode: "json" }).$type<string[]>(),

  imagePath: text("image_path"),
  imageWidth: integer("image_width"),
  imageHeight: integer("image_height"),
  folio: integer("folio"),

  /* ---- enquadramento da imagem (ajustável no /estudio ou via SQL) ---- */
  fit: text("fit").notNull().default("contain"), // contain | cover
  frame: text("frame").notNull().default("plate"), // plate | bleed | none
  backdrop: text("backdrop").notNull().default("none"), // blur | tint | paper | none
  mountTone: text("mount_tone").notNull().default("paper"), // paper | ink
  zoom: real("zoom").notNull().default(1),
  offsetX: real("offset_x").notNull().default(0), // % da área, -50..50
  offsetY: real("offset_y").notNull().default(0),
  rotation: real("rotation").notNull().default(0), // graus, -18..18
  radius: real("radius").notNull().default(8), // px no canvas da página
  platePad: real("plate_pad").notNull().default(26),
  shadow: integer("shadow", { mode: "boolean" }).notNull().default(true),
  layoutAuto: integer("layout_auto", { mode: "boolean" }).notNull().default(true),

  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

/** Obras do site (grid da home + /galeria) — imagens em public/images/. */
export const artworks = sqliteTable("artworks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  ord: integer("ord").notNull().default(0),
  title: text("title").notNull(),
  medium: text("medium").notNull(),
  year: text("year").notNull(),
  imagePath: text("image_path").notNull(),
  imageWidth: integer("image_width"),
  imageHeight: integer("image_height"),
  span: integer("span").notNull().default(6),
  shift: integer("shift").notNull().default(0),
  aspect: text("aspect").notNull().default("4/5"),
  description: text("description").notNull().default(""),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

/** Perguntas frequentes (a lista "o que não fazemos" vai em `items`). */
export const faqs = sqliteTable("faqs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ord: integer("ord").notNull().default(0),
  question: text("question").notNull().unique(),
  answer: text("answer").notNull(),
  items: text("items", { mode: "json" }).$type<string[]>(),
  footnote: text("footnote"),
});

/** Tabela de preços das comissões. */
export const commissions = sqliteTable("commissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  ord: integer("ord").notNull().default(0),
  name: text("name").notNull(),
  price: real("price").notNull(),
});

export type BookRow = typeof books.$inferSelect;
export type PageRow = typeof pages.$inferSelect;
export type ArtworkRow = typeof artworks.$inferSelect;
export type FaqRow = typeof faqs.$inferSelect;
export type CommissionRow = typeof commissions.$inferSelect;
