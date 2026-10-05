import { getBook, getSite } from "@/db/queries";
import BookExperienceLoader from "./BookExperienceLoader";
import { SectionHeader } from "@/components/site/SectionHeader";

/**
 * A vitrine do livro: o palco 3D entra no lugar da antiga seção de
 * portfólio "01 — Portfólio". Todo o conteúdo vem do SQLite.
 */
export default function BookSection() {
  const { book, pages } = getBook();
  const site = getSite();

  return (
    <section id="livro" className="relative px-4 pt-20 sm:px-6 md:px-12 md:pt-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow={site.bookSectionEyebrow}
          title={book.title}
          lede={book.description}
          aside={
            <p className="text-[11px] uppercase tracking-[0.22em] text-cream/40">
              {book.edition} · {book.publisher}
            </p>
          }
        />

        {/* scope-dark: o palco do livro é sempre escuro, nos dois temas */}
        <div className="scope-dark relative mt-10 overflow-hidden rounded-2xl border border-cream/12 bg-[#120d07] shadow-[0_50px_140px_-60px_rgba(0,0,0,0.95)]">
          <div className="h-[84svh] min-h-[540px] w-full sm:h-[80svh] lg:h-[82svh]">
            <BookExperienceLoader book={book} pages={pages} />
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] uppercase tracking-[0.22em] text-cream/35">
          {site.bookSectionFootnote}
        </p>
      </div>
    </section>
  );
}
