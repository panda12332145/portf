import { getBook } from "@/db/queries";
import LayoutStudio from "@/components/studio/LayoutStudio";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Estúdio de enquadramento — O Jardim das Horas",
};

/**
 * Editor visual do enquadramento das páginas do livro.
 * Lê e grava direto no SQLite (data/atelier.sqlite).
 */
export default async function EstudioPage() {
  const { book, pages } = await getBook();
  return <LayoutStudio book={book} pages={pages} />;
}
