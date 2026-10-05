import { ArrowUp, Flower2 } from "lucide-react";
import { useScrollTo } from "../lib/scroll";

export default function Footer() {
  const { scrollTo } = useScrollTo();

  return (
    <footer className="relative z-10 border-t border-cream/10 px-5 py-10 md:px-12">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-2.5">
          <Flower2 size={15} className="text-sun-400" />
          <p className="text-xs text-cream/55">
            Atelier Girassol © 2026 —{" "}
            <a
              href="mailto:contato@ateliergirassol.art"
              className="underline decoration-cream/30 underline-offset-4 transition-colors hover:text-cream"
            >
              contato@ateliergirassol.art
            </a>
          </p>
        </div>

        <div className="flex items-center gap-8">
          <p className="text-xs text-cream/40">comissões abertas · BR</p>
          <button
            onClick={() => scrollTo("#sobre")}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-cream/60 transition-colors hover:text-cream"
          >
            Voltar ao topo
            <ArrowUp size={13} />
          </button>
        </div>
      </div>
    </footer>
  );
}
