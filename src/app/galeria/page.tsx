import Link from "next/link";
import { ArrowLeft, FolderOpen, LibraryBig } from "lucide-react";
import { getArtworks, getBook, getSite } from "@/db/queries";
import GalleryGrid from "@/components/site/GalleryGrid";
import { fillTemplate, splitEmphasis } from "@/lib/cn";
import BookPlates from "@/components/site/BookPlates";

export const dynamic = "force-dynamic";

export default function GaleriaPage() {
  const site = getSite();
  const artworks = getArtworks();
  const { book, pages } = getBook();

  const illustrated = pages.filter((p) => p.image);

  return (
    <main className="relative min-h-screen bg-soil-900 pb-24">
      <div className="mx-auto max-w-6xl px-5 pt-10 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-sun-300/80 transition hover:text-sun-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Voltar ao site
          </Link>
          <Link
            href="/estudio"
            className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-cream/50 transition hover:text-cream"
          >
            <LibraryBig className="h-3.5 w-3.5" strokeWidth={2} />
            Estúdio de enquadramento
          </Link>
        </div>

        <header className="mb-14 mt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-sun-300">
            {site.galleryPageEyebrow}
          </p>
          <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-cream md:text-5xl">
            {site.galleryPageTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream/65">
            {splitEmphasis(
              fillTemplate(site.galleryPageLede, {
                obras: String(artworks.length),
                paginas: String(illustrated.length),
                livro: book.title,
              }),
            ).map((part, i) =>
              part.em ? (
                <em key={i} className="italic text-cream/80">
                  {part.text}
                </em>
              ) : (
                <span key={i}>{part.text}</span>
              ),
            )}
          </p>
        </header>

        <section>
          <h2 className="mb-8 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-cream/50">
            <span className="h-px w-8 bg-cream/25" />
            {site.galleryWorksTitle}
          </h2>
          <GalleryGrid artworks={artworks} />
        </section>

        <section className="mt-24">
          <h2 className="mb-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-cream/50">
            <span className="h-px w-8 bg-cream/25" />
            <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.8} />
            {site.galleryPlatesTitle}
          </h2>
          <p className="mb-8 max-w-2xl text-sm leading-relaxed text-cream/55">
            {site.galleryPlatesNote}
          </p>
          <BookPlates pages={pages} />
        </section>

        <footer className="mt-20 border-t border-cream/10 pt-6 text-xs text-cream/40">
          {site.name} · {site.galleryFooterNote}
        </footer>
      </div>
    </main>
  );
}
