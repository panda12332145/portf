import { useCallback, useEffect, useRef } from "react";
import Lenis from "lenis";
import { ScrollContext, type ScrollController } from "./lib/scroll";
import Background from "./components/Background";
import Butterflies from "./components/Butterflies";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Gallery from "./components/Gallery";
import FAQ from "./components/FAQ";
import Commission from "./components/Commission";
import Footer from "./components/Footer";

export default function App() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenisRef.current = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  const scrollTo = useCallback<ScrollController["scrollTo"]>((target) => {
    lenisRef.current?.scrollTo(target, { offset: -64, duration: 1.6 });
  }, []);

  return (
    <ScrollContext.Provider value={{ scrollTo }}>
      <Background />
      <Butterflies />
      <Navbar />

      <main className="relative z-10">
        <Hero />
        <Gallery />
        <FAQ />
        <Commission />
      </main>

      <Footer />
      <div className="noise" />
    </ScrollContext.Provider>
  );
}
