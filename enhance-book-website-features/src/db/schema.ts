import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  json,
} from "drizzle-orm/pg-core";

/**
 * Livro — metadados gerais exibidos na capa e nas telas de apresentação.
 */
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  author: text("author").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Artes — cada ilustração do livro, na ordem em que aparece (campo `order`:
 * 0 = capa, 1..9 = páginas ilustradas, 10 = página final).
 */
export const arts = pgTable("arts", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  imagePath: text("image_path"),
  folio: integer("folio"),
  isCover: boolean("is_cover").notNull().default(false),
  finale: boolean("finale").notNull().default(false),
  poem: json("poem").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
