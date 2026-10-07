"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import type { SiteContent } from "@/lib/types";
import { cn } from "@/lib/cn";
import { SiteIcon } from "./Icon";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ site }: { site: SiteContent }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // fecha o menu mobile quando a tela cresce
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // rótulos dos links e do botão vêm do banco (editáveis no /admin)
  const links = [
    { label: site.navAboutLabel, target: "#sobre" },
    { label: site.navBookLabel, target: "#livro" },
    { label: site.navFaqLabel, target: "#faq" },
  ];

  const linkCls = "text-[13px] font-medium text-cream/70 transition-colors hover:text-cream";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        // no topo o menu vive sobre a foto → mantém o tipo claro nos dois temas
        !scrolled && !open && "scope-dark",
        scrolled || open
          ? "border-b border-cream/10 bg-soil-900/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:px-12">
        <a href="#sobre" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <SiteIcon name={site.siteIcon} size={18} className="text-sun-400" />
          <span className="text-sm font-bold tracking-tight text-cream">{site.name}</span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.target}>
              <a href={l.target} className={linkCls}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2.5">
          <ThemeToggle compact />
          <a
            href="#comissoes"
            className="hidden rounded-md border border-cream/25 px-4 py-2 text-[13px] font-semibold text-cream transition-colors duration-300 hover:border-sun-400 hover:bg-sun-400 hover:text-ink sm:inline-block"
          >
            {site.navCtaLabel}
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="grid h-9 w-9 place-items-center rounded-md border border-cream/15 text-cream/80 transition-colors hover:bg-cream/10 hover:text-cream md:hidden"
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </nav>

      {/* menu mobile */}
      {open && (
        <div className="border-b border-cream/10 bg-soil-900/95 px-5 pb-6 pt-2 backdrop-blur-md md:hidden">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.target}>
                <a
                  href={l.target}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-[15px] font-medium text-cream/80 transition-colors hover:text-sun-200"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#comissoes"
            onClick={() => setOpen(false)}
            className="mt-3 block rounded-md bg-strong px-4 py-2.5 text-center text-[14px] font-semibold text-on-strong transition-opacity hover:opacity-90"
          >
            {site.navCtaLabel}
          </a>
        </div>
      )}
    </header>
  );
}
