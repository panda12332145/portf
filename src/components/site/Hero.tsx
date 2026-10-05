"use client";

import { motion } from "framer-motion";
import { ArrowDown, BookOpen, ChevronDown } from "lucide-react";
import { splitEmphasis } from "@/lib/cn";
import type { SiteContent } from "@/lib/types";

const container = { show: { transition: { staggerChildren: 0.11, delayChildren: 0.1 } } };
const item = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Hero({ site }: { site: SiteContent }) {
  return (
    <section id="sobre" className="relative min-h-[100svh] px-5 md:px-12">
      <motion.div
        initial="hidden"
        animate="show"
        variants={container}
        className="mx-auto grid min-h-[100svh] w-full max-w-6xl items-end gap-12 pb-24 pt-32 lg:grid-cols-[1fr_auto]"
      >
        <div className="max-w-2xl">
          <motion.p
            variants={item}
            className="text-[11px] font-semibold uppercase tracking-[0.32em] text-sun-200"
          >
            {site.heroEyebrow}
          </motion.p>

          <motion.h1
            variants={item}
            className="mt-6 font-display text-4xl font-medium leading-[1.12] tracking-tight text-cream md:text-6xl"
          >
            {splitEmphasis(site.heroTitle).map((part, i) =>
              part.em ? (
                <em key={i} className="italic text-sun-300">
                  {part.text}
                </em>
              ) : (
                <span key={i}>{part.text}</span>
              ),
            )}
          </motion.h1>

          <motion.p variants={item} className="mt-7 text-base leading-relaxed text-cream/85 md:text-lg">
            {site.heroLede}
          </motion.p>

          <motion.p variants={item} className="mt-4 max-w-xl text-sm leading-relaxed text-cream/60">
            {site.heroNote}
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <a
              href="#comissoes"
              className="rounded-md bg-ink px-6 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-cream transition-colors duration-300 hover:bg-black"
            >
              Pedir uma comissão
            </a>
            <a
              href="#livro"
              className="group flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-cream/80 transition-colors hover:text-cream"
            >
              <span className="border-b border-cream/30 pb-0.5 transition-colors group-hover:border-cream">
                Abrir o livro
              </span>
              <BookOpen size={13} />
            </a>
            <a
              href="#portfolio"
              className="group flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-cream/60 transition-colors hover:text-cream"
            >
              <span className="border-b border-cream/20 pb-0.5 transition-colors group-hover:border-cream/60">
                Ver portfólio
              </span>
              <ArrowDown size={13} />
            </a>
          </motion.div>

          <motion.div
            variants={item}
            className="mt-12 flex flex-wrap gap-x-10 gap-y-3 border-t border-cream/15 pt-6"
          >
            {site.stats.map((s) => (
              <span
                key={s}
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cream/55"
              >
                {s}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.figure variants={item} className="hidden max-w-xs md:block lg:w-80 xl:w-96">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={site.heroImage}
            alt={site.heroCaption}
            className="aspect-[3/4] w-full rounded-lg border border-cream/20 object-cover"
          />
          <figcaption className="mt-2 text-[11px] text-cream/55">{site.heroCaption}</figcaption>
        </motion.figure>
      </motion.div>

      <motion.a
        href="#livro"
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-cream/50 transition-colors hover:text-cream md:flex"
        aria-label="Rolar para o livro"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.32em]">role</span>
        <ChevronDown size={14} />
      </motion.a>
    </section>
  );
}
