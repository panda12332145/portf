import { db } from "@/db";
import { books, arts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BOOK, ARTS } from "@/lib/book-data";

/**
 * Garante que o livro e suas artes estejam gravados no PostgreSQL.
 * Idempotente: pode ser chamado em toda requisição sem duplicar dados.
 */
export async function ensureSeeded() {
  const existing = await db.select().from(books).where(eq(books.slug, BOOK.slug)).limit(1);

  let bookId: number;

  if (existing.length === 0) {
    const [inserted] = await db
      .insert(books)
      .values({
        slug: BOOK.slug,
        title: BOOK.title,
        subtitle: BOOK.subtitle,
        author: BOOK.author,
        description: BOOK.description,
      })
      .returning({ id: books.id });
    bookId = inserted.id;
  } else {
    bookId = existing[0].id;
    await db
      .update(books)
      .set({
        title: BOOK.title,
        subtitle: BOOK.subtitle,
        author: BOOK.author,
        description: BOOK.description,
      })
      .where(eq(books.id, bookId));
  }

  const existingArts = await db.select().from(arts).where(eq(arts.bookId, bookId));
  const existingBySlug = new Map(existingArts.map((a) => [a.slug, a]));

  for (const art of ARTS) {
    const row = {
      bookId,
      order: art.order,
      slug: art.slug,
      title: art.title,
      type: art.type,
      description: art.description,
      imagePath: art.image,
      folio: art.folio,
      isCover: !!art.isCover,
      finale: !!art.finale,
      poem: art.poem ?? null,
    };
    const found = existingBySlug.get(art.slug);
    if (found) {
      await db.update(arts).set(row).where(eq(arts.id, found.id));
    } else {
      await db.insert(arts).values(row);
    }
  }

  return bookId;
}

export async function getBookWithArts() {
  const bookId = await ensureSeeded();
  const [book] = await db.select().from(books).where(eq(books.id, bookId)).limit(1);
  const artRows = await db.select().from(arts).where(eq(arts.bookId, bookId));
  artRows.sort((a, b) => a.order - b.order);
  return { book, arts: artRows };
}
