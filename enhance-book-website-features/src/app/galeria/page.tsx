import Link from "next/link";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { getBookWithArts } from "@/db/seed";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import type { ArtData } from "@/lib/book-data";

export const dynamic = "force-dynamic";

export default async function GaleriaPage() {
  const { book, arts } = await getBookWithArts();

  const artData: ArtData[] = arts.map((a) => ({
    order: a.order,
    slug: a.slug,
    title: a.title,
    type: a.type,
    description: a.description,
    image: a.imagePath,
    folio: a.folio,
    poem: a.poem ?? undefined,
    isCover: a.isCover,
    finale: a.finale,
  }));

  return (
    <main className="min-h-screen bg-[#f3ead3] pb-20">
      <div className="mx-auto max-w-6xl px-5 pt-8 sm:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[#8a744a] transition hover:text-[#5c4c33]"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Voltar ao livro
        </Link>

        <div className="mb-10 flex flex-col gap-3">
          <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.32em] text-[#8a744a]">
            <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.8} />
            Pasta de artes do livro
          </p>
          <h1 className="font-serif text-4xl font-semibold leading-tight text-[#3a3126] sm:text-5xl">
            {book.title}
          </h1>
          <p className="font-serif text-lg italic text-[#6d5b3d]">{book.subtitle}</p>
          <p className="max-w-2xl text-sm leading-relaxed text-[#6d5b3d]/90">{book.description}</p>
          <p className="text-xs uppercase tracking-wide text-[#8a744a]">
            por {book.author} · {arts.length} ilustrações catalogadas
          </p>
        </div>

        <GalleryGrid arts={artData} />
      </div>
    </main>
  );
}
