import * as THREE from "three";
import { SIDES, sheetSides, SHEET_COUNT, COVER, BOOK } from "@/lib/book-data";

/* ------------------------------------------------------------------ */
/*  Texturas do livro desenhadas em canvas — papel, capa, guardas      */
/* ------------------------------------------------------------------ */

export interface SheetTextures {
  front: THREE.Texture;
  back: THREE.Texture;
}

export interface BookTextures {
  cover: THREE.Texture;
  cloth: THREE.Texture;
  endpaper: THREE.Texture;
  edge: THREE.Texture;
  sheets: SheetTextures[];
}

export const PW = 1024; // largura da página (canvas)
export const PH = 1350; // altura da página

/** Retângulo (em pixels do canvas da página) onde a ilustração é desenhada. */
export const PAGE_ART_RECT = { x: 84, y: 96, w: PW - 168, h: 768 };

/* ----------------------------- helpers ---------------------------- */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function ensureFonts() {
  const specs = [
    "italic 600 150px",
    "600 92px",
    "600 64px",
    "500 40px",
    "600 56px",
    "italic 500 40px",
    "500 30px",
  ];
  await Promise.all(specs.map((s) => document.fonts.load(`${s} "Cormorant Garamond"`)));
  await document.fonts.ready;
}

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
}

/** ruído suave de papel */
function grain(ctx: CanvasRenderingContext2D, w: number, h: number, n = 2600, alpha = 0.045) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const v = 120 + Math.random() * 110;
    ctx.fillStyle = `rgba(${v}, ${v * 0.86}, ${v * 0.6}, ${Math.random() * alpha})`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }
}

function roundedPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** desenha a imagem "cover-fit" dentro da caixa */
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
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
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/** preenche o fundo de papel envelhecido */
function fillPaper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#f6eeda";
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w / 2, h * 0.42, h * 0.1, w / 2, h / 2, h * 0.85);
  g.addColorStop(0, "rgba(255,252,240,0.55)");
  g.addColorStop(1, "rgba(196,171,124,0.20)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // bordas deckled
  for (let i = 0; i < 4; i++) {
    const top = ctx.createLinearGradient(0, 0, 0, 54);
    top.addColorStop(0, "rgba(141,116,70,0.13)");
    top.addColorStop(1, "rgba(141,116,70,0)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, w, 54);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(Math.PI);
    ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, w, 54);
    ctx.restore();
    const left = ctx.createLinearGradient(0, 0, 46, 0);
    left.addColorStop(0, "rgba(141,116,70,0.11)");
    left.addColorStop(1, "rgba(141,116,70,0)");
    ctx.fillStyle = left;
    ctx.fillRect(0, 0, 46, h);
    const right = ctx.createLinearGradient(w, 0, w - 46, 0);
    right.addColorStop(0, "rgba(141,116,70,0.11)");
    right.addColorStop(1, "rgba(141,116,70,0)");
    ctx.fillStyle = right;
    ctx.fillRect(w - 46, 0, 46, h);
  }
  // fibras
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
      y + 30 - Math.random() * 60
    );
    ctx.stroke();
  }
  grain(ctx, w, h);
}

function diamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = color;
  ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.restore();
}

/* --------------------------- construtores ------------------------- */

function drawPageSide(ctx: CanvasRenderingContext2D, index: number, img?: HTMLImageElement) {
  const side = SIDES[index];
  fillPaper(ctx, PW, PH);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  if (side.finale) {
    // -------- página final ----------
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
    ctx.fillText(side.title ?? "Fim", PW / 2, 640);
    ctx.font = 'italic 500 40px "Cormorant Garamond"';
    ctx.fillStyle = "#6d5c42";
    (side.poem ?? []).forEach((l, i) => ctx.fillText(l, PW / 2, 756 + i * 56));
    diamond(ctx, PW / 2, 930, 8, "#b08d4f");
    return;
  }

  // -------- página ilustrada ----------
  const { x: ax, y: ay, w: aw, h: ah } = PAGE_ART_RECT;

  // sombra da moldura
  ctx.save();
  ctx.shadowColor = "rgba(74,54,24,0.28)";
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#efe3c6";
  roundedPath(ctx, ax - 10, ay - 10, aw + 20, ah + 20, 20);
  ctx.fill();
  ctx.restore();

  if (img) {
    ctx.save();
    roundedPath(ctx, ax, ay, aw, ah, 12);
    ctx.clip();
    drawCoverImage(ctx, img, ax, ay, aw, ah);
    // véu de papel sobre a arte para unir a paleta
    ctx.fillStyle = "rgba(244,232,200,0.10)";
    ctx.fillRect(ax, ay, aw, ah);
    ctx.restore();
  }
  ctx.strokeStyle = "rgba(96,74,40,0.35)";
  ctx.lineWidth = 1.6;
  roundedPath(ctx, ax, ay, aw, ah, 12);
  ctx.stroke();

  // título + poema
  ctx.fillStyle = "#443826";
  ctx.font = '600 56px "Cormorant Garamond"';
  ctx.fillText(side.title ?? "", PW / 2, 1002);

  ctx.strokeStyle = "rgba(120,95,50,0.5)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(PW / 2 - 60, 1034);
  ctx.lineTo(PW / 2 + 60, 1034);
  ctx.stroke();
  diamond(ctx, PW / 2, 1034, 7, "#b08d4f");

  ctx.font = 'italic 500 40px "Cormorant Garamond"';
  ctx.fillStyle = "#6a5a40";
  (side.poem ?? []).forEach((l, i) => ctx.fillText(l, PW / 2, 1108 + i * 54));

  if (side.folio) {
    ctx.font = '500 30px "Cormorant Garamond"';
    ctx.fillStyle = "#97835d";
    ctx.fillText(`—  ${side.folio}  —`, PW / 2, 1296);
  }
}

/* ------------------------------ capa ------------------------------ */

function drawCover(ctx: CanvasRenderingContext2D, img?: HTMLImageElement) {
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

  // arte central
  const ax = 130;
  const ay = 178;
  const aw = PW - 260;
  const ah = 620;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = "#182b1f";
  roundedPath(ctx, ax - 8, ay - 8, aw + 16, ah + 16, 16);
  ctx.fill();
  ctx.restore();
  if (img) {
    ctx.save();
    roundedPath(ctx, ax, ay, aw, ah, 10);
    ctx.clip();
    drawCoverImage(ctx, img, ax, ay, aw, ah);
    ctx.restore();
  }
  ctx.strokeStyle = "#c9a25e";
  ctx.lineWidth = 2;
  roundedPath(ctx, ax - 8, ay - 8, aw + 16, ah + 16, 16);
  ctx.stroke();

  // ornamento
  diamond(ctx, PW / 2, 878, 10, "#c9a25e");
  ctx.strokeStyle = "rgba(201,162,94,0.7)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(PW / 2 - 150, 878);
  ctx.lineTo(PW / 2 - 40, 878);
  ctx.moveTo(PW / 2 + 40, 878);
  ctx.lineTo(PW / 2 + 150, 878);
  ctx.stroke();

  // título dourado em duas linhas
  const anyCtx = ctx as unknown as { letterSpacing?: string };
  if ("letterSpacing" in ctx) anyCtx.letterSpacing = "10px";
  ctx.textAlign = "center";
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = "#dfbe80";
  ctx.font = '600 96px "Cormorant Garamond"';
  const words = BOOK.title.toUpperCase().split(" ");
  const firstLine = words.slice(0, 2).join(" ");
  const secondLine = words.slice(2).join(" ");
  ctx.fillText(firstLine, PW / 2, 1005);
  ctx.fillText(secondLine, PW / 2, 1108);
  ctx.restore();

  if ("letterSpacing" in ctx) anyCtx.letterSpacing = "9px";
  ctx.fillStyle = "#c2a166";
  ctx.font = '500 36px "Cormorant Garamond"';
  ctx.fillText(BOOK.author.toUpperCase(), PW / 2, 1206);
  if ("letterSpacing" in ctx) anyCtx.letterSpacing = "0px";

  diamond(ctx, PW / 2, 1276, 8, "#c9a25e");
}

/* ---------------------------- secundárias ------------------------- */

function drawCloth(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#22392b";
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, 3000, 0.07);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 0, w, 14);
  ctx.fillRect(0, h - 14, w, 14);
  ctx.fillRect(0, 0, 14, h);
  ctx.fillRect(w - 14, 0, 14, h);
}

function drawEndpaper(ctx: CanvasRenderingContext2D, w: number, h: number) {
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

function drawEdge(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#efe5cf";
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 3) {
    ctx.fillStyle = `rgba(150,126,80,${0.08 + (y % 9 === 0 ? 0.1 : 0)})`;
    ctx.fillRect(0, y, w, 1);
  }
  grain(ctx, w, h, 900, 0.05);
}

/* ------------------------------ build ----------------------------- */

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
 * A capa frontal é modelada como a face "-Y" de uma caixa que, quando o
 * livro está fechado, sofre uma rotação de 180° em torno do eixo da
 * lombada para ficar virada para cima. Sem compensar essa rotação, o
 * desenho (título + ilustração) aparece de cabeça para baixo — por isso
 * giramos a textura da capa 180° aqui, no sentido contrário.
 */
function toCoverTexture(canvas: HTMLCanvasElement): THREE.Texture {
  const tex = toTexture(canvas);
  tex.center.set(0.5, 0.5);
  tex.rotation = Math.PI;
  tex.needsUpdate = true;
  return tex;
}

export async function buildBookTextures(
  onStep?: (done: number, total: number) => void
): Promise<BookTextures> {
  const total = 1 + 10 + 5 + 4;
  let done = 0;
  const step = () => onStep?.(++done, total);

  await ensureFonts();
  step();

  const srcs = [COVER.image as string, ...SIDES.filter((s) => s.image).map((s) => s.image!)];
  const imgs = new Map<string, HTMLImageElement>();
  await Promise.all(
    srcs.map(async (src) => {
      imgs.set(src, await loadImage(src));
      step();
    })
  );

  const sheets: SheetTextures[] = [];
  for (let i = 0; i < SHEET_COUNT; i++) {
    const { front, back } = sheetSides(i);
    const f = makeCanvas(PW, PH);
    drawPageSide(f.ctx, SIDES.indexOf(front), front.image ? imgs.get(front.image) : undefined);
    const b = makeCanvas(PW, PH);
    drawPageSide(b.ctx, SIDES.indexOf(back), back.image ? imgs.get(back.image) : undefined);
    sheets.push({ front: toTexture(f.canvas), back: toTexture(b.canvas, true) });
    step();
  }

  const coverC = makeCanvas(PW, PH);
  drawCover(coverC.ctx, imgs.get(COVER.image as string));
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

  return {
    cover: toCoverTexture(coverC.canvas),
    cloth: toTexture(clothC.canvas),
    endpaper: toTexture(endC.canvas),
    edge: (() => {
      const t = toTexture(edgeC.canvas);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    })(),
    sheets,
  };
}
