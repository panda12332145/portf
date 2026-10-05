"use client";

import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Feather,
  Hand,
  ImageOff,
  LibraryBig,
  Maximize2,
  MousePointerClick,
  Sliders,
} from "lucide-react";
import { Scene } from "./Scene";
import { buildBookTextures, sheetCount, type BookTextures } from "@/lib/textures";
import type { BookMeta, BookPage } from "@/lib/types";
import type { BookApi, BookVisualState } from "./Book";
import { cn } from "@/lib/cn";
import { ArtLightbox, type LightboxItem } from "@/components/site/ArtLightbox";

/* ------------------------------------------------------------------ */
/*  Rótulos                                                            */
/* ------------------------------------------------------------------ */

function pageLabel(opened: boolean, flipped: number, total: number): string {
  if (!opened) return "Capa";
  if (flipped === 0) return `Abertura · ${total} páginas`;
  if (flipped >= Math.ceil(total / 2)) return `Fim · ${total} páginas`;
  const a = flipped * 2;
  return `Páginas ${a}–${a + 1} de ${total}`;
}

/* ------------------------------------------------------------------ */
/*  Se o WebGL não estiver disponível, mostramos a capa + caminho      */
/* ------------------------------------------------------------------ */

class GLBoundary extends Component<{ children: ReactNode; book: BookMeta }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-5 px-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={this.props.book.coverImage}
          alt={this.props.book.title}
          className="max-h-[46vh] rounded-lg border border-cream/15 shadow-2xl"
        />
        <div>
          <p className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.28em] text-sun-300/80">
            <ImageOff size={14} /> Este navegador não conseguiu abrir o livro em 3D
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm text-cream/60">
            As {`páginas`} continuam disponíveis na galeria do acervo.
          </p>
          <Link
            href="/galeria"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-cream/25 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cream transition hover:bg-cream/10"
          >
            <LibraryBig size={14} /> Ver a galeria
          </Link>
        </div>
      </div>
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Experiência                                                        */
/* ------------------------------------------------------------------ */

export default function BookExperience({ book, pages }: { book: BookMeta; pages: BookPage[] }) {
  const [textures, setTextures] = useState<BookTextures | null>(null);
  const [loadPct, setLoadPct] = useState(0);
  const [vis, setVis] = useState<BookVisualState>({ opened: false, flipped: 0 });
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [active, setActive] = useState(true);

  const apiRef = useRef<BookApi | null>(null);
  const progressRef = useRef({ openT: 0, flipped: 0 });
  const stageRef = useRef<HTMLDivElement>(null);

  const total = pages.length;
  const sheets = sheetCount(pages);

  /* só renderiza a cena quando a seção está na tela */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting && entry.intersectionRatio > 0.05),
      { threshold: [0, 0.05, 0.5] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    buildBookTextures({
      book,
      pages,
      onProgress: (done, all) => alive && setLoadPct(Math.round((done / all) * 100)),
    })
      .then((t) => alive && setTextures(t))
      .catch((err) => console.error("[livro] falha ao montar as texturas", err));
    return () => {
      alive = false;
    };
  }, [book, pages]);

  const onState = useCallback((s: BookVisualState) => setVis(s), []);
  const onPageClick = useCallback((slug: string) => setActiveSlug(slug), []);

  /* teclado */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!apiRef.current || activeSlug) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "BUTTON" || el.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight") apiRef.current.flipNext();
      if (e.key === "ArrowLeft") apiRef.current.flipPrev();
      if (e.key === "Enter") apiRef.current.open();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeSlug]);

  const illustrated: LightboxItem[] = useMemo(
    () =>
      pages
        .filter((p) => p.image)
        .map((p) => ({
          slug: p.slug,
          image: p.image as string,
          title: p.title,
          type: p.type,
          description: p.description,
          poem: p.poem,
        })),
    [pages],
  );

  const activeIndex = activeSlug ? illustrated.findIndex((i) => i.slug === activeSlug) : null;

  /** as duas páginas à vista no momento (frente e verso da folha atual) */
  const spread = useMemo(() => {
    const first = Math.min(pages.length - 1, vis.flipped * 2);
    return [pages[first], pages[first + 1]];
  }, [pages, vis.flipped]);
  const opened = vis.opened;
  const atEnd = opened && vis.flipped >= sheets;

  const click = (fn: () => void) => () => {
    fn();
    (document.activeElement as HTMLElement | null)?.blur?.();
  };

  return (
    <div ref={stageRef} className="relative h-full w-full select-none overflow-hidden">
      {/* cena 3D */}
      {textures && (
        <div className="absolute inset-0">
          <GLBoundary book={book}>
            <Scene
              textures={textures}
              pages={pages}
              apiRef={apiRef}
              progressRef={progressRef}
              onState={onState}
              onPageClick={onPageClick}
              active={active}
            />
          </GLBoundary>
        </div>
      )}

      {/* vinheta própria do palco */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_85%_at_50%_45%,transparent_52%,rgba(8,5,2,0.55)_100%)]" />

      {/* interface */}
      <div className="pointer-events-none absolute inset-0 z-40 flex flex-col">
        <header className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-8 sm:pt-7">
          <div
            className={cn(
              "transition-all duration-700",
              opened ? "scale-[0.92] opacity-70" : "",
            )}
            style={{ transformOrigin: "top left" }}
          >
            <p className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.32em] text-sun-300/85 sm:text-[11px]">
              <Feather className="h-3 w-3" strokeWidth={1.6} />
              Livro ilustrado interativo
            </p>
            <p className="mt-1 font-book text-lg italic text-cream/75 sm:text-xl">
              {book.subtitle}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-cream/45">
              {book.author} · {book.publisher} · {book.edition}
            </p>
            <div className="mt-2 h-px w-28 bg-gradient-to-r from-sun-400 to-transparent sm:w-40" />
          </div>

          <div className="pointer-events-auto flex items-center gap-2.5">
            <Link
              href="/galeria"
              className="flex items-center gap-1.5 rounded-full border border-cream/15 bg-black/25 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-cream/80 backdrop-blur-sm transition hover:bg-black/45"
            >
              <LibraryBig className="h-3.5 w-3.5" strokeWidth={1.8} />
              Galeria
            </Link>
            <Link
              href="/estudio"
              className="hidden items-center gap-1.5 rounded-full border border-cream/15 bg-black/25 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-cream/80 backdrop-blur-sm transition hover:bg-black/45 sm:flex"
            >
              <Sliders className="h-3.5 w-3.5" strokeWidth={1.8} />
              Estúdio
            </Link>
            <div className="rounded-full border border-cream/15 bg-black/25 px-4 py-1.5 backdrop-blur-sm">
              <span className="font-book text-sm italic text-cream/85 sm:text-base">
                {pageLabel(opened, vis.flipped, total)}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1" />

        <footer className="flex flex-col items-center gap-3 px-5 pb-5 sm:pb-6">
          <div className="flex items-center gap-2 text-cream/60">
            {!opened ? (
              <>
                <MousePointerClick className="h-4 w-4" strokeWidth={1.6} />
                <span className="text-xs tracking-wide sm:text-sm">
                  Clique no livro para abrir
                </span>
              </>
            ) : (
              <>
                <Hand className="h-4 w-4" strokeWidth={1.6} />
                <span className="text-center text-xs tracking-wide sm:text-sm">
                  Arraste a página como papel · toque fora da ilustração para virar
                </span>
              </>
            )}
          </div>

          <div className="pointer-events-auto flex items-center gap-3 sm:gap-5">
            <button
              onClick={click(() => apiRef.current?.flipPrev())}
              disabled={!opened}
              aria-label="Página anterior"
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full border border-cream/20",
                "bg-black/30 text-cream backdrop-blur-sm transition-all duration-300",
                "hover:-translate-x-0.5 hover:bg-black/55",
                "disabled:pointer-events-none disabled:opacity-25",
              )}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
            </button>

            <div className="flex flex-col items-center gap-2">
              <div className="h-[3px] w-40 overflow-hidden rounded-full bg-cream/15 sm:w-56">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sun-500 to-sun-300 transition-all duration-500 ease-out"
                  style={{ width: `${(vis.flipped / sheets) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-cream/45">
                {vis.flipped} de {sheets} folhas
              </span>
            </div>

            <button
              onClick={click(() => apiRef.current?.flipNext())}
              disabled={atEnd}
              aria-label={opened ? "Próxima página" : "Abrir livro"}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full border border-cream/20",
                "bg-black/30 text-cream backdrop-blur-sm transition-all duration-300",
                "hover:translate-x-0.5 hover:bg-black/55",
                "disabled:pointer-events-none disabled:opacity-25",
                !opened && "border-sun-400/50 bg-sun-400/15 text-sun-200",
              )}
            >
              {opened ? (
                <ChevronRight className="h-5 w-5" strokeWidth={1.8} />
              ) : (
                <BookOpen className="h-5 w-5" strokeWidth={1.8} />
              )}
            </button>
          </div>

          <div className="pointer-events-auto flex items-center gap-4">
            <button
              onClick={click(() => {
                const current = spread.find((p) => p?.image);
                if (current) setActiveSlug(current.slug);
              })}
              disabled={!opened || !spread.some((p) => p?.image)}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cream/45 transition hover:text-cream disabled:opacity-25"
            >
              <Maximize2 size={11} /> ampliar ilustração
            </button>
            <span className="text-[10px] tracking-wide text-cream/35">
              {total} páginas · setas ← → do teclado
            </span>
          </div>
        </footer>
      </div>

      {/* carregando */}
      <div
        className={cn(
          "absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#120d07] transition-opacity duration-700",
          textures ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <BookOpen className="mb-6 h-10 w-10 animate-pulse text-sun-400" strokeWidth={1.2} />
        <p className="font-book text-2xl italic text-cream/90">{book.title}</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-cream/45">encadernando páginas</p>
        <div className="mt-6 h-px w-44 overflow-hidden rounded bg-cream/15">
          <div
            className="h-full bg-sun-400 transition-all duration-300"
            style={{ width: `${loadPct}%` }}
          />
        </div>
        <span className="mt-2 text-[10px] tracking-widest text-cream/45">{loadPct}%</span>
      </div>

      <ArtLightbox
        items={illustrated}
        index={activeIndex === -1 ? null : activeIndex}
        onIndexChange={(i) => setActiveSlug(i === null ? null : illustrated[i].slug)}
        onClose={() => setActiveSlug(null)}
      />
    </div>
  );
}
