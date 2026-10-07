"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Image as ImageIcon, Maximize2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { BookPage } from "@/lib/types";
import { ArtLightbox, type LightboxItem } from "./ArtLightbox";

const KIND_LABEL: Record<BookPage["kind"], string> = {
  title: "folha de rosto",
  art: "ilustração",
  interlude: "interlúdio",
  finale: "página final",
};

/** Prateleira com todas as páginas do livro (o que existe em public/book/). */
export default function BookPlates({ pages }: { pages: BookPage[] }) {
  const [index, setIndex] = useState<number | null>(null);

  const illustrated = pages.filter((p) => p.image);
  const items: LightboxItem[] = illustrated.map((p) => ({
    slug: p.slug,
    image: p.image as string,
    title: p.title,
    type: p.type,
    description: p.description,
    poem: p.poem,
  }));

  return (
    <>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {pages.map((page, i) => {
          const artIndex = illustrated.findIndex((p) => p.slug === page.slug);
          const clickable = artIndex >= 0;
          return (
            <motion.button
              key={page.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: (i % 4) * 0.04, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => clickable && setIndex(artIndex)}
              disabled={!clickable}
              className={cn(
                "group relative overflow-hidden rounded-lg border border-cream/12 bg-[#efe4cb] text-left",
                clickable ? "cursor-zoom-in" : "cursor-default",
              )}
              style={{ aspectRatio: "1024 / 1350" }}
            >
              {page.image ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={page.image}
                    alt={page.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-2.5 grid h-7 w-7 translate-y-1 place-items-center rounded-full border border-cream/25 bg-black/45 text-cream/85 opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <Maximize2 size={12} />
                  </span>
                </>
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center">
                  <FileText className="h-5 w-5 text-[#a8843e]" strokeWidth={1.5} />
                  <span className="font-book text-lg italic leading-tight text-[#5c4c33]">
                    {page.title}
                  </span>
                </span>
              )}

              <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-3 pb-2.5 pt-8">
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-semibold text-cream">
                    {String(page.order).padStart(2, "0")} · {page.title}
                  </span>
                  <span className="block truncate text-[10px] text-cream/55">
                    {KIND_LABEL[page.kind]}
                    {page.folio ? ` · pág. ${page.folio}` : ""}
                  </span>
                </span>
                {page.image ? (
                  <ImageIcon size={12} className="shrink-0 text-cream/60" />
                ) : null}
              </span>
            </motion.button>
          );
        })}
      </div>

      <ArtLightbox items={items} index={index} onIndexChange={setIndex} onClose={() => setIndex(null)} />
    </>
  );
}
