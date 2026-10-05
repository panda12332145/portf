"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Hand,
  MousePointerClick,
  Feather,
  LibraryBig,
} from "lucide-react";
import { Scene } from "./Scene";
import { buildBookTextures, type BookTextures } from "@/lib/textures";
import { BOOK, SIDES, SHEET_COUNT, artByOrder } from "@/lib/book-data";
import type { BookApi, BookVisualState } from "./Book";
import { cn } from "@/lib/cn";
import { ArtLightbox } from "@/components/ArtLightbox";

/* ------------------------------------------------------------------ */

function pageLabel(opened: boolean, flipped: number): string {
  if (!opened) return "Capa";
  if (flipped === 0) return "Página 1 · 10";
  if (flipped >= SHEET_COUNT) return "Página 10 · Fim";
  return `Páginas ${flipped * 2}–${flipped * 2 + 1} · 10`;
}

export default function BookExperience() {
  const [textures, setTextures] = useState<BookTextures | null>(null);
  const [loadPct, setLoadPct] = useState(0);
  const [vis, setVis] = useState<BookVisualState>({ opened: false, flipped: 0 });
  const [activeArtOrder, setActiveArtOrder] = useState<number | null>(null);

  const apiRef = useRef<BookApi | null>(null);
  const progressRef = useRef({ openT: 0, flipped: 0 });

  useEffect(() => {
    let alive = true;
    buildBookTextures((done, total) => setLoadPct(Math.round((done / total) * 100)))
      .then((t) => alive && setTextures(t))
      .catch(console.error);
    return () => {
      alive = false;
    };
  }, []);

  // garante que o livro esteja gravado no banco (idempotente)
  useEffect(() => {
    fetch("/api/book").catch(() => {});
  }, []);

  const onState = useCallback((s: BookVisualState) => setVis(s), []);
  const onArtClick = useCallback((order: number) => setActiveArtOrder(order), []);

  /* teclado */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!apiRef.current) return;
      if (e.target instanceof HTMLButtonElement) return;
      if (e.key === "ArrowRight" || e.key === " ") apiRef.current.flipNext();
      if (e.key === "ArrowLeft") apiRef.current.flipPrev();
      if (e.key === "Enter") apiRef.current.open();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const opened = vis.opened;
  const atEnd = opened && vis.flipped >= SHEET_COUNT;

  const click = (fn: () => void) => () => {
    fn();
    (document.activeElement as HTMLElement | null)?.blur?.();
  };

  const activeArt = activeArtOrder !== null ? artByOrder(activeArtOrder) ?? null : null;

  return (
    <div className="relative h-dvh w-full select-none overflow-hidden bg-[#e8ddc6]">
      {/* cena 3D */}
      {textures && (
        <div className="absolute inset-0">
          <Scene
            textures={textures}
            apiRef={apiRef}
            progressRef={progressRef}
            onState={onState}
            onArtClick={onArtClick}
          />
        </div>
      )}

      {/* camadas cinematográficas */}
      <div className="vignette" />
      <div className="grain" />

      {/* interface */}
      <div className="pointer-events-none absolute inset-0 z-40 flex flex-col">
        {/* topo ------------------------------------------------------ */}
        <header className="flex items-start justify-between px-5 pt-5 sm:px-9 sm:pt-7">
          <div
            className={cn("fade-up transition-all duration-700", opened ? "scale-90 opacity-70" : "")}
            style={{ transformOrigin: "top left" }}
          >
            <p className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.32em] text-[#8a744a] sm:text-[11px]">
              <Feather className="h-3 w-3" strokeWidth={1.6} />
              Livro ilustrado interativo
            </p>
            <h1 className="font-display text-3xl font-semibold leading-none text-[#3a3126] sm:text-5xl">
              {BOOK.title}
            </h1>
            <div className="mt-2 h-px w-28 bg-gradient-to-r from-[#a8843e] to-transparent sm:w-40" />
          </div>

          <div className="pointer-events-auto flex items-center gap-2.5">
            <Link
              href="/galeria"
              className="fade-up fade-up-1 flex items-center gap-1.5 rounded-full border border-[#3a3126]/15 bg-white/35 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-[#5c4c33] backdrop-blur-sm transition hover:bg-white/60 sm:text-xs"
            >
              <LibraryBig className="h-3.5 w-3.5" strokeWidth={1.8} />
              Galeria
            </Link>
            <div className="fade-up fade-up-1 rounded-full border border-[#3a3126]/15 bg-white/35 px-4 py-1.5 backdrop-blur-sm">
              <span className="font-display text-sm italic text-[#5c4c33] sm:text-base">
                {pageLabel(opened, vis.flipped)}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1" />

        {/* base ------------------------------------------------------- */}
        <footer className="flex flex-col items-center gap-3 px-5 pb-5 sm:pb-7">
          <div className={cn("fade-up fade-up-2 flex items-center gap-2 text-[#6d5b3d]", "hint-float")}>
            {!opened ? (
              <>
                <MousePointerClick className="h-4 w-4" strokeWidth={1.6} />
                <span className="text-xs tracking-wide sm:text-sm">Clique no livro para abrir</span>
              </>
            ) : (
              <>
                <Hand className="h-4 w-4" strokeWidth={1.6} />
                <span className="text-xs tracking-wide sm:text-sm">
                  Arraste a página como papel — toque para virar, toque na ilustração para ampliar
                </span>
              </>
            )}
          </div>

          <div className="fade-up fade-up-3 pointer-events-auto flex items-center gap-3 sm:gap-5">
            <button
              onClick={click(() => apiRef.current?.flipPrev())}
              disabled={!opened}
              aria-label="Página anterior"
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full border border-[#3a3126]/20",
                "bg-white/40 text-[#3a3126] backdrop-blur-sm transition-all duration-300",
                "hover:-translate-x-0.5 hover:bg-white/70 hover:shadow-lg",
                "disabled:pointer-events-none disabled:opacity-25"
              )}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
            </button>

            <div className="flex flex-col items-center gap-2">
              <div className="h-[3px] w-40 overflow-hidden rounded-full bg-[#3a3126]/15 sm:w-56">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#a8843e] to-[#c9a25e] transition-all duration-500 ease-out"
                  style={{ width: `${(vis.flipped / SHEET_COUNT) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#8a744a]">
                {vis.flipped} de {SHEET_COUNT} folhas
              </span>
            </div>

            <button
              onClick={click(() => apiRef.current?.flipNext())}
              disabled={atEnd}
              aria-label={opened ? "Próxima página" : "Abrir livro"}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full border border-[#3a3126]/20",
                "bg-white/40 text-[#3a3126] backdrop-blur-sm transition-all duration-300",
                "hover:translate-x-0.5 hover:bg-white/70 hover:shadow-lg",
                "disabled:pointer-events-none disabled:opacity-25",
                !opened && "border-[#a8843e]/50 bg-[#a8843e]/15 text-[#7a5c22]"
              )}
            >
              {opened ? (
                <ChevronRight className="h-5 w-5" strokeWidth={1.8} />
              ) : (
                <BookOpen className="h-5 w-5" strokeWidth={1.8} />
              )}
            </button>
          </div>

          <p className="text-[10px] tracking-wide text-[#8a744a]/80">
            {SIDES.length} páginas ilustradas · use as setas ← → do teclado
          </p>
        </footer>
      </div>

      {/* loader --------------------------------------------------------- */}
      <div
        className={cn(
          "absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#e8ddc6]",
          "loader-fade",
          textures && "done"
        )}
      >
        <BookOpen className="pulse-book mb-6 h-10 w-10 text-[#a8843e]" strokeWidth={1.2} />
        <p className="font-display text-2xl italic text-[#5c4c33]">{BOOK.title}</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-[#8a744a]">encadernando páginas</p>
        <div className="mt-6 h-px w-44 overflow-hidden rounded bg-[#3a3126]/15">
          <div
            className="h-full bg-[#a8843e] transition-all duration-300"
            style={{ width: `${loadPct}%` }}
          />
        </div>
        <span className="mt-2 text-[10px] tracking-widest text-[#8a744a]">{loadPct}%</span>
      </div>

      <ArtLightbox art={activeArt} onClose={() => setActiveArtOrder(null)} />
    </div>
  );
}
