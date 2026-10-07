import type { PageLayout } from "./layout";

export type PageKind = "title" | "art" | "interlude" | "finale";

/** Uma página do miolo, já com enquadramento resolvido. */
export interface BookPage {
  id: number;
  order: number;
  slug: string;
  kind: PageKind;
  title: string;
  type: string;
  description: string;
  poem: string[];
  image: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  folio: number | null;
  layout: PageLayout;
  layoutAuto: boolean;
}

export interface BookMeta {
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  publisher: string;
  edition: string;
  description: string;
  dedication: string;
  spineLabel: string;
  coverImage: string;
  coverArtTitle: string;
  coverLayout: PageLayout;
}

export interface Artwork {
  slug: string;
  order: number;
  title: string;
  medium: string;
  year: string;
  image: string;
  imageWidth: number | null;
  imageHeight: number | null;
  span: number;
  shift: number;
  aspect: string;
  description: string;
  tags: string[];
  featured: boolean;
}

export interface Faq {
  question: string;
  answer: string;
  list: string[];
  footnote: string | null;
}

export interface CommissionType {
  slug: string;
  name: string;
  price: number;
}

/** Textos gerais do site vindos de site_meta (com fallback no componente). */
export type SiteContent = Record<string, string> & { stats: string[] };
