"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Lenis from "lenis";

/**
 * Rolagem suave do site inteiro (Lenis) + âncoras usadas pela navbar.
 * Desligada em quem prefere menos movimento.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const [offset, setOffset] = useState(64);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    const update = () => setOffset(window.innerWidth < 768 ? 56 : 64);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenisRef.current?.scrollTo(el as HTMLElement, { offset: -offset, duration: 1.5 });
      if (!lenisRef.current) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [offset]);

  return <>{children}</>;
}

/** Utilitário para os componentes que querem disparar a rolagem suave. */
export function useScrollTo() {
  return useCallback((target: string) => {
    const el = document.querySelector(target);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);
}
