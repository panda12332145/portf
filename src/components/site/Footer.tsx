import Link from "next/link";
import { ArrowUp, Flower2 } from "lucide-react";
import type { SiteContent } from "@/lib/types";

export default function Footer({ site }: { site: SiteContent }) {
  return (
    <footer className="relative z-10 border-t border-cream/10 px-5 py-10 md:px-12">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-2.5">
          <Flower2 size={15} className="text-sun-400" />
          <p className="text-xs text-cream/55">
            {site.name} © 2026 —{" "}
            <a
              href={`mailto:${site.email}`}
              className="underline decoration-cream/30 underline-offset-4 transition-colors hover:text-cream"
            >
              {site.email}
            </a>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 md:gap-8">
          <Link href="/galeria" className="text-[11px] font-bold uppercase tracking-[0.2em] text-cream/55 transition-colors hover:text-cream">
            Galeria
          </Link>
          <Link href="/estudio" className="text-[11px] font-bold uppercase tracking-[0.2em] text-cream/55 transition-colors hover:text-cream">
            Estúdio
          </Link>
          <p className="text-xs text-cream/40">{site.footerNote}</p>
          <a
            href="#sobre"
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-cream/60 transition-colors hover:text-cream"
          >
            Voltar ao topo
            <ArrowUp size={13} />
          </a>
        </div>
      </div>
    </footer>
  );
}
