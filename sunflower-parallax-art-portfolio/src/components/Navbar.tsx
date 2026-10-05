import { useEffect, useState } from "react";
import { Flower2 } from "lucide-react";
import { useScrollTo } from "../lib/scroll";
import { cn } from "../utils/cn";

const links = [
  { label: "Sobre", target: "#sobre" },
  { label: "Portfólio", target: "#portfolio" },
  { label: "FAQ", target: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollTo } = useScrollTo();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled
          ? "border-b border-cream/10 bg-soil-900/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-12">
        <a
          href="#sobre"
          onClick={(e) => {
            e.preventDefault();
            scrollTo("#sobre");
          }}
          className="flex items-center gap-2.5"
        >
          <Flower2 size={18} className="text-sun-400" />
          <span className="text-sm font-bold tracking-tight text-cream">
            Atelier Girassol
          </span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.target}>
              <a
                href={l.target}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(l.target);
                }}
                className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cream/65 transition-colors hover:text-cream"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          onClick={() => scrollTo("#comissoes")}
          className="rounded-md border border-cream/25 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cream transition-colors duration-300 hover:border-sun-400 hover:bg-sun-400 hover:text-ink"
        >
          Comissões
        </button>
      </nav>
    </header>
  );
}
