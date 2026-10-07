/**
 * ------------------------------------------------------------------
 *  Desenho das páginas do livro em canvas 2D
 * ------------------------------------------------------------------
 *  Cada página é uma textura 1024×1350 aplicada na folha 3D. Todo o
 *  enquadramento vem do banco (PageLayout), então retrato, paisagem,
 *  panorâmica e diagonal convivem sem quebrar o desenho.
 *
 *  Este módulo é compartilhado entre o livro 3D e o editor /estudio.
 * ------------------------------------------------------------------
 */

import { ART_AREA, PAGE, clamp, pictureRect, type PageLayout } from "./layout";
import type { BookMeta, BookPage } from "./types";

export const PW = PAGE.W;
export const PH = PAGE.H;

/** Área maior, usada por páginas "sangradas" (a arte invade a margem). */
export const BLEED_AREA = { x: 46, y: 62, w: 932, h: 832 };

export interface ArtAsset {
  img: HTMLImageElement;
  /** cor média da arte — usada em véus e sombras, para tudo conversar */
  tone: { r: number; g: number; b: number };
}

/* ----------------------------- utilitários ------------------------ */

export function makeCanvas(w = PW, h = PH) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`falha ao carregar ${src}`));
    img.src = src;
  });
}

/** Cor média da imagem (1×1) — dá o tom do véu de fundo e das sombras. */
export function sampleTone(img: HTMLImageElement) {
  try {
    const { canvas, ctx } = makeCanvas(12, 12);
    ctx.drawImage(img, 0, 0, 12, 12);
    const d = ctx.getImageData(0, 0, 12, 12).data;
    let r = 0;
    let g = 0;
    let b = 0;
    for (let i = 0; i < d.length; i += 4) {
      r += d[i];
      g += d[i + 1];
      b += d[i + 2];
    }
    const n = d.length / 4;
    return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
  } catch {
    return { r: 150, g: 130, b: 95 };
  }
}

export async function ensureFonts() {
  const specs = [
    'italic 600 150px "Cormorant Garamond"',
    '600 92px "Cormorant Garamond"',
    '600 64px "Cormorant Garamond"',
    '600 56px "Cormorant Garamond"',
    '500 40px "Cormorant Garamond"',
    'italic 500 40px "Cormorant Garamond"',
    '500 30px "Cormorant Garamond"',
    '500 26px "Cormorant Garamond"',
    '600 96px "Fraunces"',
    '500 36px "Fraunces"',
    '300 40px "Fraunces"',
  ];
  await Promise.all(specs.map((s) => document.fonts.load(s).catch(() => null)));
  await document.fonts.ready;
}

function letterSpacing(ctx: CanvasRenderingContext2D, px: number) {
  const c = ctx as unknown as { letterSpacing?: string };
  if ("letterSpacing" in ctx) c.letterSpacing = `${px}px`;
}

function roundedPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = clamp(r, 0, Math.min(w, h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, n = 2600, alpha = 0.045) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const v = 120 + Math.random() * 110;
    ctx.fillStyle = `rgba(${v}, ${v * 0.86}, ${v * 0.6}, ${Math.random() * alpha})`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }
}

function diamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = color;
  ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.restore();
}

function fillPaper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#f6eeda";
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w / 2, h * 0.42, h * 0.1, w / 2, h / 2, h * 0.85);
  g.addColorStop(0, "rgba(255,252,240,0.55)");
  g.addColorStop(1, "rgba(196,171,124,0.20)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const edge = (grad: CanvasGradient, x: number, y: number, ww: number, hh: number) => {
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, ww, hh);
  };
  const top = ctx.createLinearGradient(0, 0, 0, 54);
  top.addColorStop(0, "rgba(141,116,70,0.13)");
  top.addColorStop(1, "rgba(141,116,70,0)");
  edge(top, 0, 0, w, 54);
  ctx.save();
  ctx.translate(0, h);
  ctx.scale(1, -1);
  edge(top, 0, 0, w, 54);
  ctx.restore();

  const left = ctx.createLinearGradient(0, 0, 46, 0);
  left.addColorStop(0, "rgba(141,116,70,0.11)");
  left.addColorStop(1, "rgba(141,116,70,0)");
  edge(left, 0, 0, 46, h);
  const right = ctx.createLinearGradient(w, 0, w - 46, 0);
  right.addColorStop(0, "rgba(141,116,70,0.11)");
  right.addColorStop(1, "rgba(141,116,70,0)");
  edge(right, w - 46, 0, 46, h);

  ctx.strokeStyle = "rgba(130,105,60,0.05)";
  for (let i = 0; i < 36; i++) {
    ctx.beginPath();
    const x = Math.random() * w;
    const y = Math.random() * h;
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + 20 - Math.random() * 40,
      y + 14 - Math.random() * 28,
      x + 44 - Math.random() * 88,
      y + 30 - Math.random() * 60,
    );
    ctx.stroke();
  }
  grain(ctx, w, h);
}

/** desenha a imagem preenchendo a caixa (cover) sem distorcer */
function drawCoverFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  scale = 1,
) {
  const ir = img.width / img.height;
  const br = w / h;
  let sw = img.width;
  let sh = img.height;
  let sx = 0;
  let sy = 0;
  if (ir > br) {
    sw = img.height * br;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / br;
    sy = (img.height - sh) / 2;
  }
  const cx = x + w / 2;
  const cy = y + h / 2;
  const dw = w * scale;
  const dh = h * scale;
  ctx.drawImage(img, sx, sy, sw, sh, cx - dw / 2, cy - dh / 2, dw, dh);
}

const paperVeil = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, a = 0.9) => {
  const g = ctx.createRadialGradient(x + w / 2, y + h / 2, h * 0.18, x + w / 2, y + h / 2, h * 0.72);
  g.addColorStop(0, "rgba(246,238,218,0.10)");
  g.addColorStop(0.65, `rgba(246,238,218,${a * 0.55})`);
  g.addColorStop(1, `rgba(242,232,208,${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
};

/* ================================================================== */
/*  A ilustração na página                                             */
/* ================================================================== */

interface Rects {
  area: { x: number; y: number; w: number; h: number };
  plate: { x: number; y: number; w: number; h: number };
  image: { x: number; y: number; w: number; h: number };
}

/** Calcula moldura e imagem para um layout qualquer (usado no 3D e no editor). */
export function resolveRects(
  layout: PageLayout,
  size: { width: number; height: number } | null,
): Rects {
  const inner = layout.frame === "plate" ? inset(ART_AREA, layout.platePad) : ART_AREA;
  const image = pictureRect(layout, size, inner);
  return { area: ART_AREA, plate: expand(image, layout.platePad), image };
}

const inset = (
  r: { x: number; y: number; w: number; h: number },
  p: number,
): { x: number; y: number; w: number; h: number } => ({ x: r.x + p, y: r.y + p, w: r.w - 2 * p, h: r.h - 2 * p });

const expand = (
  r: { x: number; y: number; w: number; h: number },
  p: number,
): { x: number; y: number; w: number; h: number } => ({ x: r.x - p, y: r.y - p, w: r.w + 2 * p, h: r.h + 2 * p });

export function drawPicture(
  ctx: CanvasRenderingContext2D,
  page: BookPage,
  asset: ArtAsset | null,
  opts: { showMount?: boolean } = {},
) {
  if (!asset) return;
  const { layout } = page;
  const size = { width: asset.img.width, height: asset.img.height };
  const tone = asset.tone;
  const toneCss = `rgb(${tone.r},${tone.g},${tone.b})`;
  const showMount = opts.showMount ?? true;

  /* ----------------------------- sangrada ------------------------- */
  if (layout.frame === "bleed") {
    const r = pictureRect({ ...layout, fit: "cover" }, size, BLEED_AREA);
    ctx.save();
    roundedPath(ctx, BLEED_AREA.x, BLEED_AREA.y, BLEED_AREA.w, BLEED_AREA.h, layout.radius);
    ctx.clip();
    ctx.save();
    ctx.shadowColor = "rgba(48,34,12,0.45)";
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = "#e8dcc0";
    ctx.fillRect(BLEED_AREA.x, BLEED_AREA.y, BLEED_AREA.w, BLEED_AREA.h);
    ctx.restore();
    drawCoverFit(ctx, asset.img, r.x, r.y, r.w, r.h);
    ctx.fillStyle = "rgba(244,232,200,0.08)";
    ctx.fillRect(BLEED_AREA.x, BLEED_AREA.y, BLEED_AREA.w, BLEED_AREA.h);
    ctx.restore();

    ctx.strokeStyle = "rgba(96,74,40,0.45)";
    ctx.lineWidth = 1.6;
    roundedPath(ctx, BLEED_AREA.x, BLEED_AREA.y, BLEED_AREA.w, BLEED_AREA.h, layout.radius);
    ctx.stroke();
    return;
  }

  const { area, plate, image } = resolveRects(layout, size);

  /* ------------------- fundo (véu desfocado / tonal) --------------- */
  if (layout.backdrop !== "none") {
    ctx.save();
    roundedPath(ctx, area.x, area.y, area.w, area.h, 14);
    ctx.clip();
    if (layout.backdrop === "blur" || layout.backdrop === "tint") {
      ctx.fillStyle = "#efe4ca";
      ctx.fillRect(area.x, area.y, area.w, area.h);
      if (layout.backdrop === "blur") {
        ctx.filter = "blur(30px) saturate(1.05)";
        drawCoverFit(ctx, asset.img, area.x, area.y, area.w, area.h, 1.18);
        ctx.filter = "none";
        ctx.fillStyle = `rgba(${tone.r},${tone.g},${tone.b},0.14)`;
        ctx.fillRect(area.x, area.y, area.w, area.h);
      } else {
        ctx.fillStyle = toneCss;
        ctx.globalAlpha = 0.18;
        ctx.fillRect(area.x, area.y, area.w, area.h);
        ctx.globalAlpha = 1;
      }
    } else {
      ctx.fillStyle = layout.mountTone === "ink" ? "#2e2a20" : "#f1e7d0";
      ctx.fillRect(area.x, area.y, area.w, area.h);
    }
    paperVeil(ctx, area.x, area.y, area.w, area.h, layout.backdrop === "paper" ? 0.25 : 0.85);
    ctx.restore();
  }

  /* ------------------------- moldura (prato) ----------------------- */
  const rotating = Math.abs(layout.rotation) > 0.01;
  ctx.save();
  if (rotating) {
    const cx = plate.x + plate.w / 2;
    const cy = plate.y + plate.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate((layout.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  if (showMount && layout.frame === "plate") {
    if (layout.shadow) {
      ctx.save();
      ctx.shadowColor = "rgba(64,46,20,0.32)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 14;
      ctx.fillStyle = layout.mountTone === "ink" ? "#2e2a20" : "#eee3c8";
      roundedPath(ctx, plate.x, plate.y, plate.w, plate.h, layout.radius + 6);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = layout.mountTone === "ink" ? "#2e2a20" : "#eee3c8";
      roundedPath(ctx, plate.x, plate.y, plate.w, plate.h, layout.radius + 6);
      ctx.fill();
    }
    // filete duplo interno
    ctx.strokeStyle = layout.mountTone === "ink" ? "rgba(201,162,94,0.55)" : "rgba(150,124,78,0.42)";
    ctx.lineWidth = 1.1;
    roundedPath(ctx, plate.x + 5, plate.y + 5, plate.w - 10, plate.h - 10, layout.radius + 2);
    ctx.stroke();
  }

  /* --------------------------- a imagem ---------------------------- */
  ctx.save();
  roundedPath(ctx, image.x, image.y, image.w, image.h, layout.radius);
  ctx.clip();
  ctx.fillStyle = "#e9ddc2";
  ctx.fillRect(image.x, image.y, image.w, image.h);
  if (layout.fit === "contain") {
    drawCoverFit(ctx, asset.img, image.x, image.y, image.w, image.h);
  } else {
    drawCoverFit(ctx, asset.img, image.x, image.y, image.w, image.h);
  }
  // véu suave que une a paleta da arte ao papel do livro
  ctx.fillStyle = "rgba(244,232,200,0.07)";
  ctx.fillRect(image.x, image.y, image.w, image.h);
  ctx.restore();

  ctx.strokeStyle = "rgba(96,74,40,0.38)";
  ctx.lineWidth = 1.3;
  roundedPath(ctx, image.x, image.y, image.w, image.h, layout.radius);
  ctx.stroke();

  ctx.restore();
}

/* ================================================================== */
/*  Composição da página                                               */
/* ================================================================== */

function drawFolio(ctx: CanvasRenderingContext2D, page: BookPage) {
  if (!page.folio) return;
  ctx.font = '500 30px "Cormorant Garamond"';
  ctx.fillStyle = "#97835d";
  ctx.fillText(`—  ${page.folio}  —`, PW / 2, 1298);
}

function drawTitleBlock(ctx: CanvasRenderingContext2D, page: BookPage) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#443826";
  ctx.font = '600 54px "Cormorant Garamond"';
  ctx.fillText(page.title, PW / 2, 1008);

  ctx.strokeStyle = "rgba(120,95,50,0.5)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(PW / 2 - 150, 1042);
  ctx.lineTo(PW / 2 - 24, 1042);
  ctx.moveTo(PW / 2 + 24, 1042);
  ctx.lineTo(PW / 2 + 150, 1042);
  ctx.stroke();
  diamond(ctx, PW / 2, 1042, 8, "#b08d4f");

  if (page.type) {
    letterSpacing(ctx, 3);
    ctx.font = '500 24px "Cormorant Garamond"';
    ctx.fillStyle = "#9c8a63";
    ctx.fillText(page.type.toUpperCase(), PW / 2, 1086);
    letterSpacing(ctx, 0);
  }

  ctx.font = 'italic 500 38px "Cormorant Garamond"';
  ctx.fillStyle = "#6a5a40";
  page.poem.forEach((line, i) => ctx.fillText(line, PW / 2, 1152 + i * 52));
}

function drawTitlePage(ctx: CanvasRenderingContext2D, page: BookPage, book: BookMeta) {
  ctx.textAlign = "center";
  diamond(ctx, PW / 2, 300, 11, "#b08d4f");
  ctx.strokeStyle = "rgba(120,95,50,0.45)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(PW / 2 - 170, 300);
  ctx.lineTo(PW / 2 - 40, 300);
  ctx.moveTo(PW / 2 + 40, 300);
  ctx.lineTo(PW / 2 + 170, 300);
  ctx.stroke();

  const words = book.title.split(" ");
  const half = Math.ceil(words.length / 2);
  const lines = words.length > 2 ? [words.slice(0, half).join(" "), words.slice(half).join(" ")] : [book.title];

  letterSpacing(ctx, 6);
  ctx.fillStyle = "#3f3322";
  ctx.font = `600 ${lines.length > 1 ? 86 : 96}px "Fraunces"`;
  lines.forEach((l, i) => ctx.fillText(l.toUpperCase(), PW / 2, 430 + i * 104));

  ctx.font = 'italic 500 40px "Cormorant Garamond"';
  ctx.fillStyle = "#7a674a";
  letterSpacing(ctx, 0);
  const sub = book.subtitle.split(" ");
  const subLines = [sub.slice(0, Math.ceil(sub.length / 2)).join(" "), sub.slice(Math.ceil(sub.length / 2)).join(" ")];
  subLines.forEach((l, i) => ctx.fillText(l, PW / 2, 590 + i * 50));

  diamond(ctx, PW / 2, 720, 8, "#b08d4f");

  letterSpacing(ctx, 4);
  ctx.font = '500 30px "Cormorant Garamond"';
  ctx.fillStyle = "#5c4c33";
  ctx.fillText(book.author.toUpperCase(), PW / 2, 830);
  letterSpacing(ctx, 2);
  ctx.font = '500 24px "Cormorant Garamond"';
  ctx.fillStyle = "#9c8a63";
  ctx.fillText((book.publisher || "").toUpperCase(), PW / 2, 886);
  ctx.fillText((book.edition || "").toUpperCase(), PW / 2, 924);
  letterSpacing(ctx, 0);

  ctx.font = 'italic 500 34px "Cormorant Garamond"';
  ctx.fillStyle = "#7a674a";
  (page.poem.length ? page.poem : [book.dedication]).forEach((l, i) =>
    ctx.fillText(l, PW / 2, 1110 + i * 48),
  );
  drawFolio(ctx, page);
}

function drawInterlude(ctx: CanvasRenderingContext2D, page: BookPage) {
  ctx.textAlign = "center";
  diamond(ctx, PW / 2, 330, 10, "#b08d4f");
  letterSpacing(ctx, 5);
  ctx.fillStyle = "#6d5b3d";
  ctx.font = '500 28px "Cormorant Garamond"';
  ctx.fillText(page.title.toUpperCase(), PW / 2, 400);
  letterSpacing(ctx, 0);

  ctx.strokeStyle = "rgba(120,95,50,0.4)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(PW / 2 - 120, 440);
  ctx.lineTo(PW / 2 + 120, 440);
  ctx.stroke();

  ctx.font = 'italic 600 74px "Cormorant Garamond"';
  ctx.fillStyle = "#4a3d29";
  page.poem.forEach((l, i) => ctx.fillText(l, PW / 2, 620 + i * 96));

  // ornamento em leque
  for (let i = 0; i < 5; i++) {
    const x = PW / 2 - 96 + i * 48;
    ctx.strokeStyle = "rgba(150,124,78,0.5)";
    ctx.beginPath();
    ctx.arc(x, 880, 16, Math.PI * 0.15, Math.PI * 0.85, true);
    ctx.stroke();
  }
  diamond(ctx, PW / 2, 940, 7, "#b08d4f");
  drawFolio(ctx, page);
}

function drawFinale(ctx: CanvasRenderingContext2D, page: BookPage) {
  ctx.textAlign = "center";
  diamond(ctx, PW / 2, 448, 10, "#b08d4f");
  ctx.strokeStyle = "rgba(120,95,50,0.45)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(PW / 2 - 120, 448);
  ctx.lineTo(PW / 2 - 34, 448);
  ctx.moveTo(PW / 2 + 34, 448);
  ctx.lineTo(PW / 2 + 120, 448);
  ctx.stroke();

  ctx.fillStyle = "#463a29";
  ctx.font = 'italic 600 150px "Cormorant Garamond"';
  ctx.fillText(page.title || "Fim", PW / 2, 660);

  ctx.font = 'italic 500 40px "Cormorant Garamond"';
  ctx.fillStyle = "#6d5c42";
  page.poem.forEach((l, i) => ctx.fillText(l, PW / 2, 780 + i * 56));
  diamond(ctx, PW / 2, 950, 8, "#b08d4f");
  drawFolio(ctx, page);
}

/** Desenha uma página completa (miolo) no canvas. */
export function drawPage(
  ctx: CanvasRenderingContext2D,
  page: BookPage,
  asset: ArtAsset | null,
  book: BookMeta,
) {
  fillPaper(ctx, PW, PH);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  switch (page.kind) {
    case "title":
      drawTitlePage(ctx, page, book);
      return;
    case "interlude":
      drawInterlude(ctx, page);
      return;
    case "finale":
      drawFinale(ctx, page);
      return;
    default: {
      if (asset) drawPicture(ctx, page, asset);
      drawTitleBlock(ctx, page);
      drawFolio(ctx, page);
    }
  }
}

/* ================================================================== */
/*  Capa                                                               */
/* ================================================================== */

export function drawCover(ctx: CanvasRenderingContext2D, book: BookMeta, asset: ArtAsset | null) {
  // tecido verde profundo
  ctx.fillStyle = "#22392b";
  ctx.fillRect(0, 0, PW, PH);
  const vg = ctx.createRadialGradient(PW / 2, PH * 0.4, 120, PW / 2, PH / 2, PH * 0.9);
  vg.addColorStop(0, "rgba(84,120,88,0.30)");
  vg.addColorStop(1, "rgba(8,16,10,0.55)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, PW, PH);
  grain(ctx, PW, PH, 5200, 0.06);

  // molduras douradas duplas
  ctx.strokeStyle = "#c9a25e";
  ctx.lineWidth = 3;
  roundedPath(ctx, 38, 38, PW - 76, PH - 76, 26);
  ctx.stroke();
  ctx.lineWidth = 1.2;
  roundedPath(ctx, 56, 56, PW - 112, PH - 112, 20);
  ctx.stroke();

  // prato central com a arte de capa (enquadramento vindo do banco)
  const inner = { x: 130, y: 176, w: PW - 260, h: 612 };
  const image = asset
    ? pictureRect(book.coverLayout, { width: asset.img.width, height: asset.img.height }, inner)
    : inner;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = "#182b1f";
  roundedPath(ctx, image.x - 9, image.y - 9, image.w + 18, image.h + 18, 16);
  ctx.fill();
  ctx.restore();

  if (asset) {
    ctx.save();
    roundedPath(ctx, image.x, image.y, image.w, image.h, 10);
    ctx.clip();
    drawCoverFit(ctx, asset.img, image.x, image.y, image.w, image.h);
    ctx.restore();
  }

  ctx.strokeStyle = "#c9a25e";
  ctx.lineWidth = 2;
  roundedPath(ctx, image.x - 9, image.y - 9, image.w + 18, image.h + 18, 16);
  ctx.stroke();

  // ornamento
  diamond(ctx, PW / 2, 862, 10, "#c9a25e");
  ctx.strokeStyle = "rgba(201,162,94,0.7)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(PW / 2 - 150, 862);
  ctx.lineTo(PW / 2 - 40, 862);
  ctx.moveTo(PW / 2 + 40, 862);
  ctx.lineTo(PW / 2 + 150, 862);
  ctx.stroke();

  // título dourado, quebrado em até duas linhas conforme a largura
  ctx.textAlign = "center";
  letterSpacing(ctx, 10);
  ctx.font = '600 92px "Fraunces"';
  const words = book.title.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test.toUpperCase()).width > PW - 260 && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = "#dfbe80";
  const startY = 990 - (lines.length - 1) * 52;
  lines.forEach((l, i) => ctx.fillText(l.toUpperCase(), PW / 2, startY + i * 104));
  ctx.restore();

  letterSpacing(ctx, 9);
  ctx.fillStyle = "#c2a166";
  ctx.font = '500 36px "Cormorant Garamond"';
  ctx.fillText(book.author.toUpperCase(), PW / 2, 1200);
  letterSpacing(ctx, 4);
  ctx.font = '500 22px "Cormorant Garamond"';
  ctx.fillStyle = "rgba(194,161,102,0.08)";
  ctx.fillStyle = "#a98f5b";
  ctx.fillText((book.publisher || "").toUpperCase(), PW / 2, 1252);
  letterSpacing(ctx, 0);

  diamond(ctx, PW / 2, 1300, 7, "#c9a25e");
}

/* ================================================================== */
/*  Texturas secundárias (tecido, guarda, corte, lombada)              */
/* ================================================================== */

export function drawCloth(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#22392b";
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, 3000, 0.07);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 0, w, 14);
  ctx.fillRect(0, h - 14, w, 14);
  ctx.fillRect(0, 0, 14, h);
  ctx.fillRect(w - 14, 0, 14, h);
}

export function drawEndpaper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#e7dcc0";
  ctx.fillRect(0, 0, w, h);
  const step = 128;
  ctx.strokeStyle = "rgba(122,108,70,0.22)";
  ctx.lineWidth = 2;
  for (let y = step / 2; y < h + step; y += step) {
    for (let x = step / 2; x < w + step; x += step) {
      const flip = ((x + y) / step) % 2 === 0 ? 1 : -1;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(flip, 1);
      ctx.beginPath();
      ctx.moveTo(0, 26);
      ctx.quadraticCurveTo(4, 4, 0, -26);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.quadraticCurveTo(18, -14, 24, -30);
      ctx.quadraticCurveTo(8, -26, 0, -6);
      ctx.fillStyle = "rgba(122,108,70,0.16)";
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.quadraticCurveTo(-18, 4, -24, -12);
      ctx.quadraticCurveTo(-8, -8, 0, 12);
      ctx.fill();
      ctx.restore();
    }
  }
  grain(ctx, w, h, 2200, 0.03);
}

export function drawEdge(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#efe5cf";
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 3) {
    ctx.fillStyle = `rgba(150,126,80,${0.08 + (y % 9 === 0 ? 0.1 : 0)})`;
    ctx.fillRect(0, y, w, 1);
  }
  grain(ctx, w, h, 900, 0.05);
}

/** Lombada: tecido + rótulo dourado escrito no sentido da altura do livro. */
export function drawSpine(ctx: CanvasRenderingContext2D, w: number, h: number, book: BookMeta) {
  drawCloth(ctx, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.strokeStyle = "#c9a25e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-h / 2 + 90, -w * 0.22);
  ctx.lineTo(h / 2 - 90, -w * 0.22);
  ctx.moveTo(-h / 2 + 90, w * 0.22);
  ctx.lineTo(h / 2 - 90, w * 0.22);
  ctx.stroke();

  letterSpacing(ctx, 6);
  ctx.fillStyle = "#dfbe80";
  ctx.font = '500 42px "Fraunces"';
  ctx.fillText((book.spineLabel || `${book.title} · ${book.author}`).toUpperCase(), 0, 0);
  letterSpacing(ctx, 0);
  ctx.restore();
}
