"use client";

import * as THREE from "three";
import type { BookMeta, BookPage } from "./types";
import {
  drawCloth,
  drawCover,
  drawEdge,
  drawEndpaper,
  drawPage,
  drawSpine,
  ensureFonts,
  loadImage,
  makeCanvas,
  PW,
  PH,
  sampleTone,
  type ArtAsset,
} from "./page-canvas";

export interface SheetTextures {
  front: THREE.Texture;
  back: THREE.Texture;
}

export interface BookTextures {
  cover: THREE.Texture;
  cloth: THREE.Texture;
  endpaper: THREE.Texture;
  edge: THREE.Texture;
  spine: THREE.Texture;
  sheets: SheetTextures[];
}

/* --------------------------- helpers de folha --------------------- */

export const sheetCount = (pages: BookPage[]) => Math.ceil(pages.length / 2);

export function sheetSides(pages: BookPage[], i: number) {
  return {
    front: pages[i * 2],
    back: pages[i * 2 + 1] ?? pages[pages.length - 1],
  };
}

/* ------------------------------ texturas -------------------------- */

function toTexture(canvas: HTMLCanvasElement, mirrored = false): THREE.Texture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (mirrored) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.x = -1;
    tex.offset.x = 1;
  }
  tex.needsUpdate = true;
  return tex;
}

/**
 * A capa frontal é a face "−Y" de uma caixa que, fechada, gira 180° em
 * torno do eixo da lombada. Sem compensar, o título aparece de cabeça
 * para baixo — daí a rotação de 180° na textura.
 */
function toCoverTexture(canvas: HTMLCanvasElement): THREE.Texture {
  const tex = toTexture(canvas);
  tex.center.set(0.5, 0.5);
  tex.rotation = Math.PI;
  tex.needsUpdate = true;
  return tex;
}

export interface BuildOptions {
  book: BookMeta;
  /** páginas na ordem de leitura (frente e verso de cada folha) */
  pages: BookPage[];
  onProgress?: (done: number, total: number) => void;
}

export async function buildBookTextures({
  book,
  pages,
  onProgress,
}: BuildOptions): Promise<BookTextures> {
  const total = 2 + pages.filter((p) => p.image).length + sheetCount(pages) + 4;
  let done = 0;
  const step = () => onProgress?.(++done, total);

  await ensureFonts();
  step();

  // carrega todas as imagens (do livro) de uma vez
  const assets = new Map<string, ArtAsset>();
  const sources = [book.coverImage, ...pages.map((p) => p.image).filter(Boolean)] as string[];
  const unique = Array.from(new Set(sources));
  await Promise.all(
    unique.map(async (src) => {
      try {
        const img = await loadImage(src);
        assets.set(src, { img, tone: sampleTone(img) });
      } catch {
        /* imagem ausente: a página segue só com o texto */
      }
      step();
    }),
  );

  const sheets: SheetTextures[] = [];
  for (let i = 0; i < sheetCount(pages); i++) {
    const { front, back } = sheetSides(pages, i);
    const f = makeCanvas(PW, PH);
    drawPage(f.ctx, front, (front.image && assets.get(front.image)) || null, book);
    const b = makeCanvas(PW, PH);
    drawPage(b.ctx, back, (back.image && assets.get(back.image)) || null, book);
    sheets.push({ front: toTexture(f.canvas), back: toTexture(b.canvas, true) });
    step();
  }

  const coverC = makeCanvas(PW, PH);
  drawCover(coverC.ctx, book, assets.get(book.coverImage) ?? null);
  step();

  const clothC = makeCanvas(512, 512);
  drawCloth(clothC.ctx, 512, 512);
  step();

  const endC = makeCanvas(1024, 1024);
  drawEndpaper(endC.ctx, 1024, 1024);
  step();

  const edgeC = makeCanvas(256, 256);
  drawEdge(edgeC.ctx, 256, 256);
  step();

  const spineC = makeCanvas(256, 1024);
  drawSpine(spineC.ctx, 256, 1024, book);

  return {
    cover: toCoverTexture(coverC.canvas),
    cloth: toTexture(clothC.canvas),
    endpaper: toTexture(endC.canvas),
    edge: (() => {
      const t = toTexture(edgeC.canvas);
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      return t;
    })(),
    spine: toTexture(spineC.canvas),
    sheets,
  };
}
