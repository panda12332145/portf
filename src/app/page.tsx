import Background from "@/components/site/Background";
import Butterflies from "@/components/site/Butterflies";
import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import FAQ from "@/components/site/FAQ";
import Commission from "@/components/site/Commission";
import Footer from "@/components/site/Footer";
import SmoothScroll from "@/components/site/SmoothScroll";
import BookSection from "@/components/book/BookSection";
import { getCommissions, getFaqs, getSite, getSiteSettings } from "@/db/queries";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const site = getSite();
  const faqs = getFaqs();
  const types = getCommissions();
  const settings = getSiteSettings();

  return (
    <SmoothScroll>
      <Background image={site.backgroundImage} />
      <Butterflies />
      <Navbar site={site} />

      <main className="relative z-10">
        <Hero site={site} />

        {/* o palco 3D do livro abre a home — sem grade de obras */}
        <BookSection />

        <FAQ
          faqs={faqs}
          eyebrow={site.faqSectionEyebrow}
          title={site.faqSectionTitle}
          lede={site.faqSectionLede}
        />

        <Commission types={types} site={site} settings={settings} />
      </main>

      <Footer site={site} />
    </SmoothScroll>
  );
}
