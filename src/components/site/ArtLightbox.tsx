"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/cn";

export interface LightboxItem {
  slug: string;
  image: string;
  title: string;
  type?: string;
  description?: string;
  poem?: string[];
  meta?: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/** Ampliação de uma arte — usada pela galeria do site e pelas páginas do livro. */
export function ArtLightbox({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: LightboxItem[];
  index: number | null;
  onIndexChange: (i: number | null) => void;
  onClose: () => void;
}) {
  const item = index === null ? null : items[index];
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [item?.slug]);

  const move = useCallback(
    (delta: number) => {
      if (index === null || items.length < 2) return;
      onIndexChange((index + delta + items.length) % items.length);
    },
    [index, items.length, onIndexChange],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, onClose, move]);

  if (!item || !mounted) return null;

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
  const zoomBy = (delta: number) =>
    setZoom((z) => {
      const nz = clampZoom(z + delta);
      if (nz === 1) setPan({ x: 0, y: 0 });
      return nz;
    });

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomBy(e.deltaY > 0 ? -0.25 : 0.25);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setPan({ x: d.panX + (e.clientX - d.x), y: d.panY + (e.clientY - d.y) });
  };
  const onPointerUp = () => {
    dragRef.current = null;
    setDragging(false);
  };

  // portal: garante que a ampliação fique acima da navbar e de qualquer seção
  return createPortal(
    <div
      className="scope-dark fixed inset-0 z-[120] flex flex-col bg-[#0b0803]/94 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      {/* topo */}
      <header className="flex items-start justify-between gap-6 px-5 pt-5 sm:px-8">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.28em] text-sun-300/80">
            {item.type ?? item.meta ?? ""}
          </p>
          <h2 className="mt-1 truncate font-display text-2xl text-cream sm:text-3xl">{item.title}</h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => zoomBy(-0.5)}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Diminuir"
            className="grid h-9 w-9 place-items-center rounded-full border border-cream/20 text-cream/80 transition hover:bg-cream/10 disabled:opacity-30"
          >
            <ZoomOut size={15} />
          </button>
          <span className="w-12 text-center text-[11px] tabular-nums text-cream/60">
            {zoom.toFixed(2)}×
          </span>
          <button
            onClick={() => zoomBy(0.5)}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Aumentar"
            className="grid h-9 w-9 place-items-center rounded-full border border-cream/20 text-cream/80 transition hover:bg-cream/10 disabled:opacity-30"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            aria-label="Resetar"
            className="grid h-9 w-9 place-items-center rounded-full border border-cream/20 text-cream/80 transition hover:bg-cream/10"
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-9 w-9 place-items-center rounded-full border border-cream/20 bg-cream/5 text-cream transition hover:bg-cream/15"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* arte */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-4 sm:px-16">
        <div
          className={cn(
            "relative max-h-full overflow-hidden rounded-lg border border-cream/12 bg-[#efe4cb] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]",
            dragging ? "cursor-grabbing" : zoom > 1 ? "cursor-grab" : "cursor-zoom-in",
          )}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={() => zoomBy(zoom > 1 ? -5 : 1)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt={item.title}
            draggable={false}
            className="max-h-[62vh] w-auto select-none object-contain transition-transform duration-200 ease-out sm:max-h-[68vh]"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          />
        </div>

        {items.length > 1 && (
          <>
            <button
              onClick={() => move(-1)}
              aria-label="Anterior"
              className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-cream/15 bg-black/30 text-cream/80 backdrop-blur transition hover:bg-black/50 sm:left-4"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => move(1)}
              aria-label="Próxima"
              className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-cream/15 bg-black/30 text-cream/80 backdrop-blur transition hover:bg-black/50 sm:right-4"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* descrição */}
      <footer className="mx-auto w-full max-w-3xl px-6 pb-7 text-center">
        {item.poem?.length ? (
          <p className="font-book text-lg italic leading-relaxed text-sun-100/85">
            {item.poem.join(" · ")}
          </p>
        ) : null}
        {item.description ? (
          <p className="mt-2 text-sm leading-relaxed text-cream/60">{item.description}</p>
        ) : null}
        {index !== null && items.length > 1 ? (
          <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-cream/35">
            {index + 1} / {items.length} · use ← → para navegar
          </p>
        ) : null}
      </footer>
    </div>,
    document.body,
  );
}
