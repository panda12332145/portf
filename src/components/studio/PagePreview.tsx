"use client";

import { useEffect, useRef } from "react";
import {
  drawPage,
  ensureFonts,
  loadImage,
  sampleTone,
  PW,
  PH,
  type ArtAsset,
} from "@/lib/page-canvas";
import type { BookMeta, BookPage } from "@/lib/types";

/** cache das imagens já carregadas (tone + elemento) */
const assets = new Map<string, Promise<ArtAsset>>();

export function getAsset(src: string): Promise<ArtAsset> {
  const cached = assets.get(src);
  if (cached) return cached;
  const p = loadImage(src).then((img) => ({ img, tone: sampleTone(img) }));
  assets.set(src, p);
  return p;
}

/**
 * Pré-visualização fiel de uma página: usa exatamente o mesmo desenho
 * do livro 3D (src/lib/page-canvas), então o que aparece aqui é o que
 * aparece na folha.
 */
export default function PagePreview({
  book,
  page,
  className,
}: {
  book: BookMeta;
  page: BookPage;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify(page);

  useEffect(() => {
    let alive = true;
    (async () => {
      await ensureFonts();
      const asset = page.image ? await getAsset(page.image).catch(() => null) : null;
      if (!alive) return;
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawPage(ctx, page, asset, book);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <canvas ref={ref} width={PW} height={PH} className={className} />;
}
