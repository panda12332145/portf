import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);

/** Troca *trechos* por <em> nos textos vindos do banco. */
export function splitEmphasis(text: string): Array<{ text: string; em: boolean }> {
  return text
    .split(/\*(.+?)\*/g)
    .filter((p) => p !== "")
    .map((part, i) => ({ text: part, em: i % 2 === 1 }));
}

/**
 * Troca {marcadores} por valores — usado nos textos editáveis do banco,
 * como "As {obras} obras do estúdio e as {paginas} páginas de *{livro}*".
 */
export function fillTemplate(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (whole, key: string) => values[key] ?? whole);
}
