import raw from "@/data/book-data.json";

export interface ArtData {
  order: number;
  slug: string;
  title: string;
  type: string;
  description: string;
  image: string | null;
  folio: number | null;
  poem?: string[];
  isCover?: boolean;
  finale?: boolean;
}

export interface BookData {
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  description: string;
}

export const BOOK: BookData = raw.book;
export const ARTS: ArtData[] = raw.arts as ArtData[];

export const COVER = ARTS.find((a) => a.isCover)!;
/** Páginas ilustradas, em ordem de leitura (sem a capa e sem a página final). */
export const PAGE_ARTS = ARTS.filter((a) => !a.isCover && !a.finale);
export const FINALE = ARTS.find((a) => a.finale)!;

/** Todas as "sides" (frente/verso de cada folha), equivalente ao miolo do livro. */
export const SIDES = [...PAGE_ARTS, FINALE];

export const SHEET_COUNT = Math.ceil(SIDES.length / 2);

export function sheetSides(sheetIndex: number): { front: ArtData; back: ArtData } {
  return {
    front: SIDES[sheetIndex * 2],
    back: SIDES[sheetIndex * 2 + 1] ?? SIDES[SIDES.length - 1],
  };
}

export function artByOrder(order: number): ArtData | undefined {
  return ARTS.find((a) => a.order === order);
}
