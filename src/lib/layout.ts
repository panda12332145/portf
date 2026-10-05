/**
 * ------------------------------------------------------------------
 *  Geometria do livro — constantes do canvas e enquadramento das artes
 * ------------------------------------------------------------------
 *  Módulo puro (roda no servidor e no cliente): usado pelo seed do SQLite,
 *  pelo desenho das páginas em canvas e pelo editor /estudio.
 * ------------------------------------------------------------------
 */

/** Tamanho do canvas de cada página (proporção ≈ 0,758 — a mesma da folha 3D). */
export const PAGE = { W: 1024, H: 1350 };

/** Caixa máxima onde a ilustração pode ser desenhada. */
export const ART_AREA = { x: 88, y: 100, w: 848, h: 756 };

/** Linhas-guia do texto abaixo da arte. */
export const TEXT_ZONE = {
  titleY: 1008,
  ruleY: 1042,
  mediumY: 1084,
  poemY: 1146,
  folioY: 1298,
};

export type Fit = "contain" | "cover";
export type Frame = "plate" | "bleed" | "none";
export type Backdrop = "blur" | "tint" | "paper" | "none";
export type MountTone = "paper" | "ink";

export interface PageLayout {
  fit: Fit;
  frame: Frame;
  backdrop: Backdrop;
  mountTone: MountTone;
  /** 0.4 – 2.5 */
  zoom: number;
  /** -45 – 45 (% da área) */
  offsetX: number;
  offsetY: number;
  /** -18 – 18 graus */
  rotation: number;
  /** raio dos cantos, em px do canvas */
  radius: number;
  /** respiro entre imagem e moldura, em px do canvas */
  platePad: number;
  shadow: boolean;
}

export const DEFAULT_LAYOUT: PageLayout = {
  fit: "contain",
  frame: "plate",
  backdrop: "none",
  mountTone: "paper",
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  radius: 8,
  platePad: 26,
  shadow: true,
};

export const clamp = (v: number, min: number, max: number) =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;

/** Normaliza/sanitiza um layout vindo do banco, da API ou do editor. */
export function clampLayout(input: Partial<PageLayout> | null | undefined): PageLayout {
  const l = { ...DEFAULT_LAYOUT, ...(input ?? {}) };
  const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(v as T) ? (v as T) : fallback;

  return {
    fit: oneOf(l.fit, ["contain", "cover"] as const, "contain"),
    frame: oneOf(l.frame, ["plate", "bleed", "none"] as const, "plate"),
    backdrop: oneOf(l.backdrop, ["blur", "tint", "paper", "none"] as const, "none"),
    mountTone: oneOf(l.mountTone, ["paper", "ink"] as const, "paper"),
    zoom: clamp(Number(l.zoom), 0.4, 2.5),
    offsetX: clamp(Number(l.offsetX), -45, 45),
    offsetY: clamp(Number(l.offsetY), -45, 45),
    rotation: clamp(Number(l.rotation), -18, 18),
    radius: clamp(Number(l.radius), 0, 90),
    platePad: clamp(Number(l.platePad), 0, 120),
    shadow: Boolean(l.shadow),
  };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Proporção da imagem (largura/altura) com fallback seguro. */
export const aspectOf = (img: { width: number; height: number } | null) =>
  img && img.width > 0 && img.height > 0 ? img.width / img.height : PAGE.W / PAGE.H;

/**
 * Quanto da área a imagem cobre quando encaixada inteira (contain).
 * Serve para decidir se vale um fundo desfocado (imagens muito largas/altas).
 */
export function areaFill(img: { width: number; height: number } | null, area: Rect = ART_AREA) {
  if (!img) return 1;
  const s = Math.min(area.w / img.width, area.h / img.height);
  return (img.width * s * (img.height * s)) / (area.w * area.h);
}

/**
 * Enquadramento automático — o mesmo que é gravado no SQLite no build e
 * recalculado pelo botão "recalcular" do /estudio.
 *
 *  • retrato  → prato alto, centrado;
 *  • quadrada → prato quadrado;
 *  • paisagem → prato panorâmico com respiro maior;
 *  • imagens que preenchem pouco a área ganham fundo desfocado da própria
 *    arte (efeito de "cartão de museu"), para nunca ficar com buraco branco.
 */
export function autoLayout(img: { width: number; height: number } | null): PageLayout {
  if (!img) return { ...DEFAULT_LAYOUT };
  const ar = aspectOf(img);
  const fill = areaFill(img);
  const panoramic = ar >= 1.45;
  const tall = ar <= 0.72;

  return {
    ...DEFAULT_LAYOUT,
    fit: "contain",
    frame: "plate",
    backdrop: fill < 0.6 ? "blur" : "none",
    mountTone: "paper",
    zoom: 1,
    offsetY: 0,
    rotation: 0,
    radius: panoramic ? 5 : tall ? 10 : 8,
    platePad: panoramic ? 30 : 26,
    shadow: true,
  };
}

/**
 * Retângulo final da imagem na página, já com zoom, deslocamento e
 * enquadramento (contain = inteira visível, cover = preenche e recorta).
 */
export function pictureRect(
  layout: PageLayout,
  img: { width: number; height: number } | null,
  area: Rect = ART_AREA,
): Rect {
  const iw = img?.width ?? 1024;
  const ih = img?.height ?? 1350;
  const base =
    layout.fit === "cover"
      ? Math.max(area.w / iw, area.h / ih)
      : Math.min(area.w / iw, area.h / ih);
  const scale = base * layout.zoom;
  const w = iw * scale;
  const h = ih * scale;
  const cx = area.x + area.w / 2 + (layout.offsetX / 100) * area.w;
  const cy = area.y + area.h / 2 + (layout.offsetY / 100) * area.h;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/** Rótulos usados pelo editor visual. */
export const LAYOUT_LABELS = {
  fit: { contain: "Inteira (encaixa)", cover: "Preencher (recorta)" },
  frame: { plate: "Moldura", bleed: "Sangrada", none: "Sem moldura" },
  backdrop: { blur: "Fundo desfocado", tint: "Fundo tonal", paper: "Papel", none: "Nenhum" },
  mountTone: { paper: "Papel claro", ink: "Tinta escura" },
} as const;
