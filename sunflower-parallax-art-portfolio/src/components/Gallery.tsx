import { motion } from "framer-motion";
import { artworks, type Artwork } from "../data";
import { cn } from "../utils/cn";

function ArtCard({ art, index }: { art: Artwork; index: number }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={cn("group", art.className)}
    >
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-cream/15",
          art.aspect,
        )}
      >
        <img
          src={art.src}
          alt={art.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <figcaption className="mt-3 flex items-baseline justify-between gap-4 border-t border-cream/15 pt-3">
        <div>
          <h3 className="text-sm font-semibold text-cream">{art.title}</h3>
          <p className="mt-0.5 text-xs text-cream/55">
            {art.medium} · {art.year}
          </p>
        </div>
        <span className="text-xs tabular-nums text-cream/40">
          {String(index + 1).padStart(2, "0")}
        </span>
      </figcaption>
    </motion.figure>
  );
}

export default function Gallery() {
  return (
    <section id="portfolio" className="relative px-5 pt-24 md:px-12 md:pt-36">
      <div className="mx-auto max-w-6xl">
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 flex flex-col gap-4 md:mb-16 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-sun-300">
              01 — Portfólio
            </p>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-cream md:text-5xl">
              Trabalhos recentes
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-cream/65">
            Seleção de peças tradicionais e digitais produzidas entre 2024 e
            2026.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-12">
          {artworks.map((art, i) => (
            <ArtCard key={art.src} art={art} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
