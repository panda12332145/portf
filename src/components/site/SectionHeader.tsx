import type { ReactNode } from "react";

/** Cabeçalho padrão das seções da home (numeração + título + descrição). */
export function SectionHeader({
  eyebrow,
  title,
  lede,
  aside,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-sun-300">{eyebrow}</p>
        <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-cream md:text-5xl">
          {title}
        </h2>
      </div>
      <div className="max-w-sm">
        {lede ? <p className="text-sm leading-relaxed text-cream/65">{lede}</p> : null}
        {aside ? <div className="mt-3">{aside}</div> : null}
      </div>
    </header>
  );
}
