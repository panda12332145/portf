import Background from "@/components/site/Background";
import Butterflies from "@/components/site/Butterflies";
import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import GalleryGrid from "@/components/site/GalleryGrid";
import FAQ from "@/components/site/FAQ";
import Commission from "@/components/site/Commission";
import Footer from "@/components/site/Footer";
import SmoothScroll from "@/components/site/SmoothScroll";
import { SectionHeader } from "@/components/site/SectionHeader";
import BookSection from "@/components/book/BookSection";
import { getArtworks, getCommissions, getFaqs, getSite } from "@/db/queries";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const site = getSite();
  const artworks = getArtworks();
  const faqs = getFaqs();
  const types = getCommissions();

  return (
    <SmoothScroll>
      <Background image={site.backgroundImage} />
      <Butterflies />
      <Navbar name={site.name} />

      <main className="relative z-10">
        <Hero site={site} />

        {/* o palco 3D substitui a antiga seção "01 — Portfólio" */}
        <BookSection />

        <section id="portfolio" className="relative px-5 pt-24 md:px-12 md:pt-36">
          <div className="mx-auto max-w-6xl">
            <SectionHeader
              eyebrow={site.gallerySectionEyebrow}
              title={site.gallerySectionTitle}
              lede={site.gallerySectionLede}
              aside={
                <Link
                  href="/galeria"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-sun-300/85 transition-colors hover:text-sun-200"
                >
                  Ver acervo completo <ArrowRight size={13} />
                </Link>
              }
            />
            <div className="mt-12 md:mt-16">
              <GalleryGrid artworks={artworks.slice(0, 6)} />
            </div>
          </div>
        </section>

        <FAQ
          faqs={faqs}
          eyebrow={site.faqSectionEyebrow}
          title={site.faqSectionTitle}
          lede={site.faqSectionLede}
        />

        <Commission
          types={types}
          eyebrow={site.commissionSectionEyebrow}
          title={site.commissionSectionTitle}
          lede={`${site.commissionSectionLede} ${site.commissionNote}`}
          note={site.commissionNote}
        />
      </main>

      <Footer site={site} />
      <div className="noise" />
    </SmoothScroll>
  );
}
