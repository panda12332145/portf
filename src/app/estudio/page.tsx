import { redirect } from "next/navigation";
import { getBook } from "@/db/queries";
import LayoutStudio from "@/components/studio/LayoutStudio";
import { currentUser } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Estúdio de enquadramento — O Jardim das Horas",
};

/**
 * Editor visual do enquadramento das páginas do livro.
 * Lê e grava direto no SQLite (data/atelier.sqlite).
 */
export default async function EstudioPage() {
  // o estúdio grava no banco: pede login como o painel administrativo
  const user = await currentUser();
  if (!user) redirect("/admin?next=%2Festudio");

  const { book, pages } = getBook();
  return <LayoutStudio book={book} pages={pages} />;
}
