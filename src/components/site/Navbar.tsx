"use client";

import { useEffect, useState } from "react";
import type { SiteContent } from "@/lib/types";
import { cn } from "@/lib/cn";
import { SiteIcon } from "./Icon";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ site }: { site: SiteContent }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // rótulos dos links e do botão vêm do banco (editáveis no /admin)
  const links = [
    { label: site.navAboutLabel, target: "#sobre" },
    { label: site.navBookLabel, target: "#livro" },
    { label: site.navPortfolioLabel, target: "#portfolio" },
    { label: site.navFaqLabel, target: "#faq" },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        // no topo o menu vive sobre a foto → mantém o tipo claro nos dois temas
        !scrolled && "scope-dark",
        scrolled
          ? "border-b border-cream/10 bg-soil-900/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:px-12">
        <a href="#sobre" className="flex items-center gap-2.5">
          <SiteIcon name={site.siteIcon} size={18} className="text-sun-400" />
          <span className="text-sm font-bold tracking-tight text-cream">{site.name}</span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.target}>
              <a
                href={l.target}
                className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cream/65 transition-colors hover:text-cream"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2.5">
          <ThemeToggle compact />
          <a
            href="#comissoes"
            className="hidden rounded-md border border-cream/25 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cream transition-colors duration-300 hover:border-sun-400 hover:bg-sun-400 hover:text-ink sm:inline-block"
          >
            {site.navCtaLabel}
          </a>
        </div>
      </nav>
    </header>
  );
}
