"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon } from "lucide-react";
import type { ArtData } from "@/lib/book-data";

interface ArtLightboxProps {
  art: ArtData | null;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export function ArtLightbox({ art, onClose }: ArtLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  // reseta zoom/pan sempre que uma nova arte é aberta
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [art?.slug]);

  // fecha com Esc
  useEffect(() => {
    if (!art) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [art, onClose]);

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

  const zoomBy = useCallback((delta: number) => {
    setZoom((z) => {
      const nz = clampZoom(z + delta);
      if (nz === 1) setPan({ x: 0, y: 0 });
      return nz;
    });
  }, []);

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
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    setPan({ x: d.panX + dx, y: d.panY + dy });
  };

  const onPointerUp = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (!art) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Arte: ${art.title}`}
    >
      {/* fundo embaçado */}
      <div
        className="absolute inset-0 bg-[#1a160f]/70 backdrop-blur-xl"
        onClick={onClose}
      />

      <div className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#201c15] shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:flex-row sm:max-h-[86vh]">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/90 backdrop-blur transition hover:bg-black/65"
        >
          <X className="h-5 w-5" strokeWidth={1.8} />
        </button>

        {/* visualizador com zoom/pan */}
        <div
          className="relative flex-1 select-none overflow-hidden bg-[#0e0c08] sm:min-h-[420px]"
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
        >
          {art.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={art.image}
              alt={art.title}
              draggable={false}
              className="pointer-events-none absolute left-1/2 top-1/2 max-h-none max-w-none"
              style={{
                transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: dragging ? "none" : "transform 0.15s ease-out",
                height: "100%",
                width: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <div className="flex h-full min-h-[320px] items-center justify-center text-white/40">
              <ImageIcon className="h-10 w-10" strokeWidth={1.2} />
            </div>
          )}

          {/* controles de zoom */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-2 py-1.5 backdrop-blur">
            <button
              onClick={() => zoomBy(-0.4)}
              aria-label="Diminuir zoom"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/85 transition hover:bg-white/10"
            >
              <ZoomOut className="h-4 w-4" strokeWidth={1.8} />
            </button>
            <span className="min-w-[3.2rem] text-center text-xs font-medium tracking-wide text-white/70">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => zoomBy(0.4)}
              aria-label="Aumentar zoom"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/85 transition hover:bg-white/10"
            >
              <ZoomIn className="h-4 w-4" strokeWidth={1.8} />
            </button>
            <button
              onClick={resetView}
              aria-label="Restaurar zoom"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/85 transition hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={1.6} />
            </button>
          </div>
        </div>

        {/* informações da arte */}
        <div className="flex w-full flex-col gap-4 overflow-y-auto border-t border-white/10 p-6 sm:w-[320px] sm:border-l sm:border-t-0 sm:p-7">
          {art.folio ? (
            <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#c9a25e]">
              Página {art.folio}
            </span>
          ) : art.isCover ? (
            <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#c9a25e]">
              Capa
            </span>
          ) : null}

          <h2 className="font-serif text-2xl font-semibold leading-tight text-white sm:text-[1.7rem]">
            {art.title}
          </h2>

          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#c9a25e]/35 bg-[#c9a25e]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-[#e3c789]">
            {art.type}
          </span>

          <p className="text-sm leading-relaxed text-white/75">{art.description}</p>

          {art.poem && art.poem.length > 0 && (
            <div className="mt-1 border-t border-white/10 pt-4">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-white/40">
                Trecho do livro
              </p>
              {art.poem.map((line, i) => (
                <p key={i} className="font-serif italic leading-relaxed text-white/60">
                  {line}
                </p>
              ))}
            </div>
          )}

          <p className="mt-auto pt-3 text-[11px] text-white/35">
            Use a roda do mouse ou os botões para dar zoom. Arraste a imagem para mover.
          </p>
        </div>
      </div>
    </div>
  );
}
